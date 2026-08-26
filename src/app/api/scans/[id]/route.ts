import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const scan = await queryOne<{ status: string }>(`select status from scans where id = $1`, [id]);
  if (!scan) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ status: scan.status });
}
