# Context - ConfirmaZap

Este arquivo serve como o "Norte" (North Star) para o desenvolvimento e operação da ConfirmaZap. Ele fornece a visão de alto nível do projeto e orienta como os demais documentos no diretório `.agent` devem ser interpretados.

## 1. O que é a ConfirmaZap?
A **ConfirmaZap** é uma plataforma SaaS **Multi-Tenant** focada em **bot de autoatendimento via WhatsApp** para negócios de serviços (clínicas, estéticas, academias, etc.). A plataforma utiliza **WhatsApp** (via Evolution API) com IA (Gemini) para automatizar agendamentos, confirmações e atendimento ao cliente — com cada usuário pagante podendo operar até **3 empresas independentes** (3 atendentes de WhatsApp distintos). A aplicação é **internacionalizada (i18n)** com suporte a **Português (pt-BR)** e **Inglês (en)**, tanto no frontend quanto no backend.

## 2. Objetivo do Sistema
- **Bot Multi-Tenant:** Cada empresa tem seu próprio atendente WhatsApp com IA, isolado das demais.
- **Autoatendimento Inteligente:** Clientes finais fazem agendamentos, confirmações e cancelamentos diretamente pelo WhatsApp, sem intervenção humana.
- **Bot Bilíngue (PT/EN):** O bot detecta automaticamente o idioma do cliente (Português ou Inglês) e responde no mesmo idioma. Palavras-chave de confirmação/cancelamento e respostas automáticas também são bilíngues.
- **Sincronização com Calendário (opcional):** Integração com Google Calendar disponível para empresas que já usam a plataforma — não é requisito obrigatório.
- **Escalabilidade:** SaaS robusto com planos Free e PRO, pagamentos via Abacate Pay e gestão de assinaturas.

## 3. Produto Principal vs. Integrações Opcionais

### Core (indispensável)
- Bot WhatsApp com IA (Gemini API) por empresa
- Gestão de agendamentos própria do sistema
- Multi-tenancy: User → até 3 Companies → cada uma com seu WhatsApp

### Integrações Opcionais
- **Google Calendar:** Sincronização de eventos do calendário Google para disparar lembretes automáticos. Útil para quem já usa Google Calendar, mas não é bloqueante — a empresa pode operar 100% sem esta integração.

## 4. Modelo Multi-Tenant

O sistema adota um modelo multi-tenant com dois níveis de isolamento:

```
User (userId)
 ├── Subscription (userId) — plano FREE/PRO do usuário
 └── Companies (ownerId → userId) — até 3 empresas no plano PRO
      ├── CompanyConfig — configurações (WhatsApp, bot IA, horários, etc.)
      ├── Integrations — tokens de serviços externos (Google Calendar, etc.)
      ├── Professionals — profissionais/médicos da empresa (horários, especialidade)
      ├── Schedules — agendamentos isolados por company
      └── Clients — base de clientes por company
```

- **Subscription é do User:** O plano PRO pertence ao usuário, não à empresa. Um user PRO pode ter até 3 companies (= 3 instâncias WhatsApp distintas).
- **Dados operacionais são da Company:** Agendamentos, clientes, configs e integrações são isolados por `companyId`.
- **JWT contém `companyId`:** Após login e seleção de empresa, o token JWT inclui o `companyId` ativo para scoping das operações.

## 5. Pilares Arquiteturais
- **Isolamento de Dados (Multi-Tenancy):** Rigoroso isolamento por `companyId` em todas as tabelas operacionais. Assinatura isolada por `userId`.
- **Bot como Cidadão de Primeira Classe:** O fluxo primário de interação é WhatsApp → Bot IA → ação no sistema. Google Calendar é secundário/opcional.
- **Resiliência:** Filas BullMQ/Redis garantem envio de mensagens mesmo sob falhas. Jobs com falha são retidos (DLQ) para diagnóstico.
- **Internacionalização (i18n):** Toda a aplicação — frontend (react-i18next), backend (módulo `shared/i18n`) e bot IA — suporta Português e Inglês. Erros do backend são traduzidos via header `Accept-Language`.
- **Facilidade de Uso:** O profissional conecta seu WhatsApp e habilita o bot em poucos cliques. Google Calendar é configuração adicional, não obrigatória.

## 6. Guia de Documentos (.agent)
Este diretório contém a "verdade" técnica e de negócio do projeto, dividida por contexto:

### Backend
- **[tech-stack.md](./backend/tech-stack.md):** As ferramentas e linguagens permitidas.
- **[business-rules.md](./backend/business-rules.md):** O comportamento esperado do sistema e lógica de domínio.
- **[architecture.md](./backend/architecture.md):** Desenho técnico, padrões de pastas (Hexagonal/Clean) e diagramas.
- **[code-style.md](./backend/code-style.md):** Padrões de escrita de código e convenções.
- **[review-checklist.md](./backend/review-checklist.md):** Checklist obrigatório antes de cada commit/review.
- **[auth-flow.md](./backend/auth-flow.md):** Detalhes sobre autenticação e segurança.
- **[testing.md](./backend/testing.md):** Como garantir a qualidade das funcionalidades.
- **[docs-policy.md](./backend/docs-policy.md):** Como documentar novas funcionalidades e manter o `.agent` atualizado.
- **[docker-setup.md](./backend/docker-setup.md):** Configuração do ambiente de desenvolvimento via Docker.

### Frontend
- **[tech-stack.md](./frontend/tech-stack.md):** Tecnologias e padrões do front (React/Vite).
- **[architecture.md](./frontend/architecture.md):** Organização de pastas e componentes do frontend.
- **[api-mapping.md](./frontend/api-mapping.md):** Mapeamento de endpoints consumidos.
- **[backend-api-spec.md](./frontend/backend-api-spec.md):** Especificação da API esperada pelo frontend.
- **[stitch-prompt.md](./frontend/stitch-prompt.md):** Instruções para geração de interfaces.

### Recurso Compartilhado
- **[shared.md](./shared.md):** Documentação sobre o diretório `/shared` (Zod schemas/Types).
- **[git-workflow.md](./git-workflow.md):** Padrões de versionamento (Git Flow e Conventional Commits).

### Integrações Externas
- **[abacatepay-api.md](./abacatepay-api.md):** Documentação completa da API do Abacate Pay (pagamentos, PIX, assinaturas, webhooks).

## 7. Mentalidade de Desenvolvimento
Ao trabalhar neste projeto, priorize:
1. **Segurança de Dados:** Nunca permita que uma empresa acesse dados de outra. Sempre filtre por `companyId`.
2. **Bot em Primeiro Lugar:** Novas features devem priorizar a experiência do bot/atendimento WhatsApp.
3. **Logs e Observabilidade:** Tudo o que acontece nas filas e notificações deve ser rastreável. Jobs com falha são retidos na DLQ.
4. **Clean Code:** Siga rigorosamente as regras de [code-style.md](/.agent/backend/code-style.md).
5. **Versionamento:** Siga rigorosamente o [git-workflow.md](/.agent/git-workflow.md) para commits e branches.
