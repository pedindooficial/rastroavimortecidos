import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import {
  isDataApiConfigured,
  dataApiFind,
  dataApiInsertOne,
  dataApiUpdateOne,
} from "@/lib/mongodb-data-api";
import type { PedidoInput } from "@/lib/models";

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
      const statusDocs = await dataApiFind({}, undefined, 1000, LIGADOR_STATUS_COLLECTION);
      const statusMap = new Map<string, string>();
      for (const d of statusDocs as { cpfNormalizado?: string; status?: string }[]) {
        if (d.cpfNormalizado) statusMap.set(d.cpfNormalizado, d.status || "");
      }
      const list = (pedidos as Record<string, unknown>[]).map((p) => {
        const cpfNorm = (p.cliente as { cpfNormalizado?: string } | undefined)?.cpfNormalizado;
        return {
          ...p,
          _id: typeof (p._id as { $oid?: string })?.$oid === "string" ? (p._id as { $oid: string }).$oid : p._id,
          ligadorStatus: cpfNorm ? statusMap.get(cpfNorm) ?? "" : "",
        };
      });
      return NextResponse.json(list);
    }
    const db = await getDb();
    const pedidos = await db
      .collection("pedidos")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    const statusDocs = await db.collection(LIGADOR_STATUS_COLLECTION).find({}).toArray();
    const statusMap = new Map<string, string>();
    for (const d of statusDocs as { cpfNormalizado?: string; status?: string }[]) {
      if (d.cpfNormalizado) statusMap.set(d.cpfNormalizado, d.status || "");
    }
    const list = pedidos.map((p) => {
      const ped = p as { _id?: ObjectId; cliente?: { cpfNormalizado?: string } };
      const cpfNorm = ped.cliente?.cpfNormalizado;
      return {
        ...ped,
        _id: ped._id?.toString() ?? ped._id,
        ligadorStatus: cpfNorm ? statusMap.get(cpfNorm) ?? "" : "",
      };
    });
    return NextResponse.json(list);
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

export async function PATCH(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID do pedido é obrigatório." }, { status: 400 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const statusEntrega = typeof body.statusEntrega === "string" ? body.statusEntrega.trim() : "";
    if (isDataApiConfigured()) {
      await dataApiUpdateOne(
        { _id: { $oid: id } },
        { statusEntrega },
        false,
        "pedidos"
      );
      return NextResponse.json({ ok: true });
    }
    const db = await getDb();
    let objId: ObjectId;
    try {
      objId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }
    await db.collection("pedidos").updateOne(
      { _id: objId },
      { $set: { statusEntrega } }
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao atualizar pedido.", detail: msg },
      { status: 500 }
    );
  }
}
