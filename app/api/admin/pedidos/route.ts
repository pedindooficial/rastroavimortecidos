import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  isDataApiConfigured,
  dataApiFind,
  dataApiInsertOne,
} from "@/lib/mongodb-data-api";
import type { PedidoInput } from "@/lib/models";

export const dynamic = "force-dynamic";

function normalizarCpf(value: string): string {
  return (value || "").replace(/\D/g, "");
}

function isAdminAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    if (isDataApiConfigured()) {
      const pedidos = await dataApiFind({}, { createdAt: -1 });
      return NextResponse.json(pedidos);
    }
    const db = await getDb();
    const pedidos = await db
      .collection("pedidos")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(pedidos);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao listar pedidos.", detail: msg },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    const body = (await request.json()) as PedidoInput;
    const cpfNorm = normalizarCpf(body.cliente.cpfCnpj || "");
    const doc = {
      ...body,
      cliente: { ...body.cliente, cpfNormalizado: cpfNorm },
      createdAt: new Date().toISOString(),
    };

    if (isDataApiConfigured()) {
      const result = await dataApiInsertOne(doc);
      return NextResponse.json({
        _id: result.insertedId,
        message: "Pedido cadastrado com sucesso.",
      });
    }

    const db = await getDb();
    const result = await db.collection("pedidos").insertOne(doc);
    return NextResponse.json({
      _id: result.insertedId.toString(),
      message: "Pedido cadastrado com sucesso.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao cadastrar pedido.", detail: msg },
      { status: 500 }
    );
  }
}
