import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
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
  const id = request.nextUrl.searchParams.get("id");
  try {
    if (id) {
      if (isDataApiConfigured()) {
        const docs = await dataApiFind({ _id: { $oid: id } }, undefined, 1);
        const pedido = Array.isArray(docs) && docs.length > 0 ? docs[0] : null;
        if (!pedido) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
        return NextResponse.json(pedido);
      }
      const db = await getDb();
      let objId: ObjectId;
      try {
        objId = new ObjectId(id);
      } catch {
        return NextResponse.json({ error: "ID inválido." }, { status: 400 });
      }
      const pedido = await db.collection("pedidos").findOne({ _id: objId });
      if (!pedido) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
      return NextResponse.json({ ...pedido, _id: (pedido as { _id: ObjectId })._id.toString() });
    }
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
    return NextResponse.json(pedidos.map((p) => ({ ...p, _id: (p as { _id?: ObjectId })._id?.toString() ?? p._id })));
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
