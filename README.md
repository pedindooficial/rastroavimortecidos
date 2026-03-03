# Rastreio de Pedidos — Avimor Tecidos

Site simples para o cliente consultar pedidos por CPF e área administrativa para cadastrar leads (pedidos). Deploy no Vercel com persistência em MongoDB Atlas.

## Funcionalidades

- **Tela pública:** "Acompanhe seus pedidos" — o usuário informa o CPF e visualiza todos os pedidos associados, com detalhes da transação, dados do cliente, itens do carrinho, status da entrega e histórico da compra.
- **Área admin:** proteção por senha; listagem de pedidos cadastrados e formulário para adicionar novo pedido (lead) com todos os campos.

## Pré-requisitos

- Node.js 18+
- Conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (tier gratuito)
- Conta no [Vercel](https://vercel.com)

## Configuração local

### 1. Dependências

```bash
npm install
```

### 2. Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
MONGODB_URI=mongodb+srv://<usuario>:<senha>@<cluster>.mongodb.net/?retryWrites=true&w=majority
ADMIN_SECRET=sua_senha_secreta_para_acesso_admin
```

- **MONGODB_URI:** string de conexão do MongoDB Atlas. No Atlas: Cluster → Connect → Connect your application → copie a URI e substitua `<password>` pela senha do usuário do banco.
- **ADMIN_SECRET:** senha que você escolher para acessar a área admin (`/admin`). Quem souber essa senha poderá cadastrar e listar pedidos.

### 3. MongoDB Atlas

1. Crie um cluster (tier gratuito).
2. Crie um usuário de banco (Database Access) e anote usuário e senha.
3. Em Network Access, adicione `0.0.0.0/0` para permitir conexão de qualquer IP (ou restrinja ao que for necessário).
4. Em Connect → Connect your application, copie a URI e use em `MONGODB_URI`.
5. O primeiro uso da aplicação criará o banco `avimor` e a coleção `pedidos` automaticamente.

### 4. Imagens (logo e fundo do header)

Coloque na pasta `public/`:

- **logo.png** — logotipo Avimor tecidos.com.br (usado no cabeçalho).
- **bg-header.png** — imagem de fundo do cabeçalho (`bg_head`).

Se esses arquivos não existirem, o cabeçalho pode aparecer sem imagem; o restante do site funciona normalmente.

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). A área admin fica em [http://localhost:3000/admin](http://localhost:3000/admin).

## Deploy no Vercel

1. Envie o projeto para um repositório Git (GitHub, GitLab ou Bitbucket).
2. No [Vercel](https://vercel.com), importe o repositório.
3. Configure as variáveis de ambiente no projeto Vercel:
   - `MONGODB_URI` — mesma URI do MongoDB Atlas.
   - `ADMIN_SECRET` — mesma senha usada localmente para o admin.
4. Faça o deploy. O Vercel usará o comando `next build` automaticamente.

Garanta que as imagens `public/logo.png` e `public/bg-header.png` estejam commitadas no repositório para aparecerem no site publicado.

## Estrutura resumida

- `app/page.tsx` — página inicial (consulta por CPF).
- `app/rastreio/page.tsx` — resultado da consulta (detalhes do(s) pedido(s)).
- `app/admin/` — área admin (login, listagem, novo pedido).
- `app/api/pedidos/route.ts` — GET por CPF (público).
- `app/api/admin/pedidos/route.ts` — GET (listar) e POST (criar), protegido por `ADMIN_SECRET`.
- `app/api/admin/login/route.ts` — POST para validar senha do admin.
- `lib/mongodb.ts` — conexão com MongoDB.
- `lib/models.ts` — tipos do pedido (transação, cliente, itens, histórico).

## Licença

Uso interno / Avimor tecidos.com.br.
