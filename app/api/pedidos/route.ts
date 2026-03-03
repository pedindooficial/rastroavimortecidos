import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  isDataApiConfigured,
  dataApiFind,
} from "@/lib/mongodb-data-api";

export const dynamic = "force-dynamic";

const isVercel = process.env.VERCEL === "1";

function normalizarCpf(value: string): string {
  return (value || "").replace(/\D/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const cpf = request.nextUrl.searchParams.get("cpf");
    if (!cpf || normalizarCpf(cpf).length < 11) {
      return NextResponse.json(
        { error: "Informe um CPF válido com 11 dígitos." },
        { status: 400 }
      );
    }

    if (isVercel && !isDataApiConfigured()) {
      return NextResponse.json(
        { error: "Consulta temporariamente indisponível. Tente mais tarde." },
        { status: 503 }
      );
    }

    const cpfNorm = normalizarCpf(cpf);

    if (isDataApiConfigured()) {
      const pedidos = await dataApiFind(
        {
          $or: [
            { "cliente.cpfNormalizado": cpfNorm },
            { "cliente.cpfCnpj": cpfNorm },
          ],
        },
        { "transacao.dataCompra": -1 }
      );
      return NextResponse.json(pedidos);
    }

    const db = await getDb();
    const pedidos = await db
      .collection("pedidos")
      .find({
        $or: [
          { "cliente.cpfNormalizado": cpfNorm },
          { "cliente.cpfCnpj": cpfNorm },
        ],
      })
      .sort({ "transacao.dataCompra": -1 })
      .toArray();

    return NextResponse.json(pedidos);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao buscar pedidos." },
      { status: 500 }
    );
  }
}
