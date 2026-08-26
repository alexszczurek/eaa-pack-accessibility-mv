import { NextRequest, NextResponse } from "next/server";
import { consumeMagicLink, createSession, appUrl } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${appUrl()}/login?error=invalid`);
  }
  const userId = await consumeMagicLink(token);
  if (!userId) {
    return NextResponse.redirect(`${appUrl()}/login?error=invalid`);
  }
  await createSession(userId);
  return NextResponse.redirect(`${appUrl()}/app`);
}
