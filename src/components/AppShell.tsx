import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { Box, Button, Typography } from "@mui/material";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearSession, currentUser } from "../api";
import { LiveBackdrop } from "./LiveBackdrop";

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = currentUser();
  const links = [{ to: "/", label: "Overview" }];
  if (user?.role === "admin") links.push({ to: "/directory", label: "Users" });

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden", flexDirection: { xs: "column", md: "row" } }}>
      <LiveBackdrop />
      <Box
        className="live-rail"
        sx={{
          position: "relative",
          zIndex: 2,
          width: { xs: "auto", md: 248 },
          flexShrink: 0,
          height: { xs: "auto", md: "100%" },
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box className="pulse-ember" />
            <Typography variant="overline" sx={{ color: "#e7b89a", letterSpacing: "0.16em" }}>
              Screen Capture
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ display: { xs: "none", md: "block" } }}>
            Activity desk
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: { xs: "row", md: "column" }, gap: 0.5, flexGrow: 1, minHeight: 0, overflow: "auto" }}>
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
                    transition: "background-color 180ms ease, transform 180ms ease",
                    "&:hover": {
                      bgcolor: isActive ? "#9a3412" : "rgba(246, 241, 232, 0.08)",
                      transform: { md: "translateX(4px)" },
                    },
                  }}
                >
                  {link.label}
                </Box>
              )}
            </NavLink>
          ))}
        </Box>
        <Box sx={{ flexShrink: 0 }}>
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
      <Box sx={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0, minHeight: 0, overflow: "auto", p: { xs: 2, md: 4 } }}>
        <Box key={location.pathname} className="live-rise">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
