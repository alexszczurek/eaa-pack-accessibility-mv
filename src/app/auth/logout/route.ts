import { NextResponse } from "next/server";
import { destroySession, appUrl } from "@/lib/auth";

export async function POST() {
  await destroySession();
  return NextResponse.redirect(`${appUrl()}/`, { status: 303 });
}
