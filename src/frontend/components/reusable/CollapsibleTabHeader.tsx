import React from "react"
import { Box, Paper, Tabs, Tab, IconButton } from "@mui/material"
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from "@mui/icons-material"

interface TabItem {
  label: string
  icon?: React.ReactElement
  slug?: string
  [key: string]: any
}

interface CollapsibleTabHeaderProps {
  tabs: TabItem[]
  activeTab: number
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void
  isExpanded: boolean
  onToggleExpanded: () => void
  dashboardContent?: React.ReactNode
}

const CollapsibleTabHeader: React.FC<CollapsibleTabHeaderProps> = ({
  tabs,
  activeTab,
  onTabChange,
  isExpanded,
  onToggleExpanded,
  dashboardContent,
}) => {
  return (
    <>
      {isExpanded && dashboardContent && (
        <Box sx={{ width: "100%" }}>
          {dashboardContent}
        </Box>
      )}

      {isExpanded && (
        <Paper
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            m: 0,
            p: 0,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={onTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 2,
              "& .MuiTab-root": {
                color: "primary.contrastText",
                opacity: 0.7,
                "&.Mui-selected": {
                  color: "primary.contrastText",
                  opacity: 1,
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.contrastText",
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab key={tab.slug ?? index} icon={tab.icon} label={tab.label} />
            ))}
          </Tabs>
        </Paper>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "background.paper",
          m: 0,
          p: 0,
          lineHeight: 0,
        }}
      >
        <IconButton
          onClick={onToggleExpanded}
          size="small"
          sx={{
            color: "text.primary",
            m: 0,
            p: 0.5,
            "&:hover": {
              bgcolor: "transparent",
              opacity: 0.7,
            },
          }}
        >
          {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>
    </>
  )
}

export default CollapsibleTabHeader

