import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Admin não configurado." }, { status: 500 });
  }
  const body = await request.json().catch(() => ({}));
  const password = body.password as string | undefined;
  if (password === secret) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
}
