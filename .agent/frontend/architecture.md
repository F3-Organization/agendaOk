# Senior Architecture: Feature-Driven Development

Following the requested architecture, AgendaOk Frontend will be organized into isolated business modules.

## 1. Directory Structure

```plaintext
src/
├── app/                  # Initializations & Providers
│   ├── router.tsx        # React Router v6 setup
│   └── providers.tsx     # TanStack Query + Auth + Router
│
├── features/             # Business Logic (Encapsulated)
│   ├── auth/             # Google OAuth & Sessions
│   ├── calendar/         # Appointments & Syncing
│   ├── whatsapp/         # Evolution API Integration
│   └── subscription/     # Abacate Pay Checkout & Status
│
├── pages/                # Compose features into views
│   ├── dashboard.tsx
│   ├── login.tsx
│   └── checkout.tsx
│
└── shared/               # Cross-feature code
    ├── api/              # Axios + JWT Interceptors
    ├── ui/               # shadcn/ui components (Radix + Tailwind)
    └── types/            # DTOs and Shared Schemas
```

## 2. Feature Encapsulation Rules

- **Public API**: Each feature can export a single `index.ts` (Point of Entry). Components from `pages/` should only import from these entry points.
- **Dependency Flow**: A feature cannot import from another feature. If sharing is required (e.g., `User` type), it must be moved to `shared/`.
- **Logic Isolation**: All `useEffect` hooks related to data fetching are banned in favor of TanStack Query hooks in the feature's `hooks/` directory.

## 3. Tech Stack Rationale

- **TanStack Query**: Abstracting the server state (cache, invalidation, loading).
- **Zustand**: Minimalist and high-performance client state (UI toggles, current user cache).
- **Zod**: Validation from API to Form, ensuring end-to-end type safety.
