import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import { ref, get, update } from 'firebase/database';
import { db } from '../services/firebase';
import { Page } from '../styles/StyledComponents';
import { useLogIn } from '../context/LogInContext';

interface TableAssignment {
  id: string;
  tableNumber: string;
  covers: number;
  time: string;
  waiter: string;
}

const TableAssignmentPage: React.FC = () => {
  useLogIn(); // manager info if needed
  const [assignments, setAssignments] = useState<TableAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<TableAssignment | null>(null);
  const [newWaiter, setNewWaiter] = useState<string>('');

  // For demo purposes, assume this list of waiters exists
  const waiters = ['Alice', 'Bob', 'Charlie', 'Dana'];

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const assignmentsRef = ref(db, 'tableAssignments');
      const snapshot = await get(assignmentsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const assignmentsArray = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          tableNumber: value.tableNumber || 'N/A',
          covers: value.covers || 0,
          time: value.time || '',
          waiter: value.waiter || 'Unassigned',
        }));
        setAssignments(assignmentsArray);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      setError('Failed to fetch table assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSelectAssignment = (assignment: TableAssignment) => {
    setSelectedAssignment(assignment);
    setNewWaiter(assignment.waiter);
  };

  const handleReassign = async () => {
    if (!selectedAssignment) return;
    try {
      const assignmentRef = ref(db, `tableAssignments/${selectedAssignment.id}`);
      await update(assignmentRef, { waiter: newWaiter });
      fetchAssignments();
      setSelectedAssignment(null);
    } catch (err) {
      setError('Failed to update table assignment');
    }
  };

  return (
    <Page>
      <Typography variant="h4" gutterBottom>
        Table Assignments
      </Typography>
      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}
      {!loading && assignments.length === 0 && (
        <Typography>No table assignments available.</Typography>
      )}
      {!loading && assignments.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small" aria-label="table assignments">
            <TableHead>
              <TableRow>
                <TableCell>Table Number</TableCell>
                <TableCell>Covers</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Waiter</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>{assignment.tableNumber}</TableCell>
                  <TableCell>{assignment.covers}</TableCell>
                  <TableCell>{assignment.time}</TableCell>
                  <TableCell>{assignment.waiter}</TableCell>
                  <TableCell>
                    <Button variant="outlined" onClick={() => handleSelectAssignment(assignment)}>
                      Reassign
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedAssignment && (
        <Paper sx={{ padding: 2, marginTop: 2 }}>
          <Typography variant="h6">Reassign Table {selectedAssignment.tableNumber}</Typography>
          <FormControl fullWidth sx={{ marginY: 2 }}>
            <InputLabel>Select Waiter</InputLabel>
            <Select
              value={newWaiter}
              label="Select Waiter"
              onChange={(e) => setNewWaiter(e.target.value)}
            >
              {waiters.map((w) => (
                <MenuItem key={w} value={w}>
                  {w}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleReassign}>
            Confirm Reassignment
          </Button>
        </Paper>
      )}
    </Page>
  );
};

export default TableAssignmentPage;
