"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

export default function HomePage() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function soNumeros(value: string): string {
    return value.replace(/\D/g, "");
  }

  function formatarCpf(value: string): string {
    const n = soNumeros(value).slice(0, 11);
    if (n.length <= 3) return n;
    if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
    if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
    return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");
    const apenasNumeros = soNumeros(cpf);
    if (apenasNumeros.length !== 11) {
      setErro("Digite um CPF válido com 11 dígitos.");
      return;
    }
    setCarregando(true);
    try {
      const res = await fetch(`/api/pedidos?cpf=${encodeURIComponent(apenasNumeros)}`);
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Erro ao consultar.");
        return;
      }
      if (!Array.isArray(data) || data.length === 0) {
        setErro("Nenhum pedido encontrado para este CPF.");
        return;
      }
      router.push(`/rastreio?cpf=${encodeURIComponent(apenasNumeros)}`);
    } catch {
      setErro("Erro ao consultar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="w-full bg-cover bg-center bg-no-repeat py-6 px-4"
        style={{ backgroundImage: "url(/bg-header.png)" }}
      >
        <div className="container max-w-4xl mx-auto flex justify-center">
          <Image
            src="/logo.png"
            alt="Avimor tecidos.com.br"
            width={280}
            height={80}
            priority
            className="object-contain"
          />
        </div>
      </header>

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-8">
          Acompanhe seus pedidos
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-slate-700 mb-1">
              CPF
            </label>
            <input
              id="cpf"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(formatarCpf(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition"
              maxLength={14}
              disabled={carregando}
            />
          </div>
          {erro && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}
          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-lg bg-pink-600 text-white font-medium py-3 px-4 hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {carregando ? "Consultando…" : "Consultar"}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-500 text-sm">
          Digite o CPF utilizado na compra para ver seus pedidos e o status da entrega.
        </p>
      </main>

      <footer className="py-4 text-center text-slate-400 text-sm border-t border-slate-200">
        Avimor tecidos.com.br — Rastreio de pedidos
      </footer>
    </div>
  );
}
