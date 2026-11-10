import { useEffect } from "react";
import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./components/Toaster";
import { AuthPage } from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { RacePage } from "./pages/RacePage";
import { useAuthStore } from "./store/authStore";

function RequireAuth({ children }: { children: ReactElement }) {
  const status = useAuthStore((state) => state.status);
  if (status === "loading") return <p className="page">Loading...</p>;
  if (status === "anonymous") return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const restore = useAuthStore((state) => state.restore);
  const signOut = useAuthStore((state) => state.signOut);

  useEffect(() => {
    void restore();
  }, [restore]);

  // The API client fires this event when a token refresh fails
  useEffect(() => {
    window.addEventListener("auth:logout", signOut);
    return () => window.removeEventListener("auth:logout", signOut);
  }, [signOut]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <HomePage />
              </RequireAuth>
            }
          />
          <Route
            path="/race/:raceId"
            element={
              <RequireAuth>
                <RacePage />
              </RequireAuth>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <RequireAuth>
                <LeaderboardPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
