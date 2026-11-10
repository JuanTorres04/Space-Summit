import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { AuthForm } from "../components/AuthForm";
import { useAuthStore } from "../store/authStore";
import type { RegisterPayload } from "../types";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const navigate = useNavigate();

  const handleSubmit = async (values: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        await signIn({ username: values.username, password: values.password });
      } else {
        await signUp(values);
      }
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthForm
        mode={mode}
        loading={loading}
        error={error}
        onSubmit={(values) => void handleSubmit(values)}
        onToggleMode={() => {
          setError(null);
          setMode(mode === "login" ? "register" : "login");
        }}
      />
    </div>
  );
}
