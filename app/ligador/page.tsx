"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useLigadorAuth } from "./LigadorAuth";

function IconCopiar({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16V4a2 2 0 0 1 2-2h12" />
    </svg>
  );
}

function IconChevron({ aberto, className }: { aberto: boolean; className?: string }) {
  return (
    <svg className={`${className} transition-transform ${aberto ? "rotate-90" : ""}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

const STATUS_OPCOES = [
  { value: "", label: "—" },
  { value: "Subiu Sessão", label: "Subiu Sessão" },
  { value: "Não Consegui Entrar em Contato", label: "Não Consegui Entrar em Contato" },
  { value: "Chamado No Whatsapp", label: "Chamado No Whatsapp" },
];

type CompraResumo = {
  numeroPedido: string;
  dataCompra: string;
  totalPago: number;
  status: string;
};

type ClienteLigador = {
  cpfNormalizado: string;
  nome: string;
  cpf: string;
  telefone: string;
  totalPedidos: number;
  compras: CompraResumo[];
  status: string;
};

type Ordenacao = "padrao" | "menor_preco" | "maior_preco";

function formatarMoeda(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function LigadorPage() {
  const { token, login, logout, isReady } = useLigadorAuth();
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [clientes, setClientes] = useState<ClienteLigador[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("padrao");
  const [expandido, setExpandido] = useState<Set<string>>(new Set());

  function toggleExpandir(cpf: string) {
    setExpandido((prev) => {
      const next = new Set(prev);
      if (next.has(cpf)) next.delete(cpf);
      else next.add(cpf);
      return next;
    });
  }

  async function copiar(texto: string, id: string) {
    if (!texto || texto === "—") return;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 1500);
    } catch {
      setCopiadoId(null);
    }
  }

  function BotaoCopiar({ valor, id }: { valor: string; id: string }) {
    const vazio = !valor || valor === "—";
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!vazio) copiar(valor, id);
        }}
        className="ml-1.5 p-1 rounded text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition inline-flex items-center shrink-0"
        title="Copiar"
        aria-label="Copiar"
        disabled={vazio}
      >
        <IconCopiar className="w-4 h-4" />
        {copiadoId === id && <span className="ml-1 text-xs text-green-600">Copiado!</span>}
      </button>
    );
  }

  const carregarClientes = useCallback(() => {
    if (!token) return;
    setCarregando(true);
    fetch("/api/ligador/clientes", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setClientes(data);
      })
      .finally(() => setCarregando(false));
  }, [token]);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const ok = await login(password);
    if (!ok) setErro("Senha incorreta.");
  }

  async function alterarStatus(cpfNormalizado: string, status: string) {
    if (!token) return;
    const res = await fetch("/api/ligador/status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cpf: cpfNormalizado, status }),
    });
    if (res.ok) {
      setClientes((prev) =>
        prev.map((c) => (c.cpfNormalizado === cpfNormalizado ? { ...c, status } : c))
      );
    }
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Carregando…</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-xl shadow-md p-6 w-full max-w-sm space-y-4"
        >
          <h1 className="text-xl font-bold text-slate-800">Ligador — Avimor</h1>
          <p className="text-sm text-slate-500">Digite a senha de acesso.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-800 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
            required
          />
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-pink-600 text-white font-medium py-2 hover:bg-pink-700 transition"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  const clientesOrdenados = [...clientes].sort((a, b) => {
    if (ordenacao === "menor_preco") return a.totalPedidos - b.totalPedidos;
    if (ordenacao === "maior_preco") return b.totalPedidos - a.totalPedidos;
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-3 sm:px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-base sm:text-lg font-semibold text-slate-800">Ligador — Avimor</h1>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Link href="/admin" className="text-pink-600 font-medium hover:underline text-sm sm:text-base">
              Admin
            </Link>
            <Link href="/" className="text-slate-600 text-sm hover:underline">
              Ver site
            </Link>
            <button onClick={logout} className="text-slate-500 text-sm hover:text-slate-700">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4">Clientes para contato</h2>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <p className="text-slate-600 text-sm">Clique na seta para expandir as compras. Altere o estado conforme o contato.</p>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-500">Ordenar:</span>
            <button
              type="button"
              onClick={() => setOrdenacao(ordenacao === "menor_preco" ? "padrao" : "menor_preco")}
              className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium ${ordenacao === "menor_preco" ? "bg-pink-600 text-white border-pink-600" : "bg-white text-slate-700 border-slate-300 hover:border-pink-400"}`}
            >
              Menor valor
            </button>
            <button
              type="button"
              onClick={() => setOrdenacao(ordenacao === "maior_preco" ? "padrao" : "maior_preco")}
              className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium ${ordenacao === "maior_preco" ? "bg-pink-600 text-white border-pink-600" : "bg-white text-slate-700 border-slate-300 hover:border-pink-400"}`}
            >
              Maior valor
            </button>
          </div>
        </div>
        {carregando ? (
          <p className="text-slate-500">Carregando…</p>
        ) : clientes.length === 0 ? (
          <p className="text-slate-500">Nenhum cliente cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl border border-slate-200 shadow-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-2 py-3 w-8"></th>
                  <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome</th>
                  <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">CPF</th>
                  <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Telefone</th>
                  <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Valor total</th>
                  <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Compras</th>
                  <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>
                {clientesOrdenados.map((c) => {
                  const aberto = expandido.has(c.cpfNormalizado);
                  return (
                    <>
                      <tr key={c.cpfNormalizado} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleExpandir(c.cpfNormalizado)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-pink-600 transition"
                            title={aberto ? "Recolher" : "Expandir compras"}
                          >
                            <IconChevron aberto={aberto} className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <span className="flex items-center gap-0 flex-wrap">
                            <Link
                              href={`/ligador/cliente/${c.cpfNormalizado}`}
                              className="font-medium text-pink-600 hover:underline"
                            >
                              {c.nome || "—"}
                            </Link>
                            <BotaoCopiar valor={c.nome} id={`nome-${c.cpfNormalizado}`} />
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <span className="flex items-center text-slate-700 text-sm">
                            {c.cpf || "—"}
                            <BotaoCopiar valor={c.cpf} id={`cpf-${c.cpfNormalizado}`} />
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <span className="flex items-center">
                            <a
                              href={`tel:${c.telefone}`}
                              className="text-slate-700 text-sm hover:text-pink-600"
                            >
                              {c.telefone || "—"}
                            </a>
                            <BotaoCopiar valor={c.telefone} id={`tel-${c.cpfNormalizado}`} />
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-slate-700 text-sm font-medium whitespace-nowrap">
                          {c.totalPedidos > 0 ? formatarMoeda(c.totalPedidos) : "—"}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-slate-700 text-sm whitespace-nowrap">
                          {c.compras.length} pedido{c.compras.length !== 1 ? "s" : ""}
                        </td>
                        <td className="px-3 sm:px-4 py-2">
                          <select
                            value={c.status}
                            onChange={(e) => alterarStatus(c.cpfNormalizado, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 outline-none min-w-[260px]"
                          >
                            {STATUS_OPCOES.map((opt) => (
                              <option key={opt.value || "vazio"} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                      {aberto && (
                        <tr key={`${c.cpfNormalizado}-compras`} className="border-b border-slate-100">
                          <td colSpan={7} className="px-4 sm:px-8 py-3 bg-slate-50/70">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Compras de {c.nome || c.cpf}</p>
                            <table className="w-full text-xs sm:text-sm">
                              <thead>
                                <tr className="text-left text-slate-500">
                                  <th className="pb-1 pr-4 font-medium">Pedido</th>
                                  <th className="pb-1 pr-4 font-medium">Data</th>
                                  <th className="pb-1 pr-4 font-medium">Valor</th>
                                  <th className="pb-1 font-medium">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {c.compras.map((compra, i) => (
                                  <tr key={i} className="border-t border-slate-200/60">
                                    <td className="py-1.5 pr-4 text-slate-700">#{compra.numeroPedido || "—"}</td>
                                    <td className="py-1.5 pr-4 text-slate-700 whitespace-nowrap">{compra.dataCompra || "—"}</td>
                                    <td className="py-1.5 pr-4 text-slate-700 font-medium">{formatarMoeda(compra.totalPago)}</td>
                                    <td className="py-1.5 text-slate-700">{compra.status || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
