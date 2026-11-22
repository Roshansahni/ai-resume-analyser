import type { Metadata } from "next";

import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a secure AI Resume Analyser password-reset link.",
};

export default function ForgotPasswordPage() {
  return <PasswordRecoveryForm mode="request" />;
}
