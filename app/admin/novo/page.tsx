"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminAuth } from "../AdminAuth";
import type { PedidoInput, ItemCarrinho, HistoricoItem } from "@/lib/models";

const emptyTransacao = {
  status: "",
  dataCompra: "",
  dataSaldoDisponivel: "",
  codigoTransacao: "",
  numeroPedido: "",
  totalBruto: 0,
  totalPago: 0,
  taxas: 0,
  totalLiquido: 0,
  formaPagamento: "",
  modalidade: "",
  vencimento: "",
  pix: "",
  reenviarPix: "",
};

const emptyCliente = {
  nome: "",
  email: "",
  telefone: "",
  cpfCnpj: "",
  endereco: "",
};

const emptyItem: ItemCarrinho = { codigo: "", produto: "", quantidade: 0, valor: 0 };
const emptyHistorico: HistoricoItem = { data: "", status: "" };

export default function AdminNovoPage() {
  const router = useRouter();
  const { token } = useAdminAuth();
  const [transacao, setTransacao] = useState(emptyTransacao);
  const [cliente, setCliente] = useState(emptyCliente);
  const [itens, setItens] = useState<ItemCarrinho[]>([{ ...emptyItem }]);
  const [totalCarrinho, setTotalCarrinho] = useState(0);
  const [statusEntrega, setStatusEntrega] = useState("");
  const [historico, setHistorico] = useState<HistoricoItem[]>([{ ...emptyHistorico }]);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  function updateTransacao(field: string, value: string | number) {
    setTransacao((p) => ({ ...p, [field]: value }));
  }

  function updateCliente(field: string, value: string) {
    setCliente((p) => ({ ...p, [field]: value }));
  }

  function updateItem(i: number, field: keyof ItemCarrinho, value: string | number) {
    setItens((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function addItem() {
    setItens((p) => [...p, { ...emptyItem }]);
  }

  function removeItem(i: number) {
    setItens((p) => p.filter((_, idx) => idx !== i));
  }

  function updateHistorico(i: number, field: "data" | "status", value: string) {
    setHistorico((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function addHistorico() {
    setHistorico((p) => [...p, { ...emptyHistorico }]);
  }

  function removeHistorico(i: number) {
    setHistorico((p) => p.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!token) {
      setErro("Sessão expirada. Faça login novamente.");
      return;
    }

    const pedido: PedidoInput = {
      transacao: {
        ...transacao,
        totalBruto: Number(transacao.totalBruto) || 0,
        totalPago: Number(transacao.totalPago) || 0,
        taxas: Number(transacao.taxas) || 0,
        totalLiquido: Number(transacao.totalLiquido) || 0,
      },
      cliente,
      itens: itens
        .filter((i) => i.codigo || i.produto || i.quantidade || i.valor)
        .map((i) => ({
          ...i,
          quantidade: Number(i.quantidade) || 0,
          valor: Number(i.valor) || 0,
        })),
      totalCarrinho: Number(totalCarrinho) || 0,
      statusEntrega: statusEntrega || "Selecione um status...",
      historico: historico.filter((h) => h.data || h.status),
    };

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
        setErro(data.error || "Erro ao cadastrar.");
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
          <h1 className="text-lg font-semibold text-slate-800">Novo pedido (lead)</h1>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {erro && (
            <p className="text-red-600 bg-red-50 rounded-lg px-4 py-2">{erro}</p>
          )}

          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Detalhes da Transação
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["status", "Status", "text"],
                ["dataCompra", "Data da compra", "text"],
                ["dataSaldoDisponivel", "Data do Saldo disponível", "text"],
                ["codigoTransacao", "Código da Transação", "text"],
                ["numeroPedido", "Número do Pedido", "text"],
                ["totalBruto", "Total Bruto", "number"],
                ["totalPago", "Total Pago", "number"],
                ["taxas", "Taxas", "number"],
                ["totalLiquido", "Total Líquido", "number"],
                ["formaPagamento", "Forma de Pagamento", "text"],
                ["modalidade", "Modalidade", "text"],
                ["vencimento", "Vencimento", "text"],
                ["pix", "PIX", "text"],
                ["reenviarPix", "Reenviar PIX", "text"],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={transacao[key as keyof typeof transacao] ?? ""}
                    onChange={(e) =>
                      updateTransacao(
                        key,
                        type === "number"
                          ? Number(e.target.value) || 0
                          : e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Informações do Cliente
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["nome", "Nome"],
                ["email", "E-mail"],
                ["telefone", "Telefone"],
                ["cpfCnpj", "CPF/CNPJ"],
                ["endereco", "Endereço"],
              ].map(([key, label]) => (
                <div key={key} className={key === "endereco" ? "sm:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={cliente[key as keyof typeof cliente] ?? ""}
                    onChange={(e) => updateCliente(key, e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Itens do Carrinho
            </h2>
            {itens.map((item, i) => (
              <div
                key={i}
                className="grid gap-3 sm:grid-cols-5 items-end mb-3 p-3 bg-slate-50 rounded-lg"
              >
                <input
                  placeholder="Cód."
                  value={item.codigo}
                  onChange={(e) => updateItem(i, "codigo", e.target.value)}
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  placeholder="Produto"
                  value={item.produto}
                  onChange={(e) => updateItem(i, "produto", e.target.value)}
                  className="sm:col-span-2 rounded border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Qtd"
                  value={item.quantidade || ""}
                  onChange={(e) => updateItem(i, "quantidade", e.target.value)}
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Valor"
                    value={item.valor || ""}
                    onChange={(e) => updateItem(i, "valor", e.target.value)}
                    className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="text-pink-600 text-sm font-medium hover:underline"
            >
              + Adicionar item
            </button>
            <div className="mt-3">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Total do Carrinho (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={totalCarrinho || ""}
                onChange={(e) => setTotalCarrinho(Number(e.target.value) || 0)}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Status da Entrega
            </label>
            <input
              type="text"
              value={statusEntrega}
              onChange={(e) => setStatusEntrega(e.target.value)}
              placeholder="Ex: Em separação, Enviado, Entregue"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Histórico da Compra
            </h2>
            {historico.map((h, i) => (
              <div key={i} className="flex gap-3 mb-3">
                <input
                  placeholder="Data"
                  value={h.data}
                  onChange={(e) => updateHistorico(i, "data", e.target.value)}
                  className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  placeholder="Status"
                  value={h.status}
                  onChange={(e) => updateHistorico(i, "status", e.target.value)}
                  className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeHistorico(i)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Remover
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addHistorico}
              className="text-pink-600 text-sm font-medium hover:underline"
            >
              + Adicionar status
            </button>
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
