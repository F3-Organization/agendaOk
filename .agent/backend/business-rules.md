[🏠 Voltar ao Contexto](../CONTEXT.md)

# Business Rules - ConfirmaZap (Multi-Tenant SaaS)

## 1. Arquitetura Multi-Tenant
A ConfirmaZap é uma plataforma **SaaS Multi-Tenant** com dois níveis de entidade:

### Nível Usuário (User)
- Cada Profissional possui uma conta (`User`) com email, senha e/ou login via Google.
- A **assinatura** (`Subscription`) pertence ao **User**, não à Company.
- O plano PRO dá direito a até **3 empresas** (Companies) = até **3 atendentes WhatsApp** distintos.

### Nível Empresa (Company)
- Cada User pode criar uma ou mais **Companies** (empresas/negócios).
- **Isolamento de Dados:** Todas as entidades operacionais (`clients`, `schedules`, `company_configs`, `integrations`) são vinculadas obrigatoriamente a um `companyId`.
- **Isolamento de Recursos:** Cada empresa possui sua própria instância no WhatsApp Evolution API e seus próprios tokens de acesso ao Google Calendar (via `Integration`).
- **Segurança:** Use Cases que operam dados de negócio devem sempre receber o `companyId` autenticado e garantir que as operações de leitura/escrita sejam filtradas por esse ID.

### Gestão de Integrações
- **Tokens OAuth do Google** são armazenados na tabela `integrations` (por `companyId` + `provider`), criptografados com AES-256-CBC via `cryptography.ts`.
- O `IntegrationRepository` gerencia `accessToken`, `refreshToken` e `expiresAt`, criptografando ao salvar e descriptografando ao ler.
- O `CompanyConfig` mantém apenas configurações operacionais: WhatsApp number, sync enabled, horários de silêncio, taxId, etc.

## 2. Bot de Autoatendimento com IA (Feature Principal)

### Visão Geral
- O bot WhatsApp com IA é o **produto central** da plataforma — disponível no plano PRO.
- Cada empresa pode habilitar um atendente inteligente via WhatsApp que age de forma autônoma.
- O bot utiliza a **Gemini API (gemini-2.0-flash)** para processar linguagem natural.
- O contexto do bot é dinâmico: inclui descrição da empresa, serviços oferecidos, profissionais, horários de trabalho e instruções personalizadas.

### Fluxo de Mensagens (Webhook)
1. O webhook da Evolution API recebe a mensagem do cliente.
2. O sistema verifica **palavras-chave de confirmação/cancelamento** primeiro (fallback rápido).
3. Se não for uma palavra-chave, e o bot estiver habilitado + plano PRO → encaminha para a IA.
4. O `ConversationService` (Redis) mantém o histórico da conversa (TTL 30min, max 20 mensagens).
5. O `GeminiAdapter` monta um prompt dinâmico com o contexto da empresa e envia para a API.

### Configuração do Bot
- Via `CompanyConfig`: `botEnabled`, `botGreeting`, `botInstructions`, `businessType`, `businessDescription`, `address`, `servicesOffered`.
- Via `Professional`: lista de profissionais com especialidades e horários.

### Variáveis de Ambiente
- `GEMINI_API_KEY`: Chave de acesso à API do Google Gemini.
- `GEMINI_MODEL`: Modelo a ser utilizado (padrão: `gemini-2.0-flash`).

## 3. Identificação de Clientes e Telefones (Client Matching)
O sistema deve tentar encontrar o telefone do cliente final nas seguintes tentativas (Fallback Strategy):
- **Estratégia A (Regex no Título/Descrição):** O sistema varre o título e descrição do evento buscando um número de telefone com ou sem DDD. Quando um agendamento é criado pelo próprio frontend do ConfirmaZap, ele é sincronizado **instantaneamente (síncrono)** com a API do Google Calendar e o telefone do cliente é embutido diretamente na descrição do evento (`Telefone: XXXXX`).
- **Estratégia B (Base de Dados):** O sistema busca na tabela `clients` se existe um cliente cadastrado pela empresa (`companyId`) cujo `name` ou `email` bata com o título/convidado do evento no Google Calendar.

## 4. Janela de Notificação (Cron Jobs)
- O sistema varre os eventos futuros a cada 15 minutos.
- **Regra de Disparo:** Enviar mensagem de confirmação apenas para eventos que ocorrerão entre as próximas 24 horas e 2 horas.
- **Horário de Silêncio (Anti-Spam):** Nunca enviar mensagens automáticas para os clientes finais durante a janela de silêncio configurada no `CompanyConfig` (Padrão: 21:00 às 08:00 - Fuso GMT-4).
- **Agendamento BullMQ:** Mensagens geradas durante o horário de silêncio devem ser enfileiradas para serem disparadas no primeiro minuto útil (ex: 08:01).
- **DLQ (Dead Letter Queue):** Jobs com falha são retidos (últimos 100 por fila) para diagnóstico — `removeOnFail: { count: 100 }`. O `stalled` event também é monitorado.

## 5. Integração Google Calendar (Opcional)
A integração com Google Calendar é uma **feature complementar**, não obrigatória para o funcionamento do bot.

### Quando é útil
- Profissionais que já usam Google Calendar e querem sincronizar eventos existentes.
- Disparar lembretes automáticos para agendamentos criados fora do ConfirmaZap.

### Limitações conhecidas
- Somente o **calendário primário** é sincronizado (sem seleção de calendário na UI).
- Extração de telefone do evento depende de regex no título/descrição (ver seção 3).

### Fluxo de Sincronização
1. User inicia Google OAuth → tokens armazenados criptografados em `integrations`.
2. `SyncCalendarUseCase` roda via BullMQ a cada 15 minutos por empresa.
3. Eventos com telefone identificado geram jobs de notificação.
4. Resposta do cliente via WhatsApp atualiza cor do evento (verde/vermelho) no Google Calendar.

### Conciliação de Status
Quando o cliente responde no WhatsApp:
- Se resposta = SIM → Mudar cor do evento no Google para 'Verde' (ID 10) e adicionar prefixo `[CONFIRMADO]`.
- Se resposta = NÃO → Mudar cor para 'Vermelho' (ID 11), adicionar prefixo `[CANCELADO]` e alertar o profissional.
- O sistema nunca deleta o evento, apenas atualiza o status.

## 6. Cobrança e Monetização (Abacate Pay)

### Modelo de Assinatura
- A **Subscription pertence ao User**, não à Company.
- O metadata enviado ao Abacate Pay contém `{ userId }` para identificação nas cobranças recorrentes.
- O plano PRO dá direito ao User criar até **3 Companies** (= 3 instâncias WhatsApp/bot).

### Regras de Checkout
- **Checkout Lock:** Um usuário com assinatura ativa (`status = ACTIVE`) não pode gerar novos checkouts.
- **Requisitos de Cadastro:** Para iniciar o checkout, o Profissional DEVE preencher `taxId` (CPF/CNPJ) e `whatsappNumber`.
- **Status da Assinatura:** Webhooks gerenciam `ACTIVE` e `INACTIVE`. Assinaturas `INACTIVE` bloqueiam recursos premium.

### Rastreamento de Histórico (SubscriptionPayment)
- Toda tentativa de checkout gera um registro `PENDING`.
- O Webhook de `billing.paid` concilia o `billingId` para marcar como `PAID` com data exata.

### Faturas em PDF
- Download de comprovantes disponível apenas para transações com status `PAID`.

## 7. Limites de Uso e Planos

- **Plano FREE:**
  - Limite de **1 empresa** por usuário.
  - Limite de **50 notificações mensais** via WhatsApp **por empresa**.
  - Sem acesso ao bot IA.
- **Plano PRO:**
  - Até **3 empresas** por usuário (= até 3 atendentes WhatsApp).
  - **Notificações ilimitadas** via WhatsApp.
  - Bot IA habilitável por empresa.

### Resolução de Plano (CheckUsageLimitUseCase)
O `CheckUsageLimitUseCase` recebe um `companyId`, resolve o `ownerId` da company, e então busca a `Subscription` pelo `userId` (owner). A contagem de mensagens é feita **por company**, mas a verificação do plano é **por user**.

## 8. Integração WhatsApp (Evolution API)
- **Nomenclatura de Instâncias:** As instâncias no WhatsApp seguem o padrão `agent_<companyId (clean)>`.
- **Auto-Configuração:** No momento da conexão, o sistema configura automaticamente o Webhook da Evolution API para apontar para a URL do sistema.
- **Rate Limiting:** O servidor aplica rate limit por usuário (120 req/min por `userId` via JWT, ou por IP para requisições não autenticadas).

## 9. Comunicação e Notificações (E-mail)
O sistema mantém o Profissional informado através de e-mails automáticos:
- **Confirmação de Pagamento:** Após ativação bem-sucedida do plano PRO.
- **Expiração/Cancelamento:** Quando cobrança expira ou checkout é abandonado.
- **Reembolso:** Após processamento de reembolso e revogação do acesso premium.

## 10. Gestão de Profissionais (Professional)
- Cada empresa pode cadastrar múltiplos **profissionais**.
- Cada profissional possui: `name`, `specialty`, `workingHours`, `appointmentDuration` e `active`.
- Os horários de trabalho são armazenados como JSON: `Record<'mon'|'tue'|...|'sun', Array<{start: string, end: string}>>`.
- Profissionais são isolados por `companyId`.

---

## Documentos Relacionados
- [Arquitetura](./architecture.md)
- [Fluxo de Autenticação](./auth-flow.md)
- [Contexto Geral](../CONTEXT.md)
