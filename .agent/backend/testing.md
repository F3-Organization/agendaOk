[🏠 Voltar ao Contexto](../CONTEXT.md)

# Guia de Testes - ConfirmaZap

Este documento estabelece os padrões e estratégias de testes para o projeto ConfirmaZap, garantindo a confiabilidade dos fluxos de sincronização e notificações.

## 🧪 Estratégia de Testes

Seguimos a pirâmide de testes clássica, priorizando testes de unidade para a lógica de negócio e testes de integração para as bordas do sistema.

---

### 1. Testes de Unidade (`src/usecase`)
**Foco:** Validar as regras de negócio isoladamente.
- **Mocks:** DEVE-SE usar mocks para todas as dependências externas (Reposítórios, Adapters).
- **Abstração:** Utilize as Interfaces (Ports) para criar os mocks.
- **Exemplo:** Garantir que o `SyncCalendarUseCase` calcula a expiração do token corretamente sem bater no banco real.

### 2. Testes de Integração (`src/infra/database`)
**Foco:** Validar a persistência e consultas ao banco de dados.
- **Ambiente:** Devem rodar contra uma instância real do PostgreSQL (preferencialmente um container de teste separado).
- **Limpeza:** O banco deve ser limpo entre cada execução de teste.
- **Exemplo:** Verificar se o `ScheduleRepository` salva e recupera eventos corretamente respeitando as constraints.

### 3. Testes de API / E2E (`src/infra/http`)
**Foco:** Validar o fluxo completo de uma requisição HTTP.
- **Ferramenta:** Usar o `inject()` do Fastify para simular requisições sem subir o servidor real.
- **Dependências Externas:** As APIs externas (Google/Evolution) devem ser simuladas (Mocks globais ou MSW).
- **Exemplo:** Chamar a rota de Auth e verificar se o redirecionamento ocorre conforme o esperado.

---

## 🛠️ Stack Recomendada (Sugestão)

Para manter o projeto pragmático e rápido, recomendamos a seguinte stack de testes:
- **Test Runner:** [Vitest](https://vitest.dev/) (Suporte nativo a TS e extremamente rápido).
- **Mocks:** Built-in do Vitest ou bibliotecas leves.
- **Database Testing:** Usar `testcontainers` (opcional) ou um script de `setup/teardown` simples no Docker Compose.

---

## 🚦 Regras de Execução

- **Implementação Segue o Teste:** Os testes devem ser criados ou atualizados IMEDIATAMENTE após qualquer implementação de funcionalidade ou correção de bug.
- **Sucesso Obrigatório:** Todos os testes (Unidade, Integração e E2E) devem rodar com **100% de sucesso** após qualquer alteração no código. Nenhuma tarefa é considerada concluída se houver um único teste falhando.
- **Nomes de Arquivo:** `{nome}.spec.ts` para unidade e `{nome}.test.ts` para integração/e2e.
- **Localização:** Idealmente ao lado do arquivo sendo testado ou em uma pasta `__tests__` paralela.
- **Verificação Local:** O desenvolvedor deve rodar a suite completa localmente antes de solicitar qualquer revisão ou realizar push.

---

> [!TIP]
> **Definição de Pronto:** Uma funcionalidade só é considerada "Pronta" se possuir cobertura mínima de testes de unidade para os seus Use Cases principais.

---

## Documentos Relacionados
- [Arquitetura](./architecture.md)
- [Padrões de Código](./code-style.md)
- [Checklist de Revisão](./review-checklist.md)

