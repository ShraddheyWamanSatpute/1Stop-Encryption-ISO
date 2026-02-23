import { styled } from "@mui/material/styles"
import { Box as MuiBox, Container } from "@mui/material"

export const AppContainer = styled(MuiBox)(({ theme }) => ({
  display: "flex",
  minHeight: "100vh",
  backgroundColor: theme.palette.background.default,
}))

export const AppBox = styled(MuiBox)(({ theme }) => ({
  flexGrow: 1,
  paddingTop: theme.spacing(8), // Account for AppBar height
  minHeight: "100vh",
  backgroundColor: theme.palette.background.default,
  transition: "all 0.3s ease-in-out",
}))

export const Page = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  maxWidth: "100%",
  [theme.breakpoints.up("sm")]: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  [theme.breakpoints.up("md")]: {
    maxWidth: "1200px",
  },
}))

export const PageHeader = styled(MuiBox)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  [theme.breakpoints.up("sm")]: {
    marginBottom: theme.spacing(4),
  },
}))

export const Horizontal = styled(MuiBox)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
}))

export const ButtonTR = styled(MuiBox)(({ theme }) => ({
  position: "fixed",
  top: theme.spacing(10),
  right: theme.spacing(2),
  zIndex: theme.zIndex.fab,
  [theme.breakpoints.up("md")]: {
    right: theme.spacing(3),
  },
}))

export const CardGrid = styled(MuiBox)(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(2),
  gridTemplateColumns: "1fr",
  [theme.breakpoints.up("sm")]: {
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: theme.spacing(3),
  },
}))

export const StatsCard = styled(MuiBox)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[8],
  },
}))
