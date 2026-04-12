[🏠 Voltar ao Contexto](../CONTEXT.md)

# Arquitetura Frontend - ConfirmaZap

Este documento descreve a organização e os princípios arquiteturais seguidos no desenvolvimento do frontend da **ConfirmaZap**, utilizando React com Vite e seguindo o padrão **Feature-Driven**.

## 1. Estrutura de Diretórios

O frontend está localizado no diretório `/web` e segue uma estrutura modular baseada em funcionalidades (features):

```plaintext
/web
├── src/
│   ├── app/              # Provedores (Providers), Rotas globais e Layout base.
│   ├── features/         # Módulos isolados por domínio (ex: auth, calendar, dashboard).
│   │   ├── components/   # Componentes específicos da feature.
│   │   ├── hooks/        # Lógica de negócio, consultas (TanStack Query) e mutações.
│   │   └── services/     # Chamadas de API específicas da feature.
│   ├── shared/           # Componentes UI (shadcn), instâncias de API, utilitários globais.
│   └── assets/           # Imagens, fontes e estilos globais.
└── Dockerfile
```

## 2. Integração com Shared Recursos
O frontend consome schemas e tipos localizados no diretório raiz `/shared` (alias `@shared`). 
Para detalhes sobre como esses recursos são compartilhados, consulte o guia [shared.md](file:///home/felipe/Repositories/personal/confirmaZap/.agent/shared.md).

## 3. Pilares do Desenvolvimento Frontend

### 🏗️ Feature Encapsulation
Um módulo de funcionalidade (ex: `auth`) não deve importar diretamente de outro módulo (ex: `calendar`). Lógicas compartilhadas devem ser movidas para `web/src/shared` ou para o diretório raiz `shared/`.

### 🛡️ Type Safety (Zod + TypeScript)
Todos os contratos de API são definidos como schemas **Zod** no diretório compartilhado. Isso garante que o frontend esteja sempre em sincronia com os dados validados pelo backend.

### 💉 Isolamento de Lógica
- **Páginas e Componentes**: Focam na renderização e estado de UI. Devem ser o mais "burros" possível.
- **Hooks (TanStack Query)**: Concentram todo o gerenciamento de estado do servidor, cache e efeitos colaterais de rede.

## 4. Tecnologias Principais
- **React + Vite**: Para um desenvolvimento rápido e tipagem robusta.
- **Tailwind CSS + shadcn/ui**: Para uma interface premium e acessível.
- **Zustand**: Para estados globais simples e leves (ex: preferências de UI).
- **Axios**: Cliente HTTP configurado com interceptadores para tratamento de tokens JWT.

---

## Documentos Relacionados
- [Tech Stack](./tech-stack.md)
- [Mapeamento de API](./api-mapping.md)
- [Stitch Prompt](./stitch-prompt.md)
- [Recursos Compartilhados](../shared.md)

