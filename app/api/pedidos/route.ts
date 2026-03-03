import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

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

    const db = await getDb();
    const colecao = db.collection("pedidos");
    const cpfNorm = normalizarCpf(cpf);

    const pedidos = await colecao
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
