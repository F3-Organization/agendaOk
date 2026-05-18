# ConfirmaZap

Plataforma SaaS multi-tenant de autoatendimento via WhatsApp com inteligência artificial para negócios de serviços.

---

## Visão Geral

O ConfirmaZap automatiza o atendimento ao cliente e a gestão de agendamentos através de um bot inteligente no WhatsApp, alimentado pela API Gemini. Cada empresa conecta seu próprio número de WhatsApp e recebe um atendente virtual autônomo capaz de agendar, confirmar, cancelar e remarcar compromissos — sem intervenção humana.

A plataforma foi projetada para clínicas, salões, estúdios, consultórios e qualquer negócio baseado em agendamentos que deseje oferecer uma experiência moderna e automatizada aos seus clientes.

---

## Funcionalidades

### Bot de Autoatendimento com IA
- Atendimento 24/7 via WhatsApp com linguagem natural (Gemini API)
- Detecção automática de idioma — responde em Português ou Inglês
- Agendamento autônomo com verificação de disponibilidade em tempo real
- Cancelamento e remarcação de compromissos via conversa
- Contexto dinâmico: serviços, profissionais, horários de trabalho e instruções personalizadas por empresa

### Gestão de Agendamentos
- CRUD completo de agendamentos com painel web
- Notificações automáticas de lembrete via WhatsApp (cron)
- Confirmação/cancelamento por palavras-chave (SIM/NÃO)
- Controle de conflitos de horário com reativação inteligente de agendamentos cancelados
- Suporte a múltiplos profissionais com horários independentes

### Multi-Tenancy
- Modelo User → Companies: cada usuário PRO pode operar até 3 empresas independentes
- Isolamento total de dados por empresa (agendamentos, clientes, configurações)
- Cada empresa possui sua própria instância WhatsApp e configurações de bot

### Integrações
- **WhatsApp** via Evolution API v2 — conexão via QR Code, envio/recebimento automatizado
- **Abacate Pay** — gestão de assinaturas, checkout PIX e webhooks de pagamento

### Segurança
- Autenticação JWT com suporte a login via Google OAuth
- Autenticação de dois fatores (TOTP)
- Criptografia AES-256-CBC para tokens de integração
- Rate limiting por usuário (120 req/min)
- Internacionalização completa (i18n) — PT-BR e EN

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20+ (TypeScript) |
| Backend | Fastify |
| ORM | TypeORM (PostgreSQL) |
| Frontend | React 18, Vite, TailwindCSS |
| IA | Google Gemini API |
| WhatsApp | Evolution API v2 |
| Filas/Cache | Redis + BullMQ |
| Pagamentos | Abacate Pay |
| Infraestrutura | Docker, Docker Swarm |

---

## Arquitetura

O backend segue o padrão **Ports and Adapters** (Hexagonal), com lógica de negócio isolada em Use Cases e interfaces (Ports) para repositórios e serviços externos.

```
backend/src/
├── usecase/         # Lógica de negócio, interfaces de repositório e ports
├── infra/           # Implementações técnicas
│   ├── database/    # Entidades e repositórios TypeORM
│   ├── adapters/    # Fastify, Gemini, Evolution API
│   ├── controller/  # HTTP controllers com validação Zod
│   ├── factory/     # Composition Root (injeção de dependências manual)
│   └── config/      # Variáveis de ambiente e data source
├── shared/          # i18n, utils, errors
└── bootstrap.ts     # Ponto de entrada
```

```
frontend/src/
├── app/             # Router, providers, tema
├── features/        # Módulos por domínio (auth, company, subscription)
├── pages/           # Páginas da aplicação
└── shared/          # Componentes UI, API client, i18n
```

---

## Ambiente de Desenvolvimento

### Pré-requisitos
- Docker e Docker Compose
- Chave da Gemini API (para o bot IA)

### Setup

```bash
git clone git@github.com:F3-Organization/confirmazap.git
cd confirmazap
cp backend/.env.example backend/.env
# Preencha as variáveis de ambiente no .env
docker compose up --build
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api |
| Swagger Docs | http://localhost:3000/api/swagger |
| Evolution API | http://localhost:8080 |

---

## Documentação Técnica

A documentação detalhada de arquitetura, regras de negócio, padrões de código e fluxos está no diretório [`.agent/`](.agent/CONTEXT.md):

- [Contexto Geral](.agent/CONTEXT.md)
- [Regras de Negócio](.agent/backend/business-rules.md)
- [Arquitetura Backend](.agent/backend/architecture.md)
- [Padrões de Código](.agent/backend/code-style.md)
- [Fluxo de Autenticação](.agent/backend/auth-flow.md)

---

## Licença

Projeto privado — **F3-Organization**. Todos os direitos reservados.
