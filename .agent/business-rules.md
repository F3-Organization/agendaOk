# Business Rules - AgendaOk (Multi-Tenant SaaS)

## 1. Arquitetura Multi-Tenant
A AgendaOk é uma plataforma **SaaS Multi-Tenant**. Cada Profissional (Usuário) opera em um ambiente isolado dentro do mesmo sistema:
- **Isolamento de Dados:** Todas as entidades (`clients`, `schedules`, `user_configs`, `subscriptions`) são vinculadas obrigatoriamente a um `userId`.
- **Isolamento de Recursos:** Cada locatário (tenant) possui sua própria instância no WhatsApp Evolution API e seus próprios tokens de acesso ao Google Calendar.
- **Segurança:** Use Cases devem sempre receber o `userId` autenticado e garantir que as operações de leitura/escrita sejam filtradas por esse ID para evitar vazamento de dados entre profissionais.

## 2. Identificação de Clientes e Telefones (Client Matching)
O sistema deve tentar encontrar o telefone do cliente final em duas etapas (Fallback Strategy):
- **Estratégia A (Base de Dados):** O sistema busca na tabela `clients` se existe um cliente cadastrado pelo usuário (`userId`) cujo `name` ou `email` bata com o título/convidado do evento no Google Calendar.

## 3. Janela de Notificação (Cron Jobs)
- O sistema varre os eventos futuros a cada 15 minutos.
- **Regra de Disparo:** Enviar mensagem de confirmação apenas para eventos que ocorrerão entre as próximas 24 horas e 2 horas.
- **Horário de Silêncio (Anti-Spam):** Nunca enviar mensagens automáticas para os clientes finais durante a janela de silêncio configurada no `UserConfig` (Padrão: 21:00 às 08:00 - Fuso GMT-4).
- **Agendamento BullMQ:** Mensagens geradas durante o horário de silêncio devem ser enfileiradas para serem disparadas no primeiro minuto útil (ex: 08:01).

## 4. Cobrança e Monetização (Abacate Pay)
- **Checkout Lock:** Um usuário com assinatura ativa (`status = ACTIVE`) não pode gerar novos checkouts de assinatura. Ele deve ser redirecionado para o dashboard.
- **Requisitos de Cadastro:** Para iniciar o checkout, o Profissional DEVE preencher obrigatoriamente seu `taxId` (CPF/CNPJ) e `whatsappNumber` nas configurações (`UserConfig`). O Use Case deve bloquear a criação de checkout se estes dados forem nulos.
- **Status da Assinatura:** O sistema gerencia através de Webhooks o status `ACTIVE` e `INACTIVE`. Assinaturas `INACTIVE` bloqueiam recursos premium (ex: sincronização automática).
- **Rastreamento de Histórico (SubscriptionPayment):** 
    - Toda tentativa de checkout (`create-checkout`) deve gerar um registro `PENDING` no histórico.
    - O Registro de histórico deve armazenar o valor exato no momento da cobrança (`amount`) proveniente das configurações de sistema (`.env`).
    - O Webhook de `billing.paid` deve conciliar o ID da cobrança (`billingId`) para marcar o registro histórico como `PAID` e registrar a data exata do pagamento (`paidAt`).
- **Faturas em PDF:** O sistema permite o download de comprovantes de pagamento em formato PDF apenas para transações com status `PAID`. As faturas são geradas dinamicamente com os dados do usuário e da cobrança.

## 5. Status e Conciliação (Google Calendar Sync)
Quando o cliente responde no WhatsApp:
- Se resposta = SIM -> Mudar cor do evento na API do Google para 'Verde' (ID 10) e adicionar o prefixo `[CONFIRMADO]`.
- Se resposta = NÃO -> Mudar cor para 'Vermelho' (ID 11), adicionar prefixo `[CANCELADO]` e disparar o alerta para o profissional.
- O sistema nunca deve deletar o evento do calendário, apenas atualizar seu status para manter o histórico.

## 6. Integração WhatsApp (Evolution API)
- **Nomenclatura de Instâncias:** As instâncias no WhatsApp seguem o padrão `agent_<userId (clean)>`.
- **Auto-Configuração:** No momento da conexão, o sistema configura automaticamente o Webhook da Evolution API para apontar para a URL do sistema, garantindo o recebimento de mensagens e status de sessão em tempo real.