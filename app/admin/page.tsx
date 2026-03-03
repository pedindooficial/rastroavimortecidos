"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminAuth } from "./AdminAuth";
import type { Pedido } from "@/lib/models";

export default function AdminPage() {
  const { token, login, logout, isReady } = useAdminAuth();
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!token) return;
    setCarregando(true);
    fetch("/api/admin/pedidos", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPedidos(data);
      })
      .finally(() => setCarregando(false));
  }, [token]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const ok = await login(password);
    if (!ok) setErro("Senha incorreta.");
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
          <h1 className="text-xl font-bold text-slate-800">Área administrativa</h1>
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
          <h1 className="text-base sm:text-lg font-semibold text-slate-800">Admin — Avimor Rastreio</h1>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              href="/admin/novo"
              className="text-pink-600 font-medium hover:underline text-sm sm:text-base"
            >
              Novo pedido
            </Link>
            <Link href="/" className="text-slate-600 text-sm hover:underline">
              Ver site
            </Link>
            <button
              onClick={logout}
              className="text-slate-500 text-sm hover:text-slate-700"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4">Pedidos cadastrados</h2>
        {carregando ? (
          <p className="text-slate-500">Carregando…</p>
        ) : pedidos.length === 0 ? (
          <p className="text-slate-500">Nenhum pedido cadastrado ainda.</p>
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {pedidos.map((p) => {
              const rawId = p._id as string | { $oid?: string } | undefined;
              const pedidoId = typeof rawId === "string" ? rawId : rawId?.$oid ?? String(rawId ?? "");
              return (
                <li key={pedidoId}>
                  <Link
                    href={`/admin/pedido/${pedidoId}`}
                    className="block bg-white rounded-lg border border-slate-200 p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 hover:border-pink-300 hover:bg-pink-50/30 transition"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-slate-800 block sm:inline">
                        Pedido #{p.transacao.numeroPedido}
                      </span>
                      <span className="text-slate-500 text-xs sm:text-sm sm:ml-2 block sm:inline mt-0.5 sm:mt-0">
                        {p.cliente.nome} — {p.cliente.cpfCnpj}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-slate-500 shrink-0">Clique para ver detalhes · {p.transacao.dataCompra}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
