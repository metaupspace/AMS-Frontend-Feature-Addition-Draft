"use client";

import { LoginForm } from "./fragments/login-form";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { isInitialized } = useAuth();

  // Show loading state while auth context initializes
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-6 md:p-10">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
    </div>
  );
}