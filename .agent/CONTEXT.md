# Context - ConfirmaZap

Este arquivo serve como o "Norte" (North Star) para o desenvolvimento e operação da ConfirmaZap. Ele fornece a visão de alto nível do projeto e orienta como os demais documentos no diretório `.agent` devem ser interpretados.

## 1. O que é a ConfirmaZap?
A **ConfirmaZap** é uma plataforma SaaS **Multi-Tenant** projetada para profissionais (médicos, estéticos, personal trainers, etc.) que precisam automatizar o gerenciamento de seus agendamentos. A plataforma integra-se ao **Google Calendar** e utiliza o **WhatsApp** (via Evolution API) para enviar lembretes e confirmações automáticas aos clientes finais.

## 2. Objetivo do Sistema
- **Sincronização:** Manter agendamentos sincronizados entre o sistema e o Google Calendar.
- **Automação de Notificações:** Reduzir o absenteísmo de clientes através de lembretes automáticos no WhatsApp.
- **Interatividade:** Permitir que o cliente final confirme ou cancele o agendamento respondendo diretamente pelo WhatsApp, com atualização automática no calendário do profissional.
- **Escalabilidade:** Operar como um SaaS robusto, com planos Free e Pro, integrando pagamentos e gestão de assinaturas.

## 3. Pilares Arquiteturais
- **Isolamento de Dados (Multi-Tenancy):** Rigoroso isolamento por `userId` em todas as tabelas e fluxos.
- **Resiliência:** Uso de filas (BullMQ/Redis) para garantir o envio de mensagens mesmo sob falhas de rede ou limites de API.
- **Facilidade de Uso:** O profissional deve ser capaz de conectar seu WhatsApp e Calendário com poucos cliques.

## 4. Guia de Documentos (.agent)
Este diretório contém a "verdade" técnica e de negócio do projeto, dividida por contexto:

### Backend
- **[tech-stack.md](/.agent/backend/tech-stack.md):** As ferramentas e linguagens permitidas.
- **[business-rules.md](/.agent/backend/business-rules.md):** O comportamento esperado do sistema e lógica de domínio.
- **[architecture.md](/.agent/backend/architecture.md):** Desenho técnico, padrões de pastas (Hexagonal/Clean) e diagramas.
- **[code-style.md](/.agent/backend/code-style.md):** Padrões de escrita de código e convenções.
- **[review-checklist.md](/.agent/backend/review-checklist.md):** Checklist obrigatorio antes de cada commit/review.
- **[auth-flow.md](/.agent/backend/auth-flow.md):** Detalhes sobre autenticação e segurança.
- **[testing.md](/.agent/backend/testing.md):** Como garantir a qualidade das funcionalidades.
- **[docs-policy.md](/.agent/backend/docs-policy.md):** Como documentar novas funcionalidades e manter o `.agent` atualizado.
- **[docker-setup.md](/.agent/backend/docker-setup.md):** Configuração do ambiente de desenvolvimento via Docker.

### Frontend
- **[tech-stack.md](/.agent/frontend/tech-stack.md):** Tecnologias e padrões do front (Next.js/React).
- **[architecture.md](/.agent/frontend/architecture.md):** Organização de pastas e componentes do frontend.
- **[api-mapping.md](/.agent/frontend/api-mapping.md):** Mapeamento de endpoints consumidos.
- **[backend-api-spec.md](/.agent/frontend/backend-api-spec.md):** Especificação da API esperada pelo frontend.
- **[stitch-prompt.md](/.agent/frontend/stitch-prompt.md):** Instruções para geração de interfaces.

### Recurso Compartilhado
- **[shared.md](/.agent/shared.md):** Documentação sobre o diretório `/shared` (Zod schemas/Types).

## 5. Mentalidade de Desenvolvimento
Ao trabalhar neste projeto, priorize:
1. **Segurança de Dados:** Nunca permita que um usuário acesse dados de outro.
2. **Logs e Observabilidade:** Tudo o que acontece nas filas e notificações deve ser rastreável.
3. **Clean Code:** Siga rigorosamente as regras de [code-style.md](/.agent/backend/code-style.md).
