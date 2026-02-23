"use client";

import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
} from "@mui/material";
import { useSettings } from "../../backend/context/SettingsContext";
import { logLoginFailure } from "../../backend/services/audit/authAuditClient";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useSettings();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error("Email and Password are required.");
      }

      await login(email, password);
      
      // Login function in SettingsContext handles the dispatch internally
      // No need to manually dispatch here

      setMessage("Login successful!");
      if (keepSignedIn) {
        localStorage.setItem("keepSignedIn", "true");
      }
      
      // Check if we're on mobile route and redirect accordingly
      const currentPath = window.location.pathname
      if (currentPath.startsWith("/Mobile") || currentPath.startsWith("/mobile")) {
        navigate("/Mobile/Dashboard")
      } else if (currentPath.startsWith("/ESS") || currentPath.startsWith("/ess")) {
        navigate("/ESS/Dashboard")
      } else {
        navigate("/");
      }
    } catch (error) {
      const err = error as Error & { code?: string };
      setMessage(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
      // Audit: log login_failure (ISO 27001 A.12, SOC 2 CC7)
      logLoginFailure(email, err?.code).catch(() => {});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Card sx={{ marginTop: 8, padding: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
              1 Stop
            </Typography>
          </Box>
          <Typography variant="h5" gutterBottom>
            Log In
          </Typography>
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                />
              }
              label="Remember Me"
            />
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={isLoading}
              sx={{ marginTop: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : "Log In"}
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate("/Register")}
              sx={{ marginTop: 1 }}
            >
              Create Account
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate("/Reset-Password")}
            >
              Forgot Password
            </Button>
            {message && (
              <Typography color="error" sx={{ marginTop: 2 }}>
                {message}
              </Typography>
            )}
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;
