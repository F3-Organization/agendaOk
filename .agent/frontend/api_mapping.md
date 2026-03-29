# API Mapping & State Management hooks

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
