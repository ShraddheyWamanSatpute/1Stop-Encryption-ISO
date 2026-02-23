import React, { useState, useEffect, Key } from "react";
import { Box, Typography, CircularProgress, TextField } from "@mui/material";
import { db } from "../services/firebase";
import { ref, get } from "firebase/database";

interface CompletedChecklist {
  id: Key | null | undefined;
  title: string;
  completedBy: string;
  completedDate: string;
  completedTime: string;
  completedAt: number; // Timestamp for sorting
}

const SignOffTracking: React.FC = () => {
  const [completedChecklists, setCompletedChecklists] = useState<CompletedChecklist[]>([]);
  const [filteredChecklists, setFilteredChecklists] = useState<CompletedChecklist[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    fetchCompletedChecklists();
  }, []);
  
  useEffect(() => {
    filterChecklists(searchTerm);
  }, [searchTerm, completedChecklists]);

  const fetchCompletedChecklists = async () => {
    setLoading(true);
  
    try {
      const completedChecklistsRef = ref(db, "completechecks");
      const snapshot = await get(completedChecklistsRef);
  
      if (snapshot.exists()) {
        const data = snapshot.val();
  
        // Ensure that the value is an object before spreading
        const completedChecklistArray = Object.entries(data).map(([key, value]) => {
          // Ensure that `value` is an object before trying to spread
          if (typeof value === "object" && value !== null) {
            return {
              id: key, // Add id from Firebase key
              ...value, // Spread the value as an object
            };
          }
          // In case `value` is not an object, return an empty object or handle accordingly
          return {
            id: key,
            title: "Unknown", // You can set defaults or handle this case differently
            completedBy: "Unknown",
            completedDate: "Unknown",
            completedTime: "Unknown",
            completedAt: 0, // Default timestamp
          };
        }) as CompletedChecklist[];
  
        // Sort the completed checklists by the completion date (timestamp)
        const sortedChecklists = completedChecklistArray.sort((a, b) => b.completedAt - a.completedAt);
  
        setCompletedChecklists(sortedChecklists);
        setFilteredChecklists(sortedChecklists);
      }
    } catch (err) {
      console.error("Error fetching completed checklists:", err);
    } finally {
      setLoading(false);
    }
  };
  

  // Filter checklists by title or who completed
  const filterChecklists = (search: string) => {
    const filtered = completedChecklists.filter(
      (checklist) =>
        checklist.title.toLowerCase().includes(search.toLowerCase()) ||
        checklist.completedBy.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredChecklists(filtered);
  };

  return (
    <Box>
      <Typography variant="h4">Completed Checklist Tracking</Typography>
      <TextField
        label="Search"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ marginBottom: 2, marginTop: 2, }}
      />

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {filteredChecklists.length === 0 ? (
            <Typography>No completed checklists available.</Typography>
          ) : (
            filteredChecklists.map((checklist) => (
              <Box key={checklist.id} sx={{ marginBottom: 2, padding: 2, border: "1px solid #ccc", borderRadius: "8px" }}>
                <Typography variant="h6">{checklist.title}</Typography>
                <Typography variant="body1">Completed By: {checklist.completedBy}</Typography>
                <Typography variant="body2">
                  Completed Date: {checklist.completedDate} at {checklist.completedTime}
                </Typography>
              </Box>
            ))
          )}
        </>
      )}
    </Box>
  );
};

export default SignOffTracking;
