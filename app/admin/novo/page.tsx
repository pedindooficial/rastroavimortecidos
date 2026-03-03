"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminAuth } from "../AdminAuth";
import type { PedidoInput, ItemCarrinho, HistoricoItem } from "@/lib/models";

function limparPrefixo(line: string, label: string): string {
  return line.replace(label, "").trim();
}

function encontrarValor(lines: string[], label: string): string {
  const l = lines.find((line) => line.startsWith(label));
  return l ? limparPrefixo(l, label).trim() : "";
}

/** Aceita "68.85" (ponto decimal) ou "257,61" / "1.257,61" (formato BR). */
function parseMoeda(value: string): number {
  if (!value) return 0;
  const limpo = value.replace(/[R$\s]/g, "").trim();
  if (limpo.includes(",")) {
    const br = limpo.replace(/\./g, "").replace(",", ".");
    const n = Number(br);
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(limpo);
  return Number.isFinite(n) ? n : 0;
}

function parseItens(lines: string[]): ItemCarrinho[] {
  const itens: ItemCarrinho[] = [];
  const startIndex = lines.findIndex((l) => l.startsWith("Cod. Produto"));
  if (startIndex === -1) return itens;

  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("Total do Carrinho")) break;

    const parts = line.split(/\t+/);
    if (parts.length < 4) continue;
    const [codigo, produto, quantidadeStr, valorStr] = parts;
    itens.push({
      codigo: codigo.trim(),
      produto: produto.trim(),
      quantidade: Number(quantidadeStr.replace(",", ".")) || 0,
      valor: parseMoeda(valorStr),
    });
  }

  return itens;
}

function parseHistorico(lines: string[]): HistoricoItem[] {
  const historico: HistoricoItem[] = [];
  const startIndex = lines.findIndex((l) => l.startsWith("Data\tStatus"));
  if (startIndex === -1) return historico;

  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) break;
    const parts = line.split(/\t+/);
    if (parts.length < 2) continue;
    const [data, status] = parts;
    historico.push({ data: data.trim(), status: status.trim() });
  }

  return historico;
}

function parsePedidoFromTexto(texto: string): PedidoInput {
  const lines = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (!lines.length) {
    throw new Error("Cole o conteúdo completo do pedido.");
  }

  const status = encontrarValor(lines, "Status:");
  const dataCompra = encontrarValor(lines, "Data da compra:");
  const dataSaldoDisponivel = encontrarValor(lines, "Data do Saldo disponível:");
  const codigoTransacao = encontrarValor(lines, "Codigo da Transação:");
  const numeroPedido = encontrarValor(lines, "Numero do Pedido:");
  const totalBruto = parseMoeda(encontrarValor(lines, "Total Bruto:"));
  const totalPago = parseMoeda(encontrarValor(lines, "Total Pago:"));
  const taxas = parseMoeda(encontrarValor(lines, "Taxas:"));
  const totalLiquido = parseMoeda(encontrarValor(lines, "Total Liquido:"));
  const formaPagamento = encontrarValor(lines, "Forma de Pagamento:");
  const modalidade = encontrarValor(lines, "Modalidade:");
  const vencimento = encontrarValor(lines, "Vencimento:");
  const pix = encontrarValor(lines, "PIX:");
  const reenviarPix = encontrarValor(lines, "Reenviar PIX:");

  const nome = encontrarValor(lines, "Nome:");
  const email = encontrarValor(lines, "E-mail:");
  const telefone = encontrarValor(lines, "Telefone:");
  const cpfCnpj = encontrarValor(lines, "CPF/CNPJ:");
  const endereco = encontrarValor(lines, "Endereço:");

  const itens = parseItens(lines);
  const totalCarrinho = parseMoeda(encontrarValor(lines, "Total do Carrinho:"));

  let statusEntrega = "";
  const idxEntregue = lines.findIndex((l) => l.startsWith("Entregue?"));
  if (idxEntregue !== -1) {
    const idxStatus = lines.findIndex(
      (l, i) => i > idxEntregue && l.startsWith("Status:")
    );
    if (idxStatus !== -1 && lines[idxStatus + 1]) {
      statusEntrega = lines[idxStatus + 1];
    }
  }

  const historico = parseHistorico(lines);

  if (!cpfCnpj || !numeroPedido) {
    throw new Error("Não consegui encontrar CPF ou Número do Pedido no texto.");
  }

  const pedido: PedidoInput = {
    transacao: {
      status,
      dataCompra,
      dataSaldoDisponivel,
      codigoTransacao,
      numeroPedido,
      totalBruto,
      totalPago,
      taxas,
      totalLiquido,
      formaPagamento,
      modalidade,
      vencimento,
      pix,
      reenviarPix,
    },
    cliente: {
      nome,
      email,
      telefone,
      cpfCnpj,
      endereco,
    },
    itens,
    totalCarrinho: totalCarrinho || totalPago || totalBruto,
    statusEntrega: statusEntrega || "Selecione um status...",
    historico,
  };

  return pedido;
}

export default function AdminNovoPage() {
  const router = useRouter();
  const { token } = useAdminAuth();
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!token) {
      setErro("Sessão expirada. Faça login novamente.");
      return;
    }

    let pedido: PedidoInput;
    try {
      pedido = parsePedidoFromTexto(texto);
    } catch (err: any) {
      setErro(err?.message || "Não foi possível interpretar o texto colado.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/admin/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pedido),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail
          ? `${data.error || "Erro"} — ${data.detail}`
          : data.error || "Erro ao cadastrar.";
        setErro(msg);
        return;
      }
      router.push("/admin");
    } catch {
      setErro("Erro ao enviar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Redirecionando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="container max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/admin" className="text-slate-600 hover:underline">
            ← Voltar
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">
            Novo pedido (colar texto)
          </h1>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {erro && (
            <p className="text-red-600 bg-red-50 rounded-lg px-4 py-2">{erro}</p>
          )}

          <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
            <p className="text-sm text-slate-600">
              Cole aqui o texto completo da página de detalhes do pedido
              (começando em &quot;Detalhes da Transação&quot; até o
              &quot;Histórico da Compra&quot;).
            </p>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={16}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono whitespace-pre-wrap"
              placeholder="Cole aqui o texto copiado..."
            />
          </section>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-pink-600 text-white font-medium py-3 px-6 hover:bg-pink-700 disabled:opacity-60"
            >
              {enviando ? "Salvando…" : "Cadastrar pedido"}
            </button>
            <Link
              href="/admin"
              className="rounded-lg border border-slate-300 py-3 px-6 text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

