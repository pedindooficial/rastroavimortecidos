"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { DetalhesPedido } from "@/components/DetalhesPedido";
import type { Pedido } from "@/lib/models";

const COOKIE_NAME = "rastreio_cpf";
const COOKIE_MAX_AGE = 24 * 60 * 60; // 24h em segundos

function setRastreioCookie(cpf: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(cpf)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function getRastreioCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearRastreioCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

function RastreioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cpfFromUrl = searchParams.get("cpf");
  const [cpf, setCpf] = useState<string | null>(cpfFromUrl);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const cpfToUse = cpfFromUrl || getRastreioCookie();
    if (!cpfToUse) {
      setErro("CPF não informado.");
      setCarregando(false);
      return;
    }
    if (!cpfFromUrl && cpfToUse) {
      router.replace(`/rastreio?cpf=${encodeURIComponent(cpfToUse)}`);
      return;
    }
    setCpf(cpfToUse);
    fetch(`/api/pedidos?cpf=${encodeURIComponent(cpfToUse)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setErro(data.error || "Erro ao carregar pedidos.");
          return;
        }
        setPedidos(data);
        if (data.length > 0) setRastreioCookie(cpfToUse);
      })
      .catch(() => setErro("Erro ao carregar pedidos."))
      .finally(() => setCarregando(false));
  }, [cpfFromUrl, router]);

  function handleSair() {
    clearRastreioCookie();
    router.push("/");
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Carregando pedidos…</p>
      </div>
    );
  }

  if (erro || pedidos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header
          className="w-full bg-cover bg-center bg-no-repeat py-4 sm:py-6 px-3 sm:px-4"
          style={{ backgroundImage: "url(/bg-header.png)" }}
        >
          <div className="max-w-4xl mx-auto flex justify-center">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Avimor tecidos.com.br"
                width={240}
                height={70}
                className="object-contain w-48 sm:w-[280px] h-auto"
              />
            </Link>
          </div>
        </header>
        <main className="flex-1 max-w-2xl mx-auto px-3 sm:px-4 py-8 sm:py-10 text-center">
          <p className="text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm sm:text-base">
            {erro || "Nenhum pedido encontrado para este CPF."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-pink-600 font-medium hover:underline text-sm sm:text-base"
          >
            Voltar e consultar outro CPF
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header
        className="w-full bg-cover bg-center bg-no-repeat py-4 sm:py-6 px-3 sm:px-4"
        style={{ backgroundImage: "url(/bg-header.png)" }}
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex justify-center sm:justify-start">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Avimor tecidos.com.br"
                width={240}
                height={70}
                className="object-contain w-48 sm:w-[280px] h-auto"
              />
            </Link>
          </div>
          <div className="flex justify-center sm:justify-end">
            <button
              onClick={handleSair}
              className="text-sm font-medium text-slate-600 bg-white/90 hover:bg-white border border-slate-200 rounded-lg px-4 py-2 shadow-sm"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-3 sm:px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-xs sm:text-sm text-slate-600 hover:text-pink-600 order-2 sm:order-1"
          >
            ← Voltar e consultar outro CPF
          </Link>
          <p className="text-xs text-slate-500 order-1 sm:order-2">
            Sessão válida por 24h. Ao fechar a aba você pode voltar aqui e continuar vendo seus pedidos.
          </p>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">
          Seus pedidos
        </h1>
        <div className="space-y-6 sm:space-y-8">
          {pedidos.map((p) => {
            const rawId = p._id as string | { $oid?: string } | undefined;
            const key = typeof rawId === "string" ? rawId : rawId?.$oid ?? String(rawId ?? "");
            return <DetalhesPedido key={key} pedido={p} mostrarStatusEntrega={false} />;
          })}
        </div>
      </main>

      <footer className="py-4 text-center text-slate-400 text-xs sm:text-sm border-t border-slate-200 mt-8">
        Avimor tecidos.com.br — Rastreio de pedidos
      </footer>
    </div>
  );
}

export default function RastreioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-slate-500">Carregando…</p>
        </div>
      }
    >
      <RastreioContent />
    </Suspense>
  );
}
