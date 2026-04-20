[🏠 Voltar ao Contexto](./CONTEXT.md)

# Shared Resources (@shared)

Este documento descreve os recursos compartilhados entre o Backend e o Frontend da ConfirmaZap, localizados no diretório raiz `/shared`.

## 1. Objetivo do Diretório Shared
O objetivo principal é manter a **Single Source of Truth** (Fonte Única da Verdade) para contratos de dados, evitando duplicidade de tipagem e garantindo que mudanças na API sejam refletidas instantaneamente no frontend.

## 2. Conteúdo
- **Schemas de Validação (Zod)**: Localizados em `/shared/schemas`.
    - Utilizados no **Backend** para validar o corpo das requisições (`body`), parâmetros (`params`) e consultas (`query`).
    - Utilizados no **Frontend** para validar formulários (React Hook Form) e garantir a tipagem das respostas da API.
- **Tipos Globais (TypeScript)**: Interfaces e tipos que são comuns a ambos os ambientes.

## 3. Como Utilizar
### No Backend
Importe utilizando o alias configurado no `tsconfig.json` (geralmente `@shared` ou caminhos relativos):
```typescript
import { userSchema } from '@shared/schemas/user.schema';
```

### No Frontend
Da mesma forma, utilize os schemas para tipar os hooks do React Query ou as validações do shadcn/ui:
```typescript
import { userSchema } from '@shared/schemas/user.schema';
const UserType = z.infer<typeof userSchema>;
```

## 4. Regras de Ouro
1. **Sem Lógica de Negócio**: O diretório `shared` deve conter apenas definições de dados, nunca lógica de execução.
2. **Dependência Zero**: Evite importar módulos do backend ou frontend para dentro do `shared`. Ele deve ser o nível mais baixo de dependência.
3. **Sincronia**: Sempre que alterar um schema no `shared`, certifique-se de que tanto o backend quanto o frontend continuam compilando e passando nos testes.

---

## Documentos Relacionados
- [Arquitetura Backend](./backend/architecture.md)
- [Arquitetura Frontend](./frontend/architecture.md)
- [Contexto Geral](./CONTEXT.md)
