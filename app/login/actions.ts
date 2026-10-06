"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInWithPassword(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const allowedUsername = process.env.LOGIN_USERNAME;
  const loginEmail = process.env.LOGIN_EMAIL;

  if (!allowedUsername || !loginEmail) {
    redirect("/login?error=Login%20is%20not%20configured");
  }

  if (username !== allowedUsername || !password) {
    redirect("/login?error=Invalid%20username%20or%20password");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password,
  });

  if (error) {
    redirect("/login?error=Invalid%20username%20or%20password");
  }

  redirect("/dashboard");
}
