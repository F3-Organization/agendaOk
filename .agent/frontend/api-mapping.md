[🏠 Voltar ao Contexto](../CONTEXT.md)

# API Mapping & Shared Type Safety

The Monorepo allows for **End-to-End Type Safety** by sharing Zod schemas between the Fastify backend and the React frontend via the `@shared` alias.

## API Hooks Mapping

Mapping of frontend feature hooks to backend Fastify routes.

## Auth Feature
| Hook | API Route | Description |
|------|-----------|-------------|
| `useAuthLogin` | `GET /api/auth/google` | Redirects to Google consent. |
| `useAuthCallback` | `GET /api/auth/google/callback` | Receives code and sets JWT. |
| `useMe` | `GET /api/auth/me` | Fetch user context (TanStack Query). |

## Calendar Feature
| Hook | API Route | Description |
|------|-----------|-------------|
| `useSyncCalendar` | `POST /api/calendar/sync` | Mutation to trigger Google-to-DB sync. |
| `useNotify` | `POST /api/calendar/notify` | Mutation to trigger scan and notification. |

## Subscription Feature
| Hook | API Route | Description |
|------|-----------|-------------|
| `useSubscription` | `GET /api/subscription/status` | Current status (FREE/PRO). |
| `useCheckout` | `POST /api/subscription/checkout` | Mutation to generate Abacate Pay URL. |

## WhatsApp Feature
| Hook | API Route | Description |
|------|-----------|-------------|
| `useConnect` | `POST /api/whatsapp/connect` | Fetch QR Code Base64. |
| `useDisconnect` | `DELETE /api/whatsapp/disconnect` | Terminate session. |

---

## Documentos Relacionados
- [Especificação da API](./backend-api-spec.md)
- [Arquitetura Frontend](./architecture.md)
- [Recursos Compartilhados](../shared.md)

