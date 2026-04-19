[🏠 Voltar ao Contexto](../CONTEXT.md)

# Arquitetura do Projeto - ConfirmaZap

Este documento descreve a organização e os princípios arquiteturais seguidos no desenvolvimento do **ConfirmaZap**. O projeto utiliza uma abordagem pragmática baseada em **Ports and Adapters**, focada em produtividade com TypeORM.

## 1. Visão Geral das Camadas

A estrutura é dividida entre lógica de aplicação (`usecase`) e detalhes técnicos de infraestrutura (`infra`).

```mermaid
graph TD
    subgraph Infraestrutura
        A[Fastify / Adapters] --> B[Factory]
        C[Controller] --> B
        D[TypeORM Entities] --> B
        H[Database / Repositories] --> B
    end

    subgraph Aplicação
        B --> E[Use Cases]
    end
```

### 📂 `src/usecase` (Aplicação)
- **Coração da Lógica**: Contém a lógica de negócio específica da aplicação (Interactors).
- Orquestra como os dados são processados e manipulados através de interfaces (**Ports**).
- Exemplo: `SyncCalendarUseCase`, `GenerateGoogleAuthUrlUseCase`.

### 📂 `src/infra` (Infraestrutura)
- **O Mundo Externo e Dados**: Implementações técnicas e persistência.
    - **database/entities/**: Contém as entidades do TypeORM (Modelos do Banco).
        - `User`: Dados de autenticação e perfil do profissional.
        - `Company`: Empresa/negócio do profissional (cada user pode ter múltiplas).
        - `CompanyConfig`: Configurações operacionais da empresa (WhatsApp, sincronização, horários de silêncio).
        - `Integration`: Tokens e credenciais de serviços externos (Google OAuth), vinculados à Company.
        - `Client`: Base de clientes de cada empresa.
        - `Schedule`: Agendamentos sincronizados por empresa.
        - `Subscription`: Dados da assinatura PRO, vinculada ao **User** (não à Company).
        - `SubscriptionPayment`: Histórico detalhado de pagamentos e cobranças.
        - `Professional`: Profissionais da empresa (médicos, esteticistas, etc.) com horários de trabalho e especialidade.
    - **database/repositories/**: Contém as implementações concretas de persistência de dados.
    - **adapters/**: Adaptadores para bibliotecas externas (ex: `FastifyAdapter`, `GoogleCalendarAdapter`, `AbacatePayAdapter`, `GeminiAdapter`).
    - **controller/**: Porta de entrada para requisições externas (HTTP/REST).
    - **controller/schemas/**: Schemas Zod de validação de entrada, separados dos controllers.
    - **factory/**: **Composition Root**. Centraliza a instanciação e a injeção de dependências.
    - **config/**: Configurações de ambiente, flags de debug e segredos.

---

## 2. Modelo de Dados Multi-Tenant

```mermaid
erDiagram
    User ||--o{ Company : "owns (ownerId)"
    User ||--o| Subscription : "has (userId)"
    Company ||--o| CompanyConfig : "has (companyId)"
    Company ||--o{ Integration : "has (companyId)"
    Company ||--o{ Schedule : "has (companyId)"
    Company ||--o{ Client : "has (companyId)"
    Company ||--o{ Professional : "has (companyId)"
    Subscription ||--o{ SubscriptionPayment : "has"
```

### Regras de Scoping
| Entidade | Chave de Isolamento | Descrição |
|---|---|---|
| `Subscription` | `userId` | Plano pertence ao usuário, não à empresa |
| `Company` | `ownerId` (userId) | Cada user pode ter até 3 companies (PRO) |
| `CompanyConfig` | `companyId` | Config operacional por empresa |
| `Integration` | `companyId` + `provider` | Tokens OAuth por empresa/provedor |
| `Schedule` | `companyId` | Agendamentos isolados por empresa |
| `Client` | `companyId` | Base de clientes por empresa |
| `Professional` | `companyId` | Profissionais da empresa com horários de trabalho |

---

## 3. Injeção de Dependências & Lazy Loading (Factory)

Para evitar erros de inicialização (como o famoso "No metadata for [Entity] was found"), utilizamos um padrão de **Lazy Loading Factory** em `src/infra/factory/factory.ts`.

1. **Singleton Adapters**: Adaptadores que não dependem do banco (ex: Fastify, Google, Evolution) são instanciados imediatamente.
2. **Lazy Accessors**: Repositórios e Use Cases que dependem do TypeORM são encapsulados em funções (getters). 
3. **Delayed Instantiation**: O Repositório só é criado (`new Repository()`) no momento em que é acessado pela primeira vez, garantindo que o `AppDataSource` já esteja inicializado.
4. **Circular Dependency Proof**: O uso de funções para acesso permite que a `factory` resolva dependências sem problemas de ordem de definição.

---

## 4. Fluxo de Inicialização (Bootstrap)

O ciclo de vida da aplicação segue uma sequência rigorosa em `src/bootstrap.ts`:

1. **Database Initialize**: `await AppDataSource.initialize()` é chamado primeiro.
2. **Adapter Setup**: `await adapter.setup()` configura o Fastify, Swagger, JWT e CORS.
3. **Controller Registration**: Os controladores são instanciados via `factory`, o que registra todas as rotas no Fastify.
4. **Worker Initialization**: Os workers do BullMQ são iniciados.
5. **Listen**: O servidor começa a ouvir requisições.

---

## 5. Sincronização do Banco de Dados (Schema Sync)

O projeto **NÃO** utiliza arquivos de migration. A evolução do banco de dados é feita através da sincronização direta das Entidades do TypeORM.

- **Sincronização Local**: Use `npm run schema:sync` para atualizar o esquema do banco de dados local com as mudanças feitas nas entidades.
- **Visualização de Alterações**: Use `npm run schema:diff` para gerar o log do SQL que seria executado, permitindo validar as mudanças antes de sincronizar.
- **Ambiente de Produção**: As alterações no banco são aplicadas manualmente ou via scripts de deploy utilizando os mesmos comandos de sincronização de schema.

---

## 6. API Routing & Middleware

- **Prefixo de Rota**: Todas as rotas de API são automaticamente prefixadas com `/api` pelo `FastifyAdapter`.
- **Autenticação**: 
    - `addRoute`: Rota pública.
    - `addProtectedRoute`: Rota que exige cabeçalho `Authorization: Bearer <JWT>`.
- **Middleware de Assinatura**: Algumas rotas protegem recursos PRO através do `subscriptionMiddleware`, que verifica o status do usuário no banco.

---

## Documentos Relacionados
- [Tech Stack](./tech-stack.md)
- [Regras de Negócio](./business-rules.md)
- [Testes e Qualidade](./testing.md)
- [Recursos Compartilhados](../shared.md)
