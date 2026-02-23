import React, { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  FormControl,
  Select,
  MenuItem,
  ClickAwayListener,
} from "@mui/material";
import { useCompany } from "../../../backend/context/CompanyContext";
import { useSettings } from "../../../backend/context/SettingsContext";

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = () => {
  const { state: companyState, setCompanyID, dispatch: companyDispatch } = useCompany();
  const { state: settingsState } = useSettings();
  
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  // Get all companies from user's company context (admin users have all companies with owner role)
  const allCompanies = settingsState.user?.companies || [];
  const loading = !settingsState.user;

  // Set selected company from URL or state
  useEffect(() => {
    if (companyState.companyID) {
      setSelectedCompanyId(companyState.companyID);
    } else if (allCompanies.length > 0 && !selectedCompanyId) {
      // Auto-select first company if none selected
      setSelectedCompanyId(allCompanies[0].companyID);
    }
  }, [companyState.companyID, allCompanies, selectedCompanyId]);

  const handleCompanyChange = async (companyId: string) => {
    if (!companyId) return;

    setSelectedCompanyId(companyId);
    setDropdownOpen(false);

    // Update company context - the company should already be in the user's companies list
    await setCompanyID(companyId);
  };

  const handleToggle = () => {
    setDropdownOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    setDropdownOpen(false);
  };


  const selectedCompany = allCompanies.find((c) => c.companyID === selectedCompanyId);
  const selectedCompanyName = selectedCompany?.companyName || companyState.companyName || "Select Company";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar position="static" sx={{ bgcolor: "primary.main" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 0, mr: 4 }}>
            Admin Panel
          </Typography>
          
          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
            <ClickAwayListener onClickAway={handleClose}>
              <Box>
                <FormControl
                  ref={anchorRef}
                  size="small"
                  sx={{ minWidth: 300 }}
                >
                  <Select
                    value={selectedCompanyId || ""}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    open={dropdownOpen}
                    onOpen={handleToggle}
                    onClose={() => setDropdownOpen(false)}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) {
                        return (
                          <Typography sx={{ color: "text.secondary" }}>
                            Select Company
                          </Typography>
                        );
                      }
                      return selectedCompanyName;
                    }}
                    sx={{
                      bgcolor: "background.paper",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255, 255, 255, 0.3)",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255, 255, 255, 0.5)",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "white",
                      },
                    }}
                    MenuProps={{
                      anchorOrigin: {
                        vertical: "bottom",
                        horizontal: "center",
                      },
                      transformOrigin: {
                        vertical: "top",
                        horizontal: "center",
                      },
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                          mt: 1,
                        },
                      },
                    }}
                  >
                    {loading ? (
                      <MenuItem disabled>Loading companies...</MenuItem>
                    ) : allCompanies.length === 0 ? (
                      <MenuItem disabled>No companies found</MenuItem>
                    ) : (
                      allCompanies.map((company) => (
                        <MenuItem key={company.companyID} value={company.companyID}>
                          <Box>
                            <Typography variant="body1">{company.companyName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {company.role || "owner"} • {company.companyID}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Box>
            </ClickAwayListener>
          </Box>

          <Box sx={{ flexGrow: 0, ml: 4 }}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {selectedCompanyName !== "Select Company" ? `Viewing: ${selectedCompanyName}` : "No company selected"}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: "auto" }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
