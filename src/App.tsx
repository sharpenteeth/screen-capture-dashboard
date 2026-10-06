import { Navigate, Route, Routes } from "react-router-dom";
import { currentUser } from "./api";
import { AppShell } from "./components/AppShell";
import { DirectoryPage } from "./pages/DirectoryPage";
import { LoginPage } from "./pages/LoginPage";
import { OverviewPage } from "./pages/OverviewPage";
import { RequestPage } from "./pages/RequestPage";
import { TimelinePage } from "./pages/TimelinePage";

function RequireAuth() {
  if (!currentUser()) return <Navigate to="/login" replace />;
  return <AppShell />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/users/:userId" element={<TimelinePage />} />
        <Route path="/requests/:requestId" element={<RequestPage />} />
        <Route path="/directory" element={<DirectoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
