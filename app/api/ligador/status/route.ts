import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isDataApiConfigured, dataApiUpdateOne } from "@/lib/mongodb-data-api";

export const dynamic = "force-dynamic";

const LIGADOR_STATUS_COLLECTION = "ligador_status";

function normalizarCpf(value: string): string {
  return (value || "").replace(/\D/g, "");
}

function isAdminAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function PATCH(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const cpf = normalizarCpf(body.cpf ?? "");
    const status = String(body.status ?? "").trim();
    if (cpf.length < 11) {
      return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
    }

    const doc = { cpfNormalizado: cpf, status };

    if (isDataApiConfigured()) {
      await dataApiUpdateOne(
        { cpfNormalizado: cpf },
        doc,
        true,
        LIGADOR_STATUS_COLLECTION
      );
    } else {
      const db = await getDb();
      await db.collection(LIGADOR_STATUS_COLLECTION).updateOne(
        { cpfNormalizado: cpf },
        { $set: doc },
        { upsert: true }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao atualizar status.", detail: msg },
      { status: 500 }
    );
  }
}
