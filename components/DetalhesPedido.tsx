"use client";

import type { Pedido } from "@/lib/models";

export function formatarMoeda(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Valores de itens podem ter sido salvos como 6885 (centavos) no passado; exibe em reais. */
function valorItemParaExibicao(valor: number): number {
  if (Number.isInteger(valor) && valor >= 100) return valor / 100;
  return valor;
}

export function DetalhesPedido({
  pedido,
  mostrarStatusEntrega = true,
}: {
  pedido: Pedido;
  mostrarStatusEntrega?: boolean;
}) {
  const t = pedido.transacao;
  const c = pedido.cliente;

  return (
    <article className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-slate-50 border-b border-slate-200">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800">
          Pedido #{t.numeroPedido}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Compra em {t.dataCompra} — Status: {t.status}
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        <section>
          <h3 className="font-semibold text-slate-800 mb-2 sm:mb-3 text-sm sm:text-base">
            Detalhes da Transação
          </h3>
          <dl className="grid gap-2 text-xs sm:text-sm">
            <div className="flex justify-between gap-2 py-1 border-b border-slate-100">
              <dt className="text-slate-500 shrink-0">Status</dt>
              <dd className="font-medium text-slate-800">{t.status}</dd>
            </div>
            <div className="flex justify-between gap-2 py-1 border-b border-slate-100">
              <dt className="text-slate-500 shrink-0">Data da compra</dt>
              <dd className="text-slate-800 text-right">{t.dataCompra}</dd>
            </div>
            <div className="flex justify-between gap-2 py-1 border-b border-slate-100">
              <dt className="text-slate-500 shrink-0">Data do Saldo disponível</dt>
              <dd className="text-slate-800 text-right">{t.dataSaldoDisponivel}</dd>
            </div>
            <div className="flex justify-between gap-2 py-1 border-b border-slate-100">
              <dt className="text-slate-500 shrink-0">Código da Transação</dt>
              <dd className="font-mono text-xs text-slate-800 break-all">{t.codigoTransacao}</dd>
            </div>
            <div className="flex justify-between gap-2 py-1 border-b border-slate-100">
              <dt className="text-slate-500 shrink-0">Número do Pedido</dt>
              <dd className="text-slate-800 text-right">{t.numeroPedido}</dd>
            </div>
            <div className="flex justify-between gap-2 py-1 border-b border-slate-100">
              <dt className="text-slate-500 shrink-0">Total Bruto</dt>
              <dd className="text-slate-800 text-right">{formatarMoeda(t.totalBruto)}</dd>
            </div>
            <div className="flex justify-between gap-2 py-1 border-b border-slate-100">
              <dt className="text-slate-500 shrink-0">Total Pago</dt>
              <dd className="text-slate-800 text-right">{formatarMoeda(t.totalPago)}</dd>
            </div>
            <div className="flex justify-between gap-2 py-1 border-b border-slate-100">
              <dt className="text-slate-500 shrink-0">Taxas</dt>
              <dd className="text-slate-800 text-right">{formatarMoeda(t.taxas)}</dd>
            </div>
            <div className="flex justify-between gap-2 py-1 border-b border-slate-100">
              <dt className="text-slate-500 shrink-0">Total Líquido</dt>
              <dd className="text-slate-800 text-right">{formatarMoeda(t.totalLiquido)}</dd>
            </div>
            <div className="flex justify-between gap-2 py-1 border-b border-slate-100">
              <dt className="text-slate-500 shrink-0">Forma de Pagamento</dt>
              <dd className="text-slate-800 text-right">{t.formaPagamento}</dd>
            </div>
            <div className="flex justify-between gap-2 py-1 border-b border-slate-100">
              <dt className="text-slate-500 shrink-0">Modalidade</dt>
              <dd className="text-slate-800 text-right">{t.modalidade}</dd>
            </div>
            <div className="flex justify-between gap-2 py-1">
              <dt className="text-slate-500 shrink-0">Vencimento</dt>
              <dd className="text-slate-800 text-right">{t.vencimento}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h3 className="font-semibold text-slate-800 mb-2 sm:mb-3 text-sm sm:text-base">
            Informações do Cliente
          </h3>
          <dl className="grid gap-2 text-xs sm:text-sm">
            {[
              ["Nome", c.nome],
              ["E-mail", c.email],
              ["Telefone", c.telefone],
              ["CPF/CNPJ", c.cpfCnpj],
              ["Endereço", c.endereco || "—"],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between gap-2 py-1 border-b border-slate-100 last:border-0">
                <dt className="text-slate-500 shrink-0">{label}</dt>
                <dd className="text-slate-800 text-right break-all">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="overflow-x-auto -mx-4 sm:mx-0">
          <h3 className="font-semibold text-slate-800 mb-2 sm:mb-3 text-sm sm:text-base px-4 sm:px-0">
            Itens do Carrinho
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-2 px-4 sm:px-0">
            Abaixo você visualiza todos os itens que o cliente adquiriu em sua loja.
          </p>
          <div className="border border-slate-200 rounded-lg overflow-hidden min-w-[320px]">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-2 sm:px-4 py-2 font-medium text-slate-600">Cod.</th>
                  <th className="px-2 sm:px-4 py-2 font-medium text-slate-600">Produto</th>
                  <th className="px-2 sm:px-4 py-2 font-medium text-slate-600 text-right">Qtd</th>
                  <th className="px-2 sm:px-4 py-2 font-medium text-slate-600 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {pedido.itens.map((item, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-2 sm:px-4 py-2 font-mono text-xs">{item.codigo}</td>
                    <td className="px-2 sm:px-4 py-2">{item.produto}</td>
                    <td className="px-2 sm:px-4 py-2 text-right">{item.quantidade}</td>
                    <td className="px-2 sm:px-4 py-2 text-right">{formatarMoeda(valorItemParaExibicao(item.valor))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs sm:text-sm font-medium text-slate-700 px-4 sm:px-0">
            Total do Carrinho: {formatarMoeda(pedido.totalCarrinho)}
          </p>
        </section>

        {mostrarStatusEntrega && (
          <section>
            <h3 className="font-semibold text-slate-800 mb-1 sm:mb-2 text-sm sm:text-base">Entregue?</h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-1">Status da entrega (somente visualização).</p>
            <p className="text-slate-800 font-medium">{pedido.statusEntrega || "—"}</p>
          </section>
        )}

        <section className="overflow-x-auto -mx-4 sm:mx-0">
          <h3 className="font-semibold text-slate-800 mb-2 sm:mb-3 text-sm sm:text-base px-4 sm:px-0">
            Histórico da Compra
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-2 px-4 sm:px-0">
            Todos os status até a compra ser aprovada.
          </p>
          <div className="border border-slate-200 rounded-lg overflow-hidden min-w-[240px]">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-2 sm:px-4 py-2 font-medium text-slate-600">Data</th>
                  <th className="px-2 sm:px-4 py-2 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {pedido.historico.map((h, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-2 sm:px-4 py-2">{h.data}</td>
                    <td className="px-2 sm:px-4 py-2 font-medium">{h.status}</td>
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
