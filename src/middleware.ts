import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
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
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const publicRoutes = ["/login", "/signup"];
  const currentPath = request.nextUrl.pathname;

  // 1. Agar user logged in nahi hai AUR protected route pe jaa raha hai -> /login bhej do
  if (!session && currentPath.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Agar user logged in hai AUR public route (login/signup) YA root (/) pe jaa raha hai -> /dashboard bhej do
  if (
    session &&
    (publicRoutes.includes(currentPath) || currentPath === "/")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

// Specify which paths this middleware should run on
export const config = {
  // AB HUM ROOT (/) KO BHI MATCH KAR RAHE HAIN
  matcher: ["/dashboard/:path*", "/login", "/signup", "/"],
};