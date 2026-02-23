import React, { useState, useEffect } from "react";
import { getDatabase, ref, get } from "firebase/database";
import { Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody, Typography, TableContainer } from "@mui/material";
import { format } from "date-fns";
import { getAuth } from "firebase/auth";

interface HolidayRequest {
  id: string;
  userName: string;
  role: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
}

const MyHolidays: React.FC = () => {
  const [requests, setRequests] = useState<HolidayRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.warn("No user is logged in.");
        setLoading(false);
        return;
      }
      const db = getDatabase();
      const requestsRef = ref(db, "holidays");
      const snapshot = await get(requestsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userRequests = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((req) => req.userId === user.uid);
        setRequests(userRequests);
      }
      setLoading(false);
    };

    fetchRequests();
  }, []);

  return (
    <Card sx={{ m: 2 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          My Holidays
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : requests.length === 0 ? (
          <Typography>You have no holiday requests.</Typography>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Role</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((req) => {
                  const formattedStartDate = format(new Date(req.startDate), "dd/MM/yyyy");
                  const formattedEndDate = format(new Date(req.endDate), "dd/MM/yyyy");

                  return (
                    <TableRow key={req.id}>
                      <TableCell>{req.role}</TableCell>
                      <TableCell>
                        {formattedStartDate} - {formattedEndDate}
                      </TableCell>
                      <TableCell>{req.reason}</TableCell>
                      <TableCell>{req.status}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default MyHolidays;
