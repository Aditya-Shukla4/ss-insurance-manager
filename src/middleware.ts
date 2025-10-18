import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  console.log("🔍 Middleware triggered for:", request.nextUrl.pathname);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("🔐 Session found:", !!session, session?.user?.email);
  console.log(
    "🍪 Cookies:",
    request.cookies.getAll().map((c) => c.name)
  );

  // If user is not logged in and trying to access protected routes
  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    console.log("❌ No session - redirecting to /login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is logged in and trying to access login/signup page
  if (
    session &&
    (request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/signup"))
  ) {
    console.log("✅ Session exists - redirecting to /dashboard");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  console.log("✅ Allowing access to:", request.nextUrl.pathname);
  return response;
}

// Specify which paths this middleware should run on
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
