import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // we will configure credentials in auth.ts
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "user" | undefined;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthRoutes = nextUrl.pathname.startsWith("/login");
      const isPublicAsset = nextUrl.pathname.startsWith("/_next") || nextUrl.pathname === "/favicon.ico" || nextUrl.pathname.includes(".");

      if (isPublicAsset) return true;

      if (isOnAuthRoutes) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      return isLoggedIn;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;