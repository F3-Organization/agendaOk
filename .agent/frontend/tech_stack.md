# Tech Stack (Senior SaaS)

Selected technologies for the frontend of AgendaOk.

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
