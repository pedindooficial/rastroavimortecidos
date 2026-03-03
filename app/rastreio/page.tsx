"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import type { Pedido } from "@/lib/models";

function formatarMoeda(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function DetalhesPedido({ pedido }: { pedido: Pedido }) {
  const t = pedido.transacao;
  const c = pedido.cliente;

  return (
    <article className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">
          Pedido #{t.numeroPedido}
        </h2>
        <p className="text-sm text-slate-500">
          Compra em {t.dataCompra} — Status: {t.status}
        </p>
      </div>

      <div className="p-6 space-y-6">
        <section>
          <h3 className="font-semibold text-slate-800 mb-3">
            Detalhes da Transação
          </h3>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd className="text-slate-800 font-medium">{t.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Data da compra</dt>
              <dd>{t.dataCompra}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Data do Saldo disponível</dt>
              <dd>{t.dataSaldoDisponivel}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Código da Transação</dt>
              <dd className="font-mono text-xs">{t.codigoTransacao}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Número do Pedido</dt>
              <dd>{t.numeroPedido}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Total Bruto</dt>
              <dd>{formatarMoeda(t.totalBruto)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Total Pago</dt>
              <dd>{formatarMoeda(t.totalPago)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Taxas</dt>
              <dd>{formatarMoeda(t.taxas)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Total Líquido</dt>
              <dd>{formatarMoeda(t.totalLiquido)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Forma de Pagamento</dt>
              <dd>{t.formaPagamento}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Modalidade</dt>
              <dd>{t.modalidade}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Vencimento</dt>
              <dd>{t.vencimento}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h3 className="font-semibold text-slate-800 mb-3">
            Informações do Cliente
          </h3>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Nome</dt>
              <dd>{c.nome}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">E-mail</dt>
              <dd>{c.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Telefone</dt>
              <dd>{c.telefone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">CPF/CNPJ</dt>
              <dd>{c.cpfCnpj}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Endereço</dt>
              <dd>{c.endereco || "—"}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h3 className="font-semibold text-slate-800 mb-3">
            Itens do Carrinho
          </h3>
          <p className="text-sm text-slate-500 mb-3">
            Abaixo você visualiza todos os itens que o cliente adquiriu em sua loja.
          </p>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-2 font-medium text-slate-600">Cod.</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Produto</th>
                  <th className="px-4 py-2 font-medium text-slate-600 text-right">Qtd</th>
                  <th className="px-4 py-2 font-medium text-slate-600 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {pedido.itens.map((item, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-mono text-xs">{item.codigo}</td>
                    <td className="px-4 py-2">{item.produto}</td>
                    <td className="px-4 py-2 text-right">{item.quantidade}</td>
                    <td className="px-4 py-2 text-right">{formatarMoeda(item.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-700">
            Total do Carrinho: {formatarMoeda(pedido.totalCarrinho)}
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-slate-800 mb-2">Entregue?</h3>
          <p className="text-sm text-slate-500 mb-2">
            Status da entrega (somente visualização).
          </p>
          <p className="text-slate-800 font-medium">{pedido.statusEntrega || "—"}</p>
        </section>

        <section>
          <h3 className="font-semibold text-slate-800 mb-3">Histórico da Compra</h3>
          <p className="text-sm text-slate-500 mb-3">
            Todos os status até a compra ser aprovada.
          </p>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-2 font-medium text-slate-600">Data</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {pedido.historico.map((h, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2">{h.data}</td>
                    <td className="px-4 py-2 font-medium">{h.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </article>
  );
}

function RastreioContent() {
  const searchParams = useSearchParams();
  const cpf = searchParams.get("cpf");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!cpf) {
      setErro("CPF não informado.");
      setCarregando(false);
      return;
    }
    fetch(`/api/pedidos?cpf=${encodeURIComponent(cpf)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setErro(data.error || "Erro ao carregar pedidos.");
          return;
        }
        setPedidos(data);
      })
      .catch(() => setErro("Erro ao carregar pedidos."))
      .finally(() => setCarregando(false));
  }, [cpf]);

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Carregando pedidos…</p>
      </div>
    );
  }

  if (erro || pedidos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <header
          className="w-full bg-cover bg-center bg-no-repeat py-6 px-4"
          style={{ backgroundImage: "url(/bg-header.png)" }}
        >
          <div className="container max-w-4xl mx-auto flex justify-center">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Avimor tecidos.com.br"
                width={280}
                height={80}
                className="object-contain"
              />
            </Link>
          </div>
        </header>
        <main className="flex-1 container max-w-2xl mx-auto px-4 py-10 text-center">
          <p className="text-red-600 bg-red-50 rounded-lg px-4 py-3 inline-block">
            {erro || "Nenhum pedido encontrado para este CPF."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-pink-600 font-medium hover:underline"
          >
            Voltar e consultar outro CPF
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="w-full bg-cover bg-center bg-no-repeat py-6 px-4"
        style={{ backgroundImage: "url(/bg-header.png)" }}
      >
        <div className="container max-w-4xl mx-auto flex justify-center">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Avimor tecidos.com.br"
              width={280}
              height={80}
              className="object-contain"
            />
          </Link>
        </div>
      </header>

      <main className="flex-1 container max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-slate-600 hover:text-pink-600 mb-6"
        >
          ← Voltar e consultar outro CPF
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          Seus pedidos
        </h1>
        <div className="space-y-8">
          {pedidos.map((p) => (
            <DetalhesPedido key={p._id || p.transacao.numeroPedido} pedido={p} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function RastreioPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Carregando…</p>
      </div>
    }>
      <RastreioContent />
    </Suspense>
  );
}
