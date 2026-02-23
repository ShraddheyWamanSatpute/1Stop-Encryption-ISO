import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../components/AuthFunctions";
import {
  Container,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
} from "@mui/material";

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string; 
}

const RegisterManager: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CustomerData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "Manager", 
  });
  const [message, setMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate("/login");
    } catch (error) {
      setMessage("Registration failed. Please try again.");
    }
  };

  return (
    <Container maxWidth="sm">
      <Card sx={{ marginTop: 8, padding: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Create Account
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              margin="normal"
              label="First Name"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Last Name"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{ marginTop: 2 }}
            >
              Register
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate("/LogIn")}
              sx={{ marginTop: 1 }}
            >
              Already have an account? Log In
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

export default RegisterManager;
