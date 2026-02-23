import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

const SafeCheckPage: React.FC = () => {
  const [countDate, setCountDate] = useState<string>(''); // State for the count date
  const [safeCount, setSafeCount] = useState<Record<string, number>>({
    '£50': 0,
    '£20': 0,
    '£10': 0,
    '£5': 0,
    '£1': 0,
    '50p': 0,
    '20p': 0,
    '5p': 0,
  });
  const [tillFloatsIssued, setTillFloatsIssued] = useState(0);
  const [outstandingPayments, setOutstandingPayments] = useState<
    { date: string; amount: number }[]
  >([{ date: '', amount: 0 }]);
  const [pettyCash, setPettyCash] = useState<
    { date: string; amount: number; description: string }[]
  >([{ date: '', amount: 0, description: '' }]);
  const [dailySales, setDailySales] = useState<
    Record<string, Record<string, number>>
  >({
    '£50': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
    '£20': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
    '£10': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
    '£5': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
    '£1': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
    '50p': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
    '20p': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
    '5p': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
  });
  const [houseFloatValue, setHouseFloatValue] = useState(0);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    section: 'safeCount' | 'dailySales',
    denomination: string,
    day?: string
  ) => {
    const value = parseFloat(e.target.value.replace('£', '')) || 0;
    if (section === 'safeCount') {
      setSafeCount((prev) => ({ ...prev, [denomination]: value }));
    } else if (section === 'dailySales' && day) {
      setDailySales((prev) => ({
        ...prev,
        [denomination]: { ...prev[denomination], [day]: value },
      }));
    }
  };

  const calculateTotalSafeCount = () =>
    Object.values(safeCount).reduce((sum, val) => sum + val, 0);

  const calculateTotalOutstandingPayments = () =>
    outstandingPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const calculateFloatCountTotal = () =>
    calculateTotalSafeCount() +
    calculateTotalOutstandingPayments() +
    tillFloatsIssued;

  const calculateVariance = () => calculateFloatCountTotal() - houseFloatValue;

  const calculateTotalForDay = (day: string) =>
    Object.values(dailySales).reduce(
      (sum, denomination) => sum + (denomination[day] || 0),
      0
    );

  const saveData = () => {
    const dataToSave = {
      countDate,
      safeCount,
      tillFloatsIssued,
      outstandingPayments,
      pettyCash,
      dailySales,
      houseFloatValue,
    };
    localStorage.setItem(`safeCheck-${countDate}`, JSON.stringify(dataToSave));
    alert('Data saved successfully!');
  };

  const loadData = (date: string) => {
    const savedKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith('safeCheck-')
    );
  
    const getWeekStart = (d: string) => {
      const dateObj = new Date(d);
      const day = dateObj.getUTCDay();
      const diff = dateObj.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      return new Date(dateObj.setUTCDate(diff)).toISOString().split('T')[0];
    };
  
    const targetWeekStart = getWeekStart(date);
    const sameWeekKeys = savedKeys.filter(
      (key) => getWeekStart(key.replace('safeCheck-', '')) === targetWeekStart
    );
  
    const parseSavedData = (key: string): Partial<{
      safeCount: typeof safeCount;
      tillFloatsIssued: number;
      outstandingPayments: typeof outstandingPayments;
      pettyCash: typeof pettyCash;
      dailySales: typeof dailySales;
      houseFloatValue: number;
    }> => {
      const savedData = localStorage.getItem(key);
      return savedData ? JSON.parse(savedData) : {};
    };
  
    if (sameWeekKeys.length > 0) {
      // Aggregate data for the same week
      let aggregatedSafeCount = { ...safeCount };
      let aggregatedDailySales = { ...dailySales };
      const aggregatedOutstandingPayments: typeof outstandingPayments = [];
      const aggregatedPettyCash: typeof pettyCash = [];
      let mostRecentHouseFloatValue = 0;
      let mostRecentTillFloatsIssued = 0;
  
      sameWeekKeys.forEach((key) => {
        const savedData = parseSavedData(key);
  
        // Aggregate safe count
        aggregatedSafeCount = {
          ...aggregatedSafeCount,
          ...Object.fromEntries(
            Object.entries(savedData.safeCount || {}).map(([denom, value]) => [
              denom,
              (aggregatedSafeCount[denom] || 0) + (value as number || 0),
            ])
          ),
        };
  
        // Aggregate daily sales
        aggregatedDailySales = {
          ...aggregatedDailySales,
          ...Object.fromEntries(
            Object.entries(savedData.dailySales || {}).map(([denom, dayValues]) => [
              denom,
              Object.fromEntries(
                Object.entries(dayValues || {}).map(([day, value]) => [
                  day,
                  (aggregatedDailySales[denom]?.[day] || 0) + (value as number || 0),
                ])
              ),
            ])
          ),
        };
  
        // Aggregate other fields
        aggregatedOutstandingPayments.push(...(savedData.outstandingPayments || []));
        aggregatedPettyCash.push(...(savedData.pettyCash || []));
  
        mostRecentHouseFloatValue = savedData.houseFloatValue || mostRecentHouseFloatValue;
        mostRecentTillFloatsIssued = savedData.tillFloatsIssued || mostRecentTillFloatsIssued;
      });
  
      setSafeCount(aggregatedSafeCount);
      setDailySales(aggregatedDailySales);
      setOutstandingPayments(aggregatedOutstandingPayments);
      setPettyCash(aggregatedPettyCash);
      setHouseFloatValue(mostRecentHouseFloatValue);
      setTillFloatsIssued(mostRecentTillFloatsIssued);
  
      alert(`Data aggregated for the week starting ${targetWeekStart}.`);
    } else {
      // Load the most recent data if not in the same week
      const mostRecentKey = savedKeys
        .filter((key) => key !== `safeCheck-${date}`)
        .sort((a, b) => new Date(b.replace('safeCheck-', '')).getTime() - new Date(a.replace('safeCheck-', '')).getTime())[0];
  
      if (mostRecentKey) {
        const savedData = parseSavedData(mostRecentKey);
        setSafeCount(savedData.safeCount || {});
        setTillFloatsIssued(savedData.tillFloatsIssued || 0);
        setOutstandingPayments(savedData.outstandingPayments || []);
        setPettyCash(savedData.pettyCash || []);
        setDailySales(savedData.dailySales || {});
        setHouseFloatValue(savedData.houseFloatValue || 0);
        alert(`Loaded data from the most recent date: ${mostRecentKey.replace('safeCheck-', '')}`);
      } else {
        alert('No recent data found.');
      }
    }
  };
  

  return (
    <Container maxWidth={false} sx={{ width: '95vw', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Safe Check
      </Typography>
      {/* Count Date Section */}
      <Box mb={3}>
        <TextField
          label="Count Date"
          type="date"
          value={countDate}
          onChange={(e) => setCountDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <Box mt={2} display="flex" gap={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => loadData(countDate)}
            disabled={!countDate}
          >
            Load Data
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={saveData}
            disabled={!countDate}
          >
            Save Data
          </Button>
        </Box>
      </Box>
      <Grid container spacing={3}>
        {/* Safe Count Section */}
        <Grid item xs={4}>
          <Box>
            <Typography variant="h5">Safe Count</Typography>
            {Object.entries(safeCount).map(([denomination, value]) => (
              <TextField
                key={denomination}
                label={denomination}
                type="text"
                value={value ? `£${value}` : ''}
                onChange={(e) => handleInputChange(e, 'safeCount', denomination)}
                margin="dense"
                fullWidth
              />
            ))}
            <TextField
              label="Till Floats Issued"
              type="text"
              value={tillFloatsIssued ? `£${tillFloatsIssued}` : ''}
              onChange={(e) =>
                setTillFloatsIssued(parseFloat(e.target.value.replace('£', '')) || 0)
              }
              margin="dense"
              fullWidth
            />
          </Box>
        </Grid>

        {/* Petty Cash Spending and Outstanding Payments */}
        <Grid item xs={4}>
          <Box>
            <Typography variant="h5">Petty Cash Spending</Typography>
            {pettyCash.map((entry, index) => (
              <Box key={index} mb={1}>
                <TextField
                  label="Date"
                  type="date"
                  value={entry.date}
                  onChange={(e) =>
                    setPettyCash((prev) => {
                      const updated = [...prev];
                      updated[index].date = e.target.value;
                      return updated;
                    })
                  }
                  margin="dense"
                  sx={{ width: '30%' }}
                />
                <TextField
                  label="Amount"
                  type="text"
                  value={entry.amount ? `£${entry.amount}` : ''}
                  onChange={(e) =>
                    setPettyCash((prev) => {
                      const updated = [...prev];
                      updated[index].amount = parseFloat(e.target.value.replace('£', '')) || 0;
                      return updated;
                    })
                  }
                  margin="dense"
                  sx={{ width: '30%', ml: 1 }}
                />
                <TextField
                  label="Description"
                  value={entry.description}
                  onChange={(e) =>
                    setPettyCash((prev) => {
                      const updated = [...prev];
                      updated[index].description = e.target.value;
                      return updated;
                    })
                  }
                  margin="dense"
                  sx={{ width: '35%', ml: 1 }}
                />
              </Box>
            ))}
            <Button
              variant="outlined"
              onClick={() => setPettyCash([...pettyCash, { date: '', amount: 0, description: '' }])}
            >
              Add Entry
            </Button>
          </Box>
          <Box mt={3}>
            <Typography variant="h5">Outstanding Change Payments</Typography>
            {outstandingPayments.map((payment, index) => (
              <Box key={index} mb={1}>
                <TextField
                  label="Date"
                  type="date"
                  value={payment.date}
                  onChange={(e) =>
                    setOutstandingPayments((prev) => {
                      const updated = [...prev];
                      updated[index].date = e.target.value;
                      return updated;
                    })
                  }
                  margin="dense"
                  sx={{ width: '45%' }}
                />
                <TextField
                  label="Amount"
                  type="text"
                  value={payment.amount ? `£${payment.amount}` : ''}
                  onChange={(e) =>
                    setOutstandingPayments((prev) => {
                      const updated = [...prev];
                      updated[index].amount = parseFloat(e.target.value.replace('£', '')) || 0;
                      return updated;
                    })
                  }
                  margin="dense"
                  sx={{ width: '45%', ml: 1 }}
                />
              </Box>
            ))}
            <Button
              variant="outlined"
              onClick={() =>
                setOutstandingPayments([...outstandingPayments, { date: '', amount: 0 }])
              }
            >
              Add Entry
            </Button>
          </Box>
        </Grid>

        {/* Daily Sales Count */}
        <Grid item xs={4}>
          <Typography variant="h5">Daily Sales Count</Typography>
          <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Denomination</TableCell>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <TableCell key={day}>{day}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(dailySales).map(([denomination, dayValues]) => (
                <TableRow key={denomination}>
                  <TableCell>{denomination}</TableCell>
                  {Object.entries(dayValues).map(([day, value]) => (
                    <TableCell key={day}>
                      <TextField
                        type="text"
                        value={value ? `£${value}` : ''}
                        onChange={(e) =>
                          handleInputChange(e, 'dailySales', denomination, day)
                        }
                        margin="dense"
                        sx={{ width: '60px' }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow>
                <TableCell>Total</TableCell>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <TableCell key={day}>
                    <strong>£{calculateTotalForDay(day).toFixed(2)}</strong>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>

    {/* Summary Section */}
    <Box mt={4}>
      <Typography variant="h5" gutterBottom>
        Summary
      </Typography>
      <Box>
        <Typography variant="body1">
          <strong>Float Count Total:</strong> £{calculateFloatCountTotal().toFixed(2)}
        </Typography>
        <TextField
          label="House Float Value"
          type="text"
          value={houseFloatValue ? `£${houseFloatValue}` : ''}
          onChange={(e) =>
            setHouseFloatValue(parseFloat(e.target.value.replace('£', '')) || 0)
          }
          fullWidth
          margin="dense"
        />
        <Typography variant="body1" color="error">
          <strong>Variance:</strong> £{calculateVariance().toFixed(2)}
        </Typography>
      </Box>
      <Box mt={3}>
        <Typography variant="h6">Summary of Denominations</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Denomination</TableCell>
                <TableCell>Safe Count Total</TableCell>
                <TableCell>Daily Sales Total</TableCell>
                <TableCell>Grand Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(safeCount).map((denomination) => {
                const safeCountValue = safeCount[denomination] || 0;
                const dailySalesTotal = Object.values(dailySales[denomination]).reduce(
                  (sum, value) => sum + (value || 0),
                  0
                );
                const grandTotal = safeCountValue + dailySalesTotal;

                return (
                  <TableRow key={denomination}>
                    <TableCell>{denomination}</TableCell>
                    <TableCell>£{safeCountValue.toFixed(2)}</TableCell>
                    <TableCell>£{dailySalesTotal.toFixed(2)}</TableCell>
                    <TableCell>£{grandTotal.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell>
                  <strong>Total</strong>
                </TableCell>
                <TableCell>
                  <strong>£{calculateTotalSafeCount().toFixed(2)}</strong>
                </TableCell>
                <TableCell>
                    £{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                      .map(calculateTotalForDay)
                      .reduce((sum, total) => sum + total, 0)
                      .toFixed(2)}
                </TableCell>
                <TableCell>
                  <strong>
                    £
                    {(
                      calculateTotalSafeCount() +
                      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                        .map(calculateTotalForDay)
                        .reduce((sum, total) => sum + total, 0)
                    ).toFixed(2)}
                  </strong>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  </Container>
  );
};

export default SafeCheckPage;
