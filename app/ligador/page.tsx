"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useLigadorAuth } from "./LigadorAuth";

const STATUS_OPCOES = [
  { value: "", label: "—" },
  { value: "Subiu Sessão", label: "Subiu Sessão" },
  { value: "Não Consegui Entrar em Contato", label: "Não Consegui Entrar em Contato" },
];

type ClienteLigador = {
  cpfNormalizado: string;
  nome: string;
  cpf: string;
  telefone: string;
  dataCompra: string;
  status: string;
};

export default function LigadorPage() {
  const { token, login, logout, isReady } = useLigadorAuth();
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [clientes, setClientes] = useState<ClienteLigador[]>([]);
  const [carregando, setCarregando] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-3 sm:px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
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

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4">Clientes para contato</h2>
        <p className="text-slate-600 text-sm mb-4">Clique no cliente para ver todos os pedidos. Altere o estado na lista conforme o contato.</p>
        {carregando ? (
          <p className="text-slate-500">Carregando…</p>
        ) : clientes.length === 0 ? (
          <p className="text-slate-500">Nenhum cliente cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl border border-slate-200 shadow-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome</th>
                  <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">CPF</th>
                  <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Telefone</th>
                  <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Data da compra</th>
                  <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.cpfNormalizado} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="px-3 sm:px-4 py-3">
                      <Link
                        href={`/ligador/cliente/${c.cpfNormalizado}`}
                        className="font-medium text-pink-600 hover:underline block"
                      >
                        {c.nome || "—"}
                      </Link>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-slate-700 text-sm">{c.cpf || "—"}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <a
                        href={`tel:${c.telefone}`}
                        className="text-slate-700 text-sm hover:text-pink-600"
                      >
                        {c.telefone || "—"}
                      </a>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-slate-700 text-sm whitespace-nowrap">
                      {c.dataCompra || "—"}
                    </td>
                    <td className="px-3 sm:px-4 py-2">
                      <select
                        value={c.status}
                        onChange={(e) => alterarStatus(c.cpfNormalizado, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 outline-none min-w-[180px]"
                      >
                        {STATUS_OPCOES.map((opt) => (
                          <option key={opt.value || "vazio"} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
