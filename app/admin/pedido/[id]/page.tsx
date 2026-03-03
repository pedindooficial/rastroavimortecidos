"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminAuth } from "../../AdminAuth";
import { DetalhesPedido } from "@/components/DetalhesPedido";
import type { Pedido } from "@/lib/models";

export default function AdminPedidoPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAdminAuth();
  const id = params.id as string;
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

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
        if (data && typeof data._id === "object" && data._id?.$oid) data._id = data._id.$oid;
        setPedido(data);
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

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <DetalhesPedido pedido={pedido} />
      </main>
    </div>
  );
}
