import type { Metadata } from "next";

import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Complete the secure AI Resume Analyser password-reset flow.",
};

export default function ResetPasswordPage() {
  return <PasswordRecoveryForm mode="reset" />;
}
