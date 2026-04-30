import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const error = url.searchParams.get("error");
  const target = new URL("/auth/google", origin);
  if (error) {
    target.searchParams.set("error", error);
  }
  return NextResponse.redirect(target);
}
