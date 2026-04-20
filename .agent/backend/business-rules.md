[🏠 Voltar ao Contexto](../CONTEXT.md)

# Business Rules - ConfirmaZap (Multi-Tenant SaaS)

## 1. Arquitetura Multi-Tenant
A ConfirmaZap é uma plataforma **SaaS Multi-Tenant** com dois níveis de entidade:

### Nível Usuário (User)
- Cada Profissional possui uma conta (`User`) com email, senha e/ou login via Google.
- A **assinatura** (`Subscription`) pertence ao **User**, não à Company.
- O plano PRO dá direito a até **3 empresas** (Companies).

### Nível Empresa (Company)
- Cada User pode criar uma ou mais **Companies** (empresas/negócios).
- **Isolamento de Dados:** Todas as entidades operacionais (`clients`, `schedules`, `company_configs`, `integrations`) são vinculadas obrigatoriamente a um `companyId`.
- **Isolamento de Recursos:** Cada empresa possui sua própria instância no WhatsApp Evolution API e seus próprios tokens de acesso ao Google Calendar (via `Integration`).
- **Segurança:** Use Cases que operam dados de negócio devem sempre receber o `companyId` autenticado e garantir que as operações de leitura/escrita sejam filtradas por esse ID.

### Gestão de Integrações
- **Tokens OAuth do Google** são armazenados na tabela `integrations` (por `companyId` + `provider`), e **não mais** no `CompanyConfig`.
- O `IntegrationRepository` gerencia `accessToken`, `refreshToken` e `expiresAt` para cada integração.
- O `CompanyConfig` mantém apenas configurações operacionais: WhatsApp number, sync enabled, horários de silêncio, taxId, etc.

## 2. Identificação de Clientes e Telefones (Client Matching)
O sistema deve tentar encontrar o telefone do cliente final nas seguintes tentativas (Fallback Strategy):
- **Estratégia A (Regex no Título/Descrição):** O sistema varre o título e descrição do evento buscando um número de telefone com ou sem DDD. Quando um agendamento é criado pelo próprio frontend do ConfirmaZap, ele é sincronizado **instantaneamente (síncrono)** com a API do Google Calendar e o telefone do cliente é embutido diretamente na descrição do evento (`Telefone: XXXXX`).
- **Estratégia B (Base de Dados):** O sistema busca na tabela `clients` se existe um cliente cadastrado pela empresa (`companyId`) cujo `name` ou `email` bata com o título/convidado do evento no Google Calendar.

## 3. Janela de Notificação (Cron Jobs)
- O sistema varre os eventos futuros a cada 15 minutos.
- **Regra de Disparo:** Enviar mensagem de confirmação apenas para eventos que ocorrerão entre as próximas 24 horas e 2 horas.
- **Horário de Silêncio (Anti-Spam):** Nunca enviar mensagens automáticas para os clientes finais durante a janela de silêncio configurada no `CompanyConfig` (Padrão: 21:00 às 08:00 - Fuso GMT-4).
- **Agendamento BullMQ:** Mensagens geradas durante o horário de silêncio devem ser enfileiradas para serem disparadas no primeiro minuto útil (ex: 08:01).

## 4. Cobrança e Monetização (Abacate Pay)

### Modelo de Assinatura
- A **Subscription pertence ao User**, não à Company.
- O metadata enviado ao Abacate Pay contém `{ userId }` para identificação nas cobranças recorrentes.
- O plano PRO dá direito ao User criar até **3 Companies**.

### Regras de Checkout
- **Checkout Lock:** Um usuário com assinatura ativa (`status = ACTIVE`) não pode gerar novos checkouts. Ele deve ser redirecionado para o dashboard.
- **Requisitos de Cadastro:** Para iniciar o checkout, o Profissional DEVE preencher obrigatoriamente seu `taxId` (CPF/CNPJ) e `whatsappNumber` nas configurações (`CompanyConfig`). O Use Case deve bloquear a criação de checkout se estes dados forem nulos.
- **Status da Assinatura:** O sistema gerencia através de Webhooks o status `ACTIVE` e `INACTIVE`. Assinaturas `INACTIVE` bloqueiam recursos premium.

### Rastreamento de Histórico (SubscriptionPayment)
- Toda tentativa de checkout (`create-checkout`) deve gerar um registro `PENDING` no histórico.
- O Registro de histórico deve armazenar o valor exato no momento da cobrança (`amount`) proveniente das configurações de sistema (`.env`).
- O Webhook de `billing.paid` deve conciliar o ID da cobrança (`billingId`) para marcar o registro histórico como `PAID` e registrar a data exata do pagamento (`paidAt`).

### Faturas em PDF
- O sistema permite o download de comprovantes de pagamento em formato PDF apenas para transações com status `PAID`. As faturas são geradas dinamicamente com os dados do usuário e da cobrança.

## 5. Limites de Uso e Planos

O sistema aplica restrições de uso com base no plano do **owner** da Company:

- **Plano FREE:**
    - Limite de **1 empresa** por usuário.
    - Limite de **50 notificações mensais** via WhatsApp **por empresa**.
    - O sistema rastreia o envio através do campo `notified_at` nos agendamentos.
    - Ao atingir o limite, os disparos automáticos são suspensos até o início do próximo mês.
- **Plano PRO:**
    - Até **3 empresas** por usuário.
    - **Notificações ilimitadas** via WhatsApp enquanto a assinatura estiver com status `ACTIVE`.

### Resolução de Plano (CheckUsageLimitUseCase)
O `CheckUsageLimitUseCase` recebe um `companyId`, resolve o `ownerId` da company, e então busca a `Subscription` pelo `userId` (owner). A contagem de mensagens é feita **por company**, mas a verificação do plano é **por user**.

## 6. Status e Conciliação (Google Calendar Sync)
Quando o cliente responde no WhatsApp:
- Se resposta = SIM -> Mudar cor do evento na API do Google para 'Verde' (ID 10) e adicionar o prefixo `[CONFIRMADO]`.
- Se resposta = NÃO -> Mudar cor para 'Vermelho' (ID 11), adicionar prefixo `[CANCELADO]` e disparar o alerta para o profissional.
- O sistema nunca deve deletar o evento do calendário, apenas atualizar seu status para manter o histórico.

## 7. Integração WhatsApp (Evolution API)
- **Nomenclatura de Instâncias:** As instâncias no WhatsApp seguem o padrão `agent_<companyId (clean)>`.
- **Auto-Configuração:** No momento da conexão, o sistema configura automaticamente o Webhook da Evolution API para apontar para a URL do sistema, garantindo o recebimento de mensagens e status de sessão em tempo real.

## 8. Comunicação e Notificações (E-mail)
O sistema deve manter o Profissional informado sobre o status de sua conta através de notificações automáticas por e-mail nos seguintes cenários:
- **Confirmação de Pagamento:** Notificar o usuário imediatamente após a ativação bem-sucedida do plano PRO.
- **Expiração/Cancelamento:** Notificar quando uma cobrança expira ou um checkout é abandonado, resultando na perda ou não ativação do status PRO.
- **Reembolso:** Confirmar o processamento de reembolsos e a consequente revogação do acesso premium.
*Nota: Todos os e-mails de cobrança devem conter informações de suporte e links para contato via WhatsApp oficial do sistema.*

## 9. Gestão de Profissionais (Professional)
- Cada empresa pode cadastrar múltiplos **profissionais** (médicos, esteticistas, etc.).
- Cada profissional possui: `name`, `specialty`, `workingHours` (horários de trabalho semanais), `appointmentDuration` (duração padrão da consulta em minutos) e `active`.
- Os horários de trabalho são armazenados como JSON: `Record<'mon'|'tue'|...|'sun', Array<{start: string, end: string}>>`.
- Profissionais são isolados por `companyId`.

## 10. Bot de Autoatendimento com IA (PRO)

### Visão Geral
- Recurso exclusivo do **plano PRO**. Cada empresa pode habilitar um bot inteligente via WhatsApp.
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

---

## Documentos Relacionados
- [Arquitetura](./architecture.md)
- [Fluxo de Autenticação](./auth-flow.md)
- [Contexto Geral](../CONTEXT.md)