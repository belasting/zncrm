import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const cookieStore = await cookies();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${cookieStore.get("sb-access-token")?.value}`
        }
      }
    }
  );

  await supabase.auth.signOut();

  cookieStore.delete("sb-access-token");
  cookieStore.delete("sb-refresh-token");

  redirect("/login");
}