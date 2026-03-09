import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isDataApiConfigured, dataApiFind } from "@/lib/mongodb-data-api";

export const dynamic = "force-dynamic";

const LIGADOR_STATUS_COLLECTION = "ligador_status";

function normalizarCpf(value: string): string {
  return (value || "").replace(/\D/g, "");
}

function isLigadorAuthorized(request: NextRequest): boolean {
  const secret = process.env.LIGADOR_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isLigadorAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    let pedidos: unknown[];
    if (isDataApiConfigured()) {
      pedidos = await dataApiFind({}, { createdAt: -1 }, 500);
    } else {
      const db = await getDb();
      pedidos = await db.collection("pedidos").find({}).sort({ createdAt: -1 }).limit(500).toArray();
    }

    const cpfMap = new Map<string, { nome: string; cpf: string; telefone: string; dataCompra: string; totalPedidos: number }>();
    for (const p of pedidos as { cliente?: { cpfNormalizado?: string; cpfCnpj?: string; nome?: string; telefone?: string }; transacao?: { dataCompra?: string; totalPago?: number }; totalCarrinho?: number }[]) {
      const c = p.cliente;
      if (!c) continue;
      const cpfNorm = c.cpfNormalizado || normalizarCpf(c.cpfCnpj || "");
      if (!cpfNorm) continue;
      const valorPedido = p.transacao?.totalPago ?? p.totalCarrinho ?? 0;
      const existing = cpfMap.get(cpfNorm);
      if (existing) {
        existing.totalPedidos += valorPedido;
      } else {
        cpfMap.set(cpfNorm, {
          nome: c.nome || "",
          cpf: c.cpfCnpj || cpfNorm,
          telefone: c.telefone || "",
          dataCompra: p.transacao?.dataCompra || "",
          totalPedidos: valorPedido,
        });
      }
    }

    let statusMap = new Map<string, string>();
    if (isDataApiConfigured()) {
      const statusDocs = await dataApiFind({}, undefined, 1000, LIGADOR_STATUS_COLLECTION);
      for (const d of statusDocs as { cpfNormalizado?: string; status?: string }[]) {
        if (d.cpfNormalizado) statusMap.set(d.cpfNormalizado, d.status || "");
      }
    } else {
      const db = await getDb();
      const statusDocs = await db.collection(LIGADOR_STATUS_COLLECTION).find({}).toArray();
      for (const d of statusDocs as { cpfNormalizado?: string; status?: string }[]) {
        if (d.cpfNormalizado) statusMap.set(d.cpfNormalizado, d.status || "");
      }
    }

    const clientes = Array.from(cpfMap.entries()).map(([cpfNormalizado, dados]) => ({
      cpfNormalizado,
      nome: dados.nome,
      cpf: dados.cpf,
      telefone: dados.telefone,
      dataCompra: dados.dataCompra,
      totalPedidos: Math.round(dados.totalPedidos * 100) / 100,
      status: statusMap.get(cpfNormalizado) || "",
    }));

    return NextResponse.json(clientes);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao listar clientes.", detail: msg },
      { status: 500 }
    );
  }
}
