export interface ItemCarrinho {
  codigo: string;
  produto: string;
  quantidade: number;
  valor: number;
}

export interface HistoricoItem {
  data: string;
  status: string;
}

export interface Cliente {
  nome: string;
  email: string;
  telefone: string;
  cpfCnpj: string;
  endereco: string;
}

export interface Pedido {
  _id?: string;
  transacao: {
    status: string;
    dataCompra: string;
    dataSaldoDisponivel: string;
    codigoTransacao: string;
    numeroPedido: string;
    totalBruto: number;
    totalPago: number;
    taxas: number;
    totalLiquido: number;
    formaPagamento: string;
    modalidade: string;
    vencimento: string;
    pix: string;
    reenviarPix: string;
  };
  cliente: Cliente;
  itens: ItemCarrinho[];
  totalCarrinho: number;
  statusEntrega: string;
  historico: HistoricoItem[];
  createdAt?: string;
}

export type PedidoInput = Omit<Pedido, "_id" | "createdAt">;
