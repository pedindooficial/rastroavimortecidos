"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminAuth } from "../../AdminAuth";
import { DetalhesPedido } from "@/components/DetalhesPedido";
import type { Pedido } from "@/lib/models";

const OPCOES_STATUS_ENTREGA = [
  { value: "", label: "Selecione um status..." },
  { value: "A caminho", label: "A caminho" },
  { value: "Entregue", label: "Entregue" },
  { value: "Em separação", label: "Em separação" },
  { value: "Saiu para entrega", label: "Saiu para entrega" },
];

export default function AdminPedidoPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAdminAuth();
  const id = params.id as string;
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [statusEntrega, setStatusEntrega] = useState("");
  const [salvandoStatus, setSalvandoStatus] = useState(false);

  useEffect(() => {
    if (!token || !id) {
      setCarregando(false);
      if (!token) router.push("/admin");
      return;
    }
    fetch(`/api/admin/pedidos?id=${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Erro ao carregar pedido.");
        return res.json();
      })
      .then((data) => {
        if (data && typeof data._id === "object" && (data._id as { $oid?: string })?.$oid) data._id = (data._id as { $oid: string }).$oid;
        setPedido(data);
        setStatusEntrega(data?.statusEntrega ?? "");
      })
      .catch(() => setErro("Erro ao carregar pedido."))
      .finally(() => setCarregando(false));
  }, [id, token, router]);

  if (!token) return null;

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Carregando…</p>
      </div>
    );
  }

  async function salvarStatusEntrega() {
    if (!token || !id) return;
    setSalvandoStatus(true);
    try {
      const res = await fetch(`/api/admin/pedidos?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statusEntrega }),
      });
      if (res.ok) setPedido((p) => (p ? { ...p, statusEntrega } : p));
    } finally {
      setSalvandoStatus(false);
    }
  }

  if (erro || !pedido) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <header className="bg-white border-b border-slate-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <Link href="/admin" className="text-slate-600 hover:underline text-sm sm:text-base">
              ← Voltar
            </Link>
          </div>
        </header>
        <main className="max-w-2xl mx-auto py-10 text-center">
          <p className="text-red-600 bg-red-50 rounded-lg px-4 py-3">
            {erro || "Pedido não encontrado."}
          </p>
          <Link href="/admin" className="mt-6 inline-block text-pink-600 font-medium hover:underline">
            Voltar à lista
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-3 sm:px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <Link href="/admin" className="text-slate-600 hover:text-pink-600 hover:underline text-sm sm:text-base font-medium">
            ← Voltar à lista
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/admin/novo" className="text-pink-600 text-sm font-medium hover:underline">
              Novo pedido
            </Link>
            <Link href="/" className="text-slate-500 text-sm hover:underline">
              Ver site
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <h3 className="font-semibold text-slate-800 mb-3 text-sm sm:text-base">Status da Entrega</h3>
          <p className="text-xs text-slate-500 mb-2">Defina o status para que o cliente veja na página de rastreio.</p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusEntrega}
              onChange={(e) => setStatusEntrega(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none min-w-[200px]"
            >
              {OPCOES_STATUS_ENTREGA.map((opt) => (
                <option key={opt.value || "vazio"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={salvarStatusEntrega}
              disabled={salvandoStatus}
              className="rounded-lg bg-pink-600 text-white font-medium px-4 py-2 text-sm hover:bg-pink-700 transition disabled:opacity-50"
            >
              {salvandoStatus ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </section>
        <DetalhesPedido pedido={pedido} />
      </main>
    </div>
  );
}
