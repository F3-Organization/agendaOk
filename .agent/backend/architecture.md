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
        - `User`, `Client`, `Schedule`, `UserConfig`.
        - `Subscription`: Dados da assinatura PRO atual.
        - `SubscriptionPayment`: Histórico detalhado de pagamentos e cobranças.
    - **database/repositories/**: Contém as implementações concretas de persistência de dados.
    - **adapters/**: Adaptadores para bibliotecas externas (ex: `FastifyAdapter`, `GoogleCalendarAdapter`, `AbacatePayAdapter`).
    - **controller/**: Porta de entrada para requisições externas (HTTP/REST).
    - **factory/**: **Composition Root**. Centraliza a instanciação e a injeção de dependências.
    - **config/**: Configurações de ambiente, flags de debug e segredos.

---

## 2. Injeção de Dependências & Lazy Loading (Factory)

Para evitar erros de inicialização (como o famoso "No metadata for [Entity] was found"), utilizamos um padrão de **Lazy Loading Factory** em `src/infra/factory/factory.ts`.

1. **Singleton Adapters**: Adaptadores que não dependem do banco (ex: Fastify, Google, Evolution) são instanciados imediatamente.
2. **Lazy Accessors**: Repositórios e Use Cases que dependem do TypeORM são encapsulados em funções (getters). 
3. **Delayed Instantiation**: O Repositório só é criado (`new Repository()`) no momento em que é acessado pela primeira vez, garantindo que o `AppDataSource` já esteja inicializado.
4. **Circular Dependency Proof**: O uso de funções para acesso permite que a `factory` resolva dependências sem problemas de ordem de definição.

---

## 3. Fluxo de Inicialização (Bootstrap)

O ciclo de vida da aplicação segue uma sequência rigorosa em `src/bootstrap.ts`:

1. **Database Initialize**: `await AppDataSource.initialize()` é chamado primeiro.
2. **Adapter Setup**: `await adapter.setup()` configura o Fastify, Swagger, JWT e CORS.
3. **Controller Registration**: Os controladores são instanciados via `factory`, o que registra todas as rotas no Fastify.
4. **Worker Initialization**: Os workers do BullMQ são iniciados.
5. **Listen**: O servidor começa a ouvir requisições.

---

## 4. Sincronização do Banco de Dados (Schema Sync)

O projeto **NÃO** utiliza arquivos de migration. A evolução do banco de dados é feita através da sincronização direta das Entidades do TypeORM.

- **Sincronização Local**: Use `npm run schema:sync` para atualizar o esquema do banco de dados local com as mudanças feitas nas entidades.
- **Visualização de Alterações**: Use `npm run schema:diff` para gerar o log do SQL que seria executado, permitindo validar as mudanças antes de sincronizar.
- **Ambiente de Produção**: As alterações no banco são aplicadas manualmente ou via scripts de deploy utilizando os mesmos comandos de sincronização de schema.

---

## 5. API Routing & Middleware

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
