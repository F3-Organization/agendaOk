# Context - ConfirmaZap

Este arquivo serve como o "Norte" (North Star) para o desenvolvimento e operação da ConfirmaZap. Ele fornece a visão de alto nível do projeto e orienta como os demais documentos no diretório `.agent` devem ser interpretados.

## 1. O que é a ConfirmaZap?
A **ConfirmaZap** é uma plataforma SaaS **Multi-Tenant** projetada para profissionais (médicos, estéticos, personal trainers, etc.) que precisam automatizar o gerenciamento de seus agendamentos. A plataforma integra-se ao **Google Calendar** e utiliza o **WhatsApp** (via Evolution API) para enviar lembretes e confirmações automáticas aos clientes finais.

## 2. Objetivo do Sistema
- **Sincronização:** Manter agendamentos sincronizados entre o sistema e o Google Calendar.
- **Automação de Notificações:** Reduzir o absenteísmo de clientes através de lembretes automáticos no WhatsApp.
- **Interatividade:** Permitir que o cliente final confirme ou cancele o agendamento respondendo diretamente pelo WhatsApp, com atualização automática no calendário do profissional.
- **Escalabilidade:** Operar como um SaaS robusto, com planos Free e Pro, integrando pagamentos e gestão de assinaturas.
- **Autoatendimento IA (PRO):** Bot inteligente via WhatsApp (Gemini API) para triagem, agendamento e interação com clientes de forma autônoma.

## 3. Modelo Multi-Tenant

O sistema adota um modelo multi-tenant com dois níveis de isolamento:

```
User (userId)
 ├── Subscription (userId) — plano FREE/PRO do usuário
 └── Companies (ownerId → userId) — até 3 empresas no plano PRO
      ├── CompanyConfig — configurações da empresa (WhatsApp, sincronização, bot IA, etc.)
      ├── Integrations — tokens de serviços externos (Google, etc.)
      ├── Professionals — profissionais/médicos da empresa (horários, especialidade)
      ├── Schedules — agendamentos isolados por company
      └── Clients — base de clientes por company
```

- **Subscription é do User:** O plano PRO pertence ao usuário, não à empresa. Um user PRO pode ter até 3 companies.
- **Dados operacionais são da Company:** Agendamentos, clientes, configs e integrações são isolados por `companyId`.
- **JWT contém `companyId`:** Após login e seleção de empresa, o token JWT inclui o `companyId` ativo para scoping das operações.

## 4. Pilares Arquiteturais
- **Isolamento de Dados (Multi-Tenancy):** Rigoroso isolamento por `companyId` em todas as tabelas operacionais (schedules, clients, configs, integrations). Assinatura isolada por `userId`.
- **Resiliência:** Uso de filas (BullMQ/Redis) para garantir o envio de mensagens mesmo sob falhas de rede ou limites de API.
- **Facilidade de Uso:** O profissional deve ser capaz de conectar seu WhatsApp e Calendário com poucos cliques.

## 5. Guia de Documentos (.agent)
Este diretório contém a "verdade" técnica e de negócio do projeto, dividida por contexto:

### Backend
- **[tech-stack.md](./backend/tech-stack.md):** As ferramentas e linguagens permitidas.
- **[business-rules.md](./backend/business-rules.md):** O comportamento esperado do sistema e lógica de domínio.
- **[architecture.md](./backend/architecture.md):** Desenho técnico, padrões de pastas (Hexagonal/Clean) e diagramas.
- **[code-style.md](./backend/code-style.md):** Padrões de escrita de código e convenções.
- **[review-checklist.md](./backend/review-checklist.md):** Checklist obrigatorio antes de cada commit/review.
- **[auth-flow.md](./backend/auth-flow.md):** Detalhes sobre autenticação e segurança.
- **[testing.md](./backend/testing.md):** Como garantir a qualidade das funcionalidades.
- **[docs-policy.md](./backend/docs-policy.md):** Como documentar novas funcionalidades e manter o `.agent` atualizado.
- **[docker-setup.md](./backend/docker-setup.md):** Configuração do ambiente de desenvolvimento via Docker.

### Frontend
- **[tech-stack.md](./frontend/tech-stack.md):** Tecnologias e padrões do front (Next.js/React).
- **[architecture.md](./frontend/architecture.md):** Organização de pastas e componentes do frontend.
- **[api-mapping.md](./frontend/api-mapping.md):** Mapeamento de endpoints consumidos.
- **[backend-api-spec.md](./frontend/backend-api-spec.md):** Especificação da API esperada pelo frontend.
- **[stitch-prompt.md](./frontend/stitch-prompt.md):** Instruções para geração de interfaces.

### Recurso Compartilhado
- **[shared.md](./shared.md):** Documentação sobre o diretório `/shared` (Zod schemas/Types).
- **[git-workflow.md](./git-workflow.md):** Padrões de versionamento (Git Flow e Conventional Commits).

## 6. Mentalidade de Desenvolvimento
Ao trabalhar neste projeto, priorize:
1. **Segurança de Dados:** Nunca permita que uma empresa acesse dados de outra. Sempre filtre por `companyId`.
2. **Logs e Observabilidade:** Tudo o que acontece nas filas e notificações deve ser rastreável.
3. **Clean Code:** Siga rigorosamente as regras de [code-style.md](/.agent/backend/code-style.md).
4. **Versionamento:** Siga rigorosamente o [git-workflow.md](/.agent/git-workflow.md) para commits e branches.
