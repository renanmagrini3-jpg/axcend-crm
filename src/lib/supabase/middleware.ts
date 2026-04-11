import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/pipeline",
  "/contacts",
  "/companies",
  "/tasks",
  "/reports",
  "/automations",
  "/ranking",
  "/settings",
  "/onboarding",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  const isOnboarding = pathname.startsWith("/onboarding");

  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const organizationId = user.user_metadata?.organization_id as
      | string
      | undefined;
    const onboardingCompleted = user.user_metadata?.onboarding_completed === true;

    // No org yet → force onboarding
    if (!organizationId && isProtected && !isOnboarding) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // Onboarding already completed → skip page
    if (isOnboarding && onboardingCompleted) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Authed user hitting login/register → route based on completion
    if (pathname === "/login" || pathname === "/register") {
      const target = onboardingCompleted ? "/dashboard" : "/onboarding";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return response;
}
