import React from "react";
import { Box, Typography, Grid, Card, CardContent, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Business as BusinessIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const adminFeatures = [
    {
      title: "Create Company",
      description: "Create a new company with comprehensive details",
      icon: <BusinessIcon sx={{ fontSize: 48 }} />,
      path: "/admin/create-company",
      color: "primary",
    },
    {
      title: "Create Admin",
      description: "Create a new admin account with access to all companies",
      icon: <PeopleIcon sx={{ fontSize: 48 }} />,
      path: "/admin/create-admin",
      color: "warning",
    },
    {
      title: "Contracts",
      description: "View and manage company contracts",
      icon: <DescriptionIcon sx={{ fontSize: 48 }} />,
      path: "/admin/contracts",
      color: "secondary",
    },
    {
      title: "Clients",
      description: "View all companies and client information",
      icon: <PeopleIcon sx={{ fontSize: 48 }} />,
      path: "/admin/clients",
      color: "success",
    },
    {
      title: "Viewer",
      description: "View detailed company information",
      icon: <ViewIcon sx={{ fontSize: 48 }} />,
      path: "/admin/viewer",
      color: "info",
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage companies, contracts, and view client information
      </Typography>

      <Grid container spacing={3}>
        {adminFeatures.map((feature) => (
          <Grid item xs={12} sm={6} md={3} key={feature.title}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
              onClick={() => navigate(feature.path)}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                <Box sx={{ color: `${feature.color}.main`, mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color={feature.color as any}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(feature.path);
                  }}
                >
                  Open
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
