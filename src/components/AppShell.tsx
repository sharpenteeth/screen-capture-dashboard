import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { Box, Button, Typography } from "@mui/material";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearSession, currentUser } from "../api";

export function AppShell() {
  const navigate = useNavigate();
  const user = currentUser();
  const links = [{ to: "/", label: "Overview" }];
  if (user?.role === "admin") links.push({ to: "/directory", label: "Users" });

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", flexDirection: { xs: "column", md: "row" } }}>
      <Box
        sx={{
          width: { xs: "auto", md: 248 },
          bgcolor: "#1c1915",
          color: "#f6f1e8",
          px: 2.5,
          py: 3,
          display: "flex",
          flexDirection: { xs: "row", md: "column" },
          gap: 2,
          alignItems: { xs: "center", md: "stretch" },
        }}
      >
        <Box sx={{ flexGrow: { xs: 1, md: 0 } }}>
          <Typography variant="overline" sx={{ color: "#e7b89a", letterSpacing: "0.16em" }}>
            Screen Capture
          </Typography>
          <Typography variant="h6" sx={{ display: { xs: "none", md: "block" } }}>
            Activity desk
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: { xs: "row", md: "column" }, gap: 0.5, flexGrow: 1 }}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === "/"} style={{ textDecoration: "none" }}>
              {({ isActive }) => (
                <Box
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    color: "#f6f1e8",
                    bgcolor: isActive ? "#9a3412" : "transparent",
                  }}
                >
                  {link.label}
                </Box>
              )}
            </NavLink>
          ))}
        </Box>
        <Box>
          <Typography variant="body2">{user?.fullName}</Typography>
          <Typography variant="caption" sx={{ color: "#c8bfb2", textTransform: "capitalize" }}>
            {user?.role}
          </Typography>
          <Button
            size="small"
            startIcon={<LogoutRoundedIcon />}
            onClick={() => {
              clearSession();
              navigate("/login");
            }}
            sx={{ color: "#f6f1e8", mt: 1, display: "flex" }}
          >
            Sign out
          </Button>
        </Box>
      </Box>
      <Box sx={{ flex: 1, p: { xs: 2, md: 4 } }}>
        <Outlet />
      </Box>
    </Box>
  );
}
