import { useState } from "react";
import type { FormEvent } from "react";
import type { RegisterPayload } from "../types";

interface AuthFormProps {
  mode: "login" | "register";
  loading: boolean;
  error: string | null;
  onSubmit: (values: RegisterPayload) => void;
  onToggleMode: () => void;
}

export function AuthForm({
  mode,
  loading,
  error,
  onSubmit,
  onToggleMode,
}: AuthFormProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ username, email, password });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-brand">
        <p className="auth-mark">SUMMIT SPRINT</p>
        <h1>{mode === "login" ? "Pilot login" : "New pilot registration"}</h1>
        <p className="auth-sub">
          Type your way up the mountain. Cross the event horizon.
        </p>
      </div>

      <label htmlFor="username">Username</label>
      <input
        id="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        required
      />

      {mode === "register" && (
        <>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </>
      )}

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        required
      />

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading}>
        {loading
          ? "Please wait..."
          : mode === "login"
            ? "Launch"
            : "Join the crew"}
      </button>

      <button type="button" className="link-button" onClick={onToggleMode}>
        {mode === "login"
          ? "Need an account? Sign up"
          : "Have an account? Log in"}
      </button>
    </form>
  );
}
