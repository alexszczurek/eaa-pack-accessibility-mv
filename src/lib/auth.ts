import "server-only";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { query, queryOne } from "./db";
import { sendEmail } from "./email";

const SESSION_COOKIE = "eaa_session";
const SESSION_DAYS = 30;
const MAGIC_LINK_MINUTES = 15;

export interface SessionUser {
  id: string;
  email: string;
  plan: "free" | "monitor";
}

export function sha256(value: string): string {
  return createHash("sha256")
    .update(value + (process.env.AUTH_SECRET || ""))
    .digest("hex");
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4780").replace(/\/$/, "");
}

export async function sendMagicLink(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + MAGIC_LINK_MINUTES * 60 * 1000);
  await query(
    `insert into auth_tokens (email, token_hash, expires_at) values ($1, $2, $3)`,
    [normalized, sha256(token), expiresAt]
  );
  const link = `${appUrl()}/auth/verify?token=${token}`;
  await sendEmail({
    to: normalized,
    subject: "Your EAA Pack sign-in link",
    text: [
      "Click to sign in to EAA Pack:",
      "",
      link,
      "",
      `The link works once and expires in ${MAGIC_LINK_MINUTES} minutes.`,
      "If you did not request it, ignore this email.",
    ].join("\n"),
  });
}

/** Consumes a magic-link token; returns the user id or null when invalid. */
export async function consumeMagicLink(token: string): Promise<string | null> {
  const row = await queryOne<{ id: string; email: string }>(
    `update auth_tokens set used_at = now()
     where token_hash = $1 and used_at is null and expires_at > now()
     returning id, email`,
    [sha256(token)]
  );
  if (!row) return null;
  const user = await queryOne<{ id: string }>(
    `insert into users (email) values ($1)
     on conflict (email) do update set email = excluded.email
     returning id`,
    [row.email]
  );
  if (!user) return null;
  await query(
    `insert into subscriptions (user_id) values ($1) on conflict (user_id) do nothing`,
    [user.id]
  );
  return user.id;
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await query(
    `insert into sessions (user_id, token_hash, expires_at) values ($1, $2, $3)`,
    [userId, sha256(token), expiresAt]
  );
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await queryOne<{ id: string; email: string; plan: string | null }>(
    `select u.id, u.email, sub.plan
     from sessions s
     join users u on u.id = s.user_id
     left join subscriptions sub on sub.user_id = u.id
     where s.token_hash = $1 and s.expires_at > now()`,
    [sha256(token)]
  );
  if (!row) return null;
  return { id: row.id, email: row.email, plan: row.plan === "monitor" ? "monitor" : "free" };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await query(`delete from sessions where token_hash = $1`, [sha256(token)]);
  }
  cookieStore.delete(SESSION_COOKIE);
}
