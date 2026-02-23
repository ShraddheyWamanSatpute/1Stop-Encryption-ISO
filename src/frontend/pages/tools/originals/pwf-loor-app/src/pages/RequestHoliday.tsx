import React, { useState } from "react";
import { getDatabase, ref, push } from "firebase/database";
import { TextField, Button, Typography, Card, CardContent } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useLogIn } from "../context/LogInContext"; // Import LoginContext
import { useRole } from "../context/RoleContext"; // Import RoleContext

interface HolidayRequest {
  startDate: Date | null;
  endDate: Date | null;
  reason: string;
}

const RequestHoliday: React.FC = () => {
  // Use LoginContext to get userName
  const { state: loginState } = useLogIn();
  const userName = loginState?.firstName || "Guest"; // Default to "Guest" if not available

  // Use RoleContext to get userRole
  const { state: roleState } = useRole();
  const userRole = roleState?.role || "User"; // Default to "User" if not available

  const [formData, setFormData] = useState<HolidayRequest>({
    startDate: null,
    endDate: null,
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || formData.reason.trim() === "") {
      alert("All fields are required.");
      return;
    }

    const db = getDatabase();
    const holidaysRef = ref(db, "holidays");
    await push(holidaysRef, {
      startDate: formData.startDate.toISOString(),
      endDate: formData.endDate.toISOString(),
      reason: formData.reason,
      userName,
      role: userRole,
      status: "Pending", // Manager will approve/deny later
    });

    alert("Holiday request submitted!");
    setFormData({ startDate: null, endDate: null, reason: "" });
  };

  return (
      <Card >
        <CardContent>
          <Typography variant="h5">Request a Holiday</Typography>
          <form onSubmit={handleSubmit}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {/* Start Date Picker */}
              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(newDate) => setFormData({ ...formData, startDate: newDate })}
                slotProps={{
                  textField: { fullWidth: true, margin: "normal" },
                }}
              />

              {/* End Date Picker */}
              <DatePicker
                label="End Date"
                value={formData.endDate}
                onChange={(newDate) => setFormData({ ...formData, endDate: newDate })}
                slotProps={{
                  textField: { fullWidth: true, margin: "normal" },
                }}
              />
            </LocalizationProvider>

            {/* Reason Input */}
            <TextField
              fullWidth
              margin="normal"
              label="Reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            />

            {/* Submit Button */}
            <Button fullWidth variant="contained" type="submit" sx={{ marginTop: 2 }}>
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>
  );
};

export default RequestHoliday;
