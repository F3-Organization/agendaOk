# AgendaOk 🗓️✅

**AgendaOk** é uma solução SaaS pragmática para profissionais que desejam automatizar a confirmação de seus agendamentos. O sistema sincroniza com o **Google Calendar** e utiliza a **Evolution API** para enviar notificações automáticas via WhatsApp, permitindo que os clientes confirmem ou cancelem horários de forma simples e direta.

---

## 🚀 Funcionalidades Principais

-   **Sincronização com Google Calendar**: Monitora eventos em tempo real e atualiza o status (cores e prefixos) conforme as respostas dos clientes.
-   **Notificações Inteligentes via WhatsApp**:
    -   Envio automático de lembretes.
    -   **Janela de Silêncio**: Garante que mensagens não sejam enviadas em horários impróprios (ex: entre 21h e 08h).
    -   **Fallback Strategy**: Busca números de telefone em base de dados interna se o título do evento não contiver informações suficientes.
-   **Gestão de Status**:
    -   ✅ **Confirmado**: O evento no Google muda para verde.
    -   ❌ **Cancelado**: O evento muda para vermelho e o profissional recebe um alerta imediato no WhatsApp.
-   **Fila de Processamento (BullMQ)**: Garante resiliência no envio das mensagens e respeito aos limites de taxa (rate limits).

---

## 🛠️ Tech Stack

-   **Runtime**: Node.js 20+ (TypeScript)
-   **Web Framework**: Fastify
-   **ORM**: TypeORM (PostgreSQL)
-   **WhatsApp Gateway**: Evolution API v2
-   **Fila/Cache**: Redis + BullMQ
-   **Infraestrutura**: Docker & Docker Compose

---

## 🏗️ Arquitetura

O projeto segue os princípios de **Ports and Adapters** (Arquitetura Hexagonal), mantendo a lógica de negócio (`usecases`) isolada de detalhes técnicos como banco de dados e APIs externas.

Para mais detalhes, veja:
-   [Arquitetura Detalhada](.agent/architecture.md)
-   [Regras de Negócio](.agent/business-rules.md)

---

## 🚦 Como Iniciar

### Pré-requisitos
-   Docker e Docker Compose instalados.
-   Uma conta no Google Cloud Console (para credenciais do Calendar API).

### Configuração
1.  Clone o repositório.
2.  Crie o arquivo `.env` baseado no `.env.example`:
    ```bash
    cp .env.example .env
    ```
3.  Preencha as chaves da Google API e da Evolution API no `.env`.

### Rodando o Ambiente
Para subir todos os serviços (App, Banco, Redis e Evolution API):
```bash
docker compose up --build
```

A aplicação principal estará acessível em `http://localhost:3000` e a Evolution API em `http://localhost:8080`.

---

## 📁 Estrutura de Pastas

```text
src/
├── usecase/       # Lógica de negócio e interfaces de repositório
├── infra/         # Implementações técnicas (DB, Adapters, Controllers)
│   ├── database/  # Arquivos do TypeORM (Entities, Repositories)
│   ├── adapters/  # Integrações com APIs externas (Fastify, Google, Evolution)
│   ├── factory/   # Composition Root (Injeção de Dependências)
│   └── config/    # Configurações globais e envs
└── bootstrap.ts   # Ponto de entrada da aplicação
```

---

## 📄 Licença

Este projeto é de uso pessoal/privado do **F3-Organization**.

---

## 🔮 Roadmap & Integrações Futuras

O AgendaOk foi projetado para ser extensível. Planejamos as seguintes expansões:

-   **Provedores de Calendário**:
    -   [ ] **Microsoft Outlook / Office 365**: Para atender clientes corporativos.
    -   [ ] **Apple iCloud Calendar**: Sincronização via iCal.
-   **Canais de Comunicação**:
    -   [ ] **SMS Fallback (Twilio/MessageBird)**: Para quando o cliente não possui WhatsApp.
    -   [ ] **Notificações por E-mail (SES/SendGrid)**: Envio de recibos e avisos formais.
-   **Interfaces**:
    -   [ ] **Painel Administrativo (Next.js)**: Para o profissional gerenciar suas configurações e ver logs de mensagens em tempo real.
    -   [ ] **Multi-Instâncias**: Suporte para o profissional conectar múltiplos números de WhatsApp.
