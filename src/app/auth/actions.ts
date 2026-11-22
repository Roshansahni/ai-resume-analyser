"use server";

import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";

type AuthInput = {
  email: string;
  password: string;
  fullName?: string;
  nextPath?: string;
};

type AuthResult =
  | {
      status: "error";
      title: string;
      description: string;
    }
  | {
      status: "signed-in";
      redirectTo: string;
    }
  | {
      status: "confirmation-required";
    };

type PasswordRecoveryResult =
  | {
      status: "error";
      title: string;
      description: string;
    }
  | {
      status: "success";
      title: string;
      description: string;
    };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSafeNextPath(value: string | undefined) {
  return value?.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/[\r\n]/.test(value)
    ? value
    : "/dashboard";
}

function getApplicationOrigin(headerList: Headers) {
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return new URL(`${protocol}://${host}`).origin;
}

function validateCredentials(input: AuthInput, requiresName: boolean): AuthResult | null {
  const email = input.email.trim();
  const fullName = input.fullName?.trim() ?? "";

  if (!emailPattern.test(email) || email.length > 254) {
    return {
      status: "error",
      title: "Enter a valid email address",
      description: "Use a valid email address with 254 characters or fewer.",
    };
  }

  if (input.password.length < 8) {
    return {
      status: "error",
      title: "Choose a longer password",
      description: "Your password must contain at least 8 characters.",
    };
  }

  if (requiresName && !fullName) {
    return {
      status: "error",
      title: "Full name is required",
      description: "Enter your name before creating an account.",
    };
  }

  if (fullName.length > 120) {
    return {
      status: "error",
      title: "Name is too long",
      description: "Use a name with 120 characters or fewer.",
    };
  }

  return null;
}

function getSafeAuthMessage(message: string, action: "sign-in" | "sign-up") {
  if (/already registered|already exists/i.test(message)) {
    return {
      title: "An account already exists",
      description: "Sign in with this email address or reset its password.",
    };
  }

  if (/email.*(invalid|valid)|invalid.*email/i.test(message)) {
    return {
      title: "Enter a valid email address",
      description: "Check the email address and try again.",
    };
  }

  if (/credentials|password|email not confirmed/i.test(message)) {
    return {
      title: "Unable to sign in",
      description:
        "Check your email and password. If this is a new account, confirm your email first.",
    };
  }

  return {
    title: action === "sign-up" ? "Unable to create your account" : "Unable to sign in",
    description:
      "The authentication service could not complete the request. Please try again shortly.",
  };
}

export async function signUp(input: AuthInput): Promise<AuthResult> {
  const validationError = validateCredentials(input, true);
  if (validationError) return validationError;

  try {
    const supabase = await createClient();
    const headerList = await headers();
    const nextPath = getSafeNextPath(input.nextPath);
    const emailRedirectTo = `${getApplicationOrigin(headerList)}/auth/confirm?next=${encodeURIComponent(nextPath)}`;
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        emailRedirectTo,
        data: {
          full_name: input.fullName?.trim(),
        },
      },
    });

    if (error) {
      const feedback = getSafeAuthMessage(error.message, "sign-up");
      console.error("Supabase sign-up failed", { name: error.name, status: error.status });
      return { status: "error", ...feedback };
    }

    if (data.session) {
      return { status: "signed-in", redirectTo: nextPath };
    }

    return { status: "confirmation-required" };
  } catch (error) {
    console.error("Supabase sign-up request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });

    return {
      status: "error",
      title: "Unable to create your account",
      description:
        "The authentication service could not complete the request. Please try again shortly.",
    };
  }
}

export async function signIn(input: AuthInput): Promise<AuthResult> {
  const validationError = validateCredentials(input, false);
  if (validationError) return validationError;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: input.email.trim(),
      password: input.password,
    });

    if (error) {
      const feedback = getSafeAuthMessage(error.message, "sign-in");
      console.error("Supabase sign-in failed", { name: error.name, status: error.status });
      return { status: "error", ...feedback };
    }

    return { status: "signed-in", redirectTo: getSafeNextPath(input.nextPath) };
  } catch (error) {
    console.error("Supabase sign-in request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });

    return {
      status: "error",
      title: "Unable to sign in",
      description:
        "The authentication service could not complete the request. Please try again shortly.",
    };
  }
}

export async function requestPasswordReset(input: {
  email: string;
}): Promise<PasswordRecoveryResult> {
  const email = input.email.trim();

  if (!emailPattern.test(email) || email.length > 254) {
    return {
      status: "error",
      title: "Enter a valid email address",
      description: "Check the email address and try again.",
    };
  }

  try {
    const supabase = await createClient();
    const headerList = await headers();
    const redirectTo = `${getApplicationOrigin(headerList)}/auth/confirm?next=${encodeURIComponent("/reset-password")}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      console.error("Supabase password-reset request failed", {
        name: error.name,
        status: error.status,
      });
      return {
        status: "error",
        title: "Unable to send the reset email",
        description: "The authentication service could not complete the request. Please try again shortly.",
      };
    }

    return {
      status: "success",
      title: "Check your email",
      description:
        "If an account exists for this address, you will receive a secure password-reset link shortly.",
    };
  } catch (error) {
    console.error("Password-reset request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      status: "error",
      title: "Unable to send the reset email",
      description: "Check your connection and try again shortly.",
    };
  }
}

export async function updatePassword(input: {
  password: string;
}): Promise<PasswordRecoveryResult> {
  if (input.password.length < 8) {
    return {
      status: "error",
      title: "Choose a longer password",
      description: "Your new password must contain at least 8 characters.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        status: "error",
        title: "Your recovery link has expired",
        description: "Request a new password-reset link and open it in this browser.",
      };
    }

    const { error } = await supabase.auth.updateUser({ password: input.password });

    if (error) {
      console.error("Supabase password update failed", {
        name: error.name,
        status: error.status,
      });
      return {
        status: "error",
        title: "Unable to update your password",
        description: "The reset link may have expired. Request a new link and try again.",
      };
    }

    return {
      status: "success",
      title: "Password updated",
      description: "Your password has been changed. You can continue to your dashboard.",
    };
  } catch (error) {
    console.error("Password update failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      status: "error",
      title: "Unable to update your password",
      description: "Check your connection and request a new link if this continues.",
    };
  }
}
