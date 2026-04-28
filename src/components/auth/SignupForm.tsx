"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Storage } from "@/lib/storage";
import type { User, Session } from "@/types/auth";
import { signUp, useAuth } from "@/lib/auth";

interface FormFields {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  form?: string;
}

function validateFields(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!fields.password) {
    errors.password = "Password is required";
  } else if (fields.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  return errors;
}

export default function SignupForm() {
  const router = useRouter();
  const { setSession } = useAuth();

  const [fields, setFields] = useState<FormFields>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));

    // Clear the error for the field being edited
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Client-side validation
    const validationErrors = validateFields(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = signUp(fields.email, fields.password);
      if (!result.success) {
        setErrors({ form: result.error });
        return;
      }

      setSession(result.session); // sync content
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Form-level error — e.g. "User already exists" */}
      {errors.form && (
        <div role="alert" className="mb-6 alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errors.form}</span>
        </div>
      )}

      {/* Email */}
      <div className="form-group">
        <label htmlFor="signup-email" className="form-label">
          Email address
        </label>
        <input
          id="signup-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={fields.email}
          onChange={handleChange}
          disabled={isLoading}
          aria-describedby={errors.email ? "signup-email-error" : undefined}
          aria-invalid={!!errors.email}
          data-testid="auth-signup-email"
          className={`form-input ${errors.email ? "form-input-error" : ""}`}
        />
        {errors.email && (
          <span id="signup-email-error" role="alert" className="form-error">
            {errors.email}
          </span>
        )}
      </div>

      {/* Password */}
      <div className="form-group">
        <label htmlFor="signup-password" className="field-label">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={fields.password}
          onChange={handleChange}
          disabled={isLoading}
          aria-describedby={
            errors.password ? "signup-password-error" : undefined
          }
          aria-invalid={!!errors.password}
          data-testid="auth-signup-password"
          className={`form-input ${errors.password ? "form-input-error" : ""}`}
        />
        {errors.password && (
          <span id="signup-password-error" role="alert" className="form-error">
            {errors.password}
          </span>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        data-testid="auth-signup-submit"
        className="mt-2 btn btn-primary btn-full"
      >
        {isLoading ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="animate-spin"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </button>

      {/* Redirect to login */}
      <p className="mt-6 text-muted-foreground text-sm text-center">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary-400 transition-colors duration-200"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
