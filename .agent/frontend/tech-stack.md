[🏠 Voltar ao Contexto](../CONTEXT.md)

# Tech Stack (Senior SaaS Monorepo)

Selected technologies for the full ConfirmaZap ecosystem, optimized for high performance and horizontal scaling.

## Infrastructure & Orchestration
- **Docker Compose**: Unified orchestration for API, Web, Evolution API, Postgres, and Redis.
- **Monorepo (Shared Directory)**: Centralized `@shared/schemas` and `@shared/types` to avoid duplication.

## Core
- **React 18 + TypeScript**: Baseline for type-safe and modern component development.
- **Vite**: Ultra-fast build tool and development server.


## Data Fetching & State
- **TanStack Query (React Query)**: Handles all server state. Replaces global loading states and manual `useEffect` fetching.
- **Zustand**: Lightweight global state for small snippets of client information (e.g., drawer state, local UI preferences).
- **Axios**: HTTP client with request/response interceptors for JWT and error handling.

## UI/UX & Styling
- **Tailwind CSS**: Utility-first CSS for rapid styling without vendor lock-in.
- **shadcn/ui**: Accessible and customizable components built with Radix UI primitives. Ensures a premium "App" feel.
- **Lucide React**: Icon set for a clean and cohesive visual language.

## Forms & Validation
- **React Hook Form**: Performant form handling with minimal re-renders.
- **Zod**: Schema validation for form inputs and API response verification.

## Internacionalização (i18n)
- **react-i18next + i18next**: Biblioteca padrão para internacionalização no React.
- **Locales suportados:** `pt` (Português BR, padrão) e `en` (Inglês).
- **Arquivos de tradução:** `frontend/src/shared/i18n/locales/pt.json` e `en.json`.
- **Detecção de idioma:** Via `i18next-browser-languagedetector` (detecta do navegador).
- **Integração com API:** O interceptor do Axios envia automaticamente o header `Accept-Language` baseado no idioma ativo do i18next, garantindo que erros do backend sejam retornados no idioma correto.
- **Toggle de idioma:** Disponível no Sidebar para troca manual entre PT e EN.

---

## Documentos Relacionados
- [Arquitetura Frontend](./architecture.md)
- [Especificação da API](./backend-api-spec.md)
- [Contexto Geral](../CONTEXT.md)

