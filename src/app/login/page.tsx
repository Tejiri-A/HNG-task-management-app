import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | Habit Tracker",
};

export default function LoginPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        {/* Brand mark */}
        <div className="mb-8 text-center">
          <span className="text-xl brand">
            Habit<span className="brand-accent">Tracker</span>
          </span>
        </div>

        {/* Header */}
        <div className="auth-header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue your streak</p>
        </div>

        {/* Form */}
        <LoginForm />
      </div>
    </main>
  );
}
