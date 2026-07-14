import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// Turns any error thrown inside a DB-backed API route into a proper JSON
// response. Without this, an unhandled Prisma failure makes Next return a 500
// with an EMPTY body, and the dashboard client then crashes on `res.json()`
// with "Unexpected end of JSON input" — so the user sees a blank screen with no
// idea what went wrong.
//
// Database-connection failures (the #1 production issue — DATABASE_URL pointing
// at Supabase's IPv6-only direct host, unreachable from Vercel) get a distinct,
// actionable message + 503 so the UI can surface the real cause.
export function apiError(error: unknown): NextResponse {
  // Always log the real error server-side (visible in Vercel function logs).
  console.error("[api] route error:", error);

  const message = error instanceof Error ? error.message : String(error);

  const isConnectionError =
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P1000", "P1001", "P1002", "P1008", "P1017"].includes(error.code)) ||
    /can't reach database server|connection (refused|closed|terminated|timed out)|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ENETUNREACH|EHOSTUNREACH/i.test(
      message,
    );

  if (isConnectionError) {
    return NextResponse.json(
      {
        error:
          "Can't reach the database. On serverless (Vercel) the DATABASE_URL must use the Supabase connection pooler (aws-0-<region>.pooler.supabase.com:6543 ?pgbouncer=true), not the IPv6-only direct host db.<ref>.supabase.co:5432.",
        code: "db_unreachable",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      error: "Something went wrong while processing the request.",
      code: "internal_error",
      ...(process.env.NODE_ENV === "development" ? { detail: message } : {}),
    },
    { status: 500 },
  );
}
