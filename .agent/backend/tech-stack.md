[🏠 Voltar ao Contexto](../CONTEXT.md)

# Tech Stack - ConfirmaZap

## Core
- **Runtime:** Node.js (LTS - v24+)
- **Linguagem:** TypeScript (Strict mode habilitado)
- **Framework Web:** Fastify (v4+)
- **ORM:** TypeORM (v0.3.x)
- **Banco de Dados:** PostgreSQL
- **Configuração**: `dotenv` para variáveis de ambiente.

## Filas e Background Jobs
- **Message Broker / Cache:** Redis
- **Queue Manager:** BullMQ (Essencial para lidar com rate limit da API do WhatsApp e retentativas).

## Integrações Externas (Adapters)
- **Google Calendar API:** `googleapis` (v118+). Autenticação via OAuth2.
- **WhatsApp API:** Evolution API (Consumo via HTTP/REST simples).
- **IA Generativa:** Google Gemini API (`@google/generative-ai`). Modelo padrão: `gemini-2.0-flash`. Usado para o bot de autoatendimento (PRO).

## Testes (Opcional para MVP, mas configurado)
- **Test Runner:** Vitest (Mais rápido que Jest e com suporte nativo a ESM/TS).

---

## Documentos Relacionados
- [Arquitetura](./architecture.md)
- [Ambiente Docker](./docker-setup.md)
- [Padrões de Código](./code-style.md)