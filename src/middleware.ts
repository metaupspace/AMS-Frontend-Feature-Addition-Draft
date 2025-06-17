// middleware.ts

import { NextRequest, NextResponse } from "next/server";

// Utility function to decode JWT token
function decodeToken(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      email: payload.sub,
      role: payload.role,
      employeeId: payload.employeeId,
      exp: payload.exp
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// Check if token is expired
function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded) return true;
    
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  const PUBLIC_PATHS = ["/_next/", "/images/", "/static/", "/api/", "/favicon.ico"];
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get token from cookie (middleware only has access to cookies, not sessionStorage)
  const token = request.cookies.get("token")?.value;

  // Define public routes that don't require authentication
  const publicRoutes = ["/login"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Root path redirection
  if (pathname === "/") {
    if (token && !isTokenExpired(token)) {
      // Always redirect to profile for authenticated users
      return NextResponse.redirect(new URL("/profile", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Handle unauthenticated users trying to access protected routes
  if (!token && !isPublicRoute) {
    console.log(`No token found, redirecting to login from: ${pathname}`);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Handle authenticated users trying to access public routes
  if (token && isPublicRoute) {
    if (isTokenExpired(token)) {
      // Token expired, allow access to login and clear the expired token
      if (pathname === "/login") {
        const response = NextResponse.next();
        response.cookies.delete("token");
        console.log('Token expired, cleared cookie, allowing login access');
        return response;
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    // Valid token, redirect to profile
    console.log('Valid token found, redirecting to profile from public route');
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  // Handle protected routes
  if (token && !isPublicRoute) {
    // Check if token is expired
    if (isTokenExpired(token)) {
      console.log('Token expired, redirecting to login');
      const response = NextResponse.redirect(new URL("/login", request.url));
      // Clear the expired token
      response.cookies.delete("token");
      return response;
    }

    const userData = decodeToken(token);
    if (!userData) {
      console.log('Invalid token, redirecting to login');
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }

    // Role-based access control for HR routes
    if (pathname.startsWith("/hr")) {
      if (userData.role !== "HR") {
        console.log(`Access denied to HR route for role: ${userData.role}`);
        return NextResponse.redirect(new URL("/profile", request.url));
      }
    }

    // Allow access to the route
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};