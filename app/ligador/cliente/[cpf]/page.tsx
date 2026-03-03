"use client";

import Link from "next/link";
import { useParams, useEffect, useState } from "react";
import { DetalhesPedido } from "@/components/DetalhesPedido";
import { useAdminAuth } from "@/app/admin/AdminAuth";
import type { Pedido } from "@/lib/models";

export default function LigadorClientePage() {
  const params = useParams();
  const cpf = (params.cpf as string) || "";
  const { token, isReady } = useAdminAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!cpf || !isReady) return;
    setCarregando(true);
    setErro("");
    fetch(`/api/pedidos?cpf=${encodeURIComponent(cpf)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setErro(data.error || "Erro ao carregar pedidos.");
          setPedidos([]);
          return;
        }
        setPedidos(data);
      })
      .catch(() => {
        setErro("Erro ao carregar pedidos.");
        setPedidos([]);
      })
      .finally(() => setCarregando(false));
  }, [cpf, isReady]);

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
        <p className="text-slate-600">Acesso restrito. Faça login em /ligador.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-3 sm:px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-base sm:text-lg font-semibold text-slate-800">Detalhes do cliente</h1>
          <Link href="/ligador" className="text-pink-600 font-medium hover:underline text-sm sm:text-base">
            ← Voltar à lista
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {carregando ? (
          <p className="text-slate-500">Carregando pedidos…</p>
        ) : erro ? (
          <p className="text-red-600">{erro}</p>
        ) : pedidos.length === 0 ? (
          <p className="text-slate-500">Nenhum pedido encontrado para este CPF.</p>
        ) : (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800">
              {pedidos.length} pedido(s) — {pedidos[0]?.cliente?.nome || "Cliente"}
            </h2>
            {pedidos.map((p) => {
              const rawId = p._id as string | { $oid?: string } | undefined;
              const id = typeof rawId === "string" ? rawId : rawId?.$oid ?? String(rawId ?? "");
              return (
                <DetalhesPedido
                  key={id}
                  pedido={p}
                  mostrarStatusEntrega={true}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
