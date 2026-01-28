import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals, redirect }) => {
  const supabase = locals.supabase;

  if (!supabase) {
    return new Response(JSON.stringify({ error: "Supabase client not available" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return redirect("/auth/login");
  } catch (err) {
    console.error("Unexpected logout error:", err);
    return new Response(JSON.stringify({ error: "Unexpected error during logout" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
