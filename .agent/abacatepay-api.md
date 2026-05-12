# AbacatePay - Documentação da API

> AbacatePay é uma plataforma brasileira de pagamentos via API. Permite cobrar clientes via Checkout hospedado, Checkout Transparente (PIX QR Code embutido no seu site), Links de Pagamento reutilizáveis e Assinaturas recorrentes. Também oferece transferências PIX, saques (payouts), gestão de produtos, cupons, clientes e webhooks. Toda a API usa REST + JSON, autenticação Bearer Token e opera em BRL. Base URL: `https://api.abacatepay.com/v2`.

## Notas Importantes

- **Autenticação**: todas as requisições precisam do header `Authorization: Bearer <sua-api-key>`.
- **Valores monetários** são sempre em **centavos** (ex.: `10000` = R$ 100,00).
- **Respostas** seguem o envelope `{ "data": {...}, "success": true, "error": null }`.
- **Produtos** precisam existir antes de criar Checkouts; use `externalId` como referência ao seu catálogo.
- **Clientes** são únicos por CPF/CNPJ — criar um cliente com taxId já existente retorna o existente.
- **Assinaturas** exigem produto com `cycle` definido (`WEEKLY`, `MONTHLY`, `SEMIANNUALLY`, `ANNUALLY`).
- **Checkout Transparente** gera PIX imediatamente sem redirecionar o usuário; retorna `brCode` (copia-e-cola) e `brCodeBase64` (imagem PNG).
- **Webhooks** precisam de URL HTTPS pública; payloads são assinados via HMAC com o `secret` informado.

---

## Checkout (cobrar com página hospedada)

- **Referência**: Visão geral do fluxo, campos obrigatórios, frequências (`ONE_TIME`, `MULTIPLE_PAYMENTS`, `SUBSCRIPTION`) e exemplo de request/response completo.
- `POST /checkouts/create` — Cria um Checkout e retorna a `url` para redirecionar o cliente. Campo obrigatório: `items` (array com `id` do produto e `quantity`). Opcionais: `methods` (PIX/CARD), `customerId`, `returnUrl`, `completionUrl`, `coupons`, `externalId`, `metadata`.
- `GET /checkouts/list` — Lista todos os Checkouts da loja.
- `GET /checkouts/one` — Busca um Checkout pelo ID.

## Links de Pagamento

- **Referência**: Links reutilizáveis (`frequency=MULTIPLE_PAYMENTS`); o cliente pode pagar várias vezes pelo mesmo link.
- `POST /payment-links/create` — Cria um link de pagamento reutilizável.
- `GET /payment-links/list` — Lista os links de pagamento.
- `GET /payment-links/one` — Busca um link de pagamento pelo ID.

## Clientes

- **Referência**: Clientes pré-cadastrados para pré-preencher o checkout e reutilizar em várias cobranças. Único por CPF/CNPJ; campo obrigatório: `email`.
- `POST /customers/create` — Cria (ou retorna existente) um cliente. Campos: `email` (obrigatório), `taxId`, `name`, `cellphone`, `zipCode`, `metadata`.
- `GET /customers/list` — Lista os clientes cadastrados.
- `GET /customers/get` — Busca um cliente pelo ID.
- `POST /customers/delete` — Remove um cliente pelo ID.

## Checkout Transparente (PIX embutido)

- **Referência**: Gera PIX QR Code diretamente no seu site/app sem redirecionar o usuário. Retorna `brCode` (copia-e-cola) e `brCodeBase64` (imagem PNG base64). Apenas PIX suportado atualmente.
- `POST /transparents/create` — Cria um PIX. Campo obrigatório: `data.amount` (em centavos). Opcionais: `data.description`, `data.expiresIn` (segundos), `data.customer` (name, email, taxId, cellphone), `data.metadata`.
- `GET /transparents/list` — Lista os Checkouts Transparentes.
- `POST /transparents/simulate-payment` — Simula um pagamento (ambiente sandbox/devMode).
- `GET /transparents/check` — Verifica o status de pagamento de um QR Code PIX pelo ID.

## Produtos

- **Referência**: Produtos do catálogo usados nos Checkouts. Avulso (`cycle` omitido) ou assinatura (`cycle`: WEEKLY, MONTHLY, SEMIANNUALLY, ANNUALLY). Moeda sempre BRL.
- `POST /products/create` — Cria um produto. Obrigatórios: `externalId`, `name`, `price` (centavos), `currency` ("BRL"). Opcionais: `description`, `imageUrl`, `cycle`.
- `GET /products/list` — Lista os produtos.
- `GET /products/get` — Busca um produto pelo ID.
- `POST /products/delete` — Remove um produto pelo ID.

## Cupons

- `POST /coupons/create` — Cria um cupom de desconto.
- `GET /coupons/list` — Lista os cupons.
- `GET /coupons/get` — Busca um cupom pelo ID.
- `POST /coupons/delete` — Remove um cupom.
- `POST /coupons/toggle` — Ativa ou desativa um cupom.

## Webhooks

- **Referência**: Notificações automáticas de eventos. Endpoint deve ser HTTPS público. Payloads assinados com HMAC usando o `secret` informado.
- **Eventos disponíveis**:
  - `checkout.completed`, `checkout.refunded`, `checkout.disputed`, `checkout.lost`
  - `transparent.completed`, `transparent.refunded`, `transparent.disputed`, `transparent.lost`
  - `subscription.completed`, `subscription.cancelled`, `subscription.renewed`, `subscription.trial_started`
  - `payout.completed`, `payout.failed`
  - `transfer.completed`, `transfer.failed`
- `POST /webhooks/create` — Cria um webhook. Obrigatórios: `name`, `endpoint` (HTTPS), `secret`, `events`.
- `GET /webhooks/list` — Lista os webhooks.
- `GET /webhooks/get` — Busca um webhook pelo ID.
- `POST /webhooks/delete` — Remove um webhook.

## Assinaturas (Recorrência)

- **Referência**: Cobranças recorrentes. Exige produto com `cycle` definido. Checkout aceita apenas 1 item. Métodos padrão: `["CARD"]`. Ciclos: `WEEKLY`, `MONTHLY`, `SEMIANNUALLY`, `ANNUALLY`. Status: `PENDING`, `EXPIRED`, `CANCELLED`, `PAID`, `REFUNDED`.
- `POST /subscriptions/create` — Cria um Checkout de assinatura. Mesmos parâmetros do Checkout; `items` com exatamente 1 produto com cycle definido.
- `GET /subscriptions/list` — Lista os Checkouts de assinatura.
- `POST /subscriptions/cancel` — Cancela uma assinatura ativa.

## Saques (Payouts)

- **Referência**: Saque do saldo da conta para chave PIX de sua titularidade. Mínimo: R$ 3,50. Taxa: R$ 0,80 por saque. Limite: 1 saque/minuto. Processamento instantâneo 24/7.
- `POST /payouts/create` — Inicia um saque (status inicial: PENDING).
- `GET /payouts/get` — Busca um saque pelo ID (`receiptUrl` disponível quando status é COMPLETE).
- `GET /payouts/list` — Lista os saques.

## Transferências PIX (enviar para terceiros)

- **Referência**: Envio de transferências PIX para terceiros (diferente de Payouts, que são para sua própria chave).
- `POST /pix/create` — Envia um PIX para uma chave de destino.
- `GET /pix/get` — Busca uma transferência PIX pelo ID.
- `GET /pix/list` — Lista as transferências PIX.

## Loja

- `GET /store/get` — Retorna nome, configurações e informações gerais da loja autenticada.

## TrustMRR (público, sem autenticação)

- `GET /trustMRR/mrr` — Retorna o MRR público de um merchant pelo slug.
- `GET /trustMRR/get` — Retorna informações públicas do merchant.
- `GET /trustMRR/list` — Retorna a receita por período de um merchant.
