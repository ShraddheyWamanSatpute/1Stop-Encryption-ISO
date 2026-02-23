/**
 * ESS Company Selector Page
 * 
 * For multi-company users:
 * - List of available companies
 * - Switch between companies
 */

"use client"

import React from "react"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Avatar,
  Chip,
  useTheme,
} from "@mui/material"
import {
  Business as BusinessIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material"
import { useESS } from "../context/ESSContext"
import { ESSEmptyState } from "../components"

const ESSCompanySelector: React.FC = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { authState, switchCompany } = useESS()

  // Handle company selection
  const handleSelectCompany = async (companyId: string) => {
    await switchCompany(companyId)
    navigate("/ess/dashboard", { replace: true })
  }

  return (
    <Box sx={{ 
      p: { xs: 1.5, sm: 2 },
      pb: { xs: 12, sm: 4 },
      maxWidth: "100%",
      overflowX: "hidden",
    }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        You have access to multiple companies. Select one to continue.
      </Typography>

      {/* Companies List */}
      {authState.companies.length > 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {authState.companies.map((company) => {
            const isSelected = company.companyId === authState.currentCompanyId

            return (
              <Card
                key={company.companyId}
                sx={{
                  borderRadius: 3,
                  border: isSelected
                    ? `2px solid ${theme.palette.primary.main}`
                    : `1px solid ${theme.palette.divider}`,
                }}
              >
                <CardActionArea
                  onClick={() => handleSelectCompany(company.companyId)}
                  disabled={isSelected}
                >
                  <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: isSelected
                          ? theme.palette.primary.main
                          : theme.palette.grey[200],
                      }}
                    >
                      <BusinessIcon
                        sx={{
                          fontSize: 28,
                          color: isSelected ? "white" : "text.secondary",
                        }}
                      />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {company.companyName}
                      </Typography>
                      {company.siteName && (
                        <Typography variant="body2" color="text.secondary">
                          {company.siteName}
                        </Typography>
                      )}
                      <Chip
                        label={company.role || "Staff"}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    {isSelected && (
                      <CheckIcon sx={{ color: "primary.main", fontSize: 28 }} />
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            )
          })}
        </Box>
      ) : (
        <ESSEmptyState
          icon={<BusinessIcon sx={{ fontSize: 48 }} />}
          title="No Companies"
          description="You don't have access to any companies. Please contact your administrator."
        />
      )}
    </Box>
  )
}

export default ESSCompanySelector