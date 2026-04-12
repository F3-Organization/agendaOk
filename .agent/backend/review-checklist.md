# Revisão Pós-Implementação (Bug Hunt & Refactoring)

Este checklist deve ser seguido obrigatoriamente após a conclusão de qualquer tarefa, Use Case ou componente de infraestrutura. O objetivo é garantir que o código entregue seja resiliente, limpo e livre de erros óbvios.

## 🔍 Checklist de Revisão

### 1. Robustez e Lógica (Bug Hunt)
- [ ] **Caminhos Alternativos:** A lógica trata casos onde os dados não são encontrados?
- [ ] **Valores Nulos/Undefined:** Variáveis opcionais são verificadas antes do acesso em ambientes com `strict: true`?
- [ ] **Edge Cases:** O que acontece se a API externa (Google/Evolution) retornar um erro 500 ou timeout?
- [ ] **Idempotência:** Rodar a mesma operação duas vezes causa efeitos colaterais indesejados (ex: duplicar registros)?

### 2. Tratamento de Exceções
- [ ] **Try/Catch Semântico:** Todos os erros são capturados e transformados em `AppError` com status code adequado?
- [ ] **Logs:** Erros críticos são logados no console/serviço de log para debug futuro?

### 3. Qualidade de Código e SOLID
- [ ] **Aderência ao SOLID:** Alguma classe está assumindo responsabilidades demais? (Single Responsibility)
- [ ] **Clean Code:** Os nomes de variáveis e funções são autoexplicativos sem necessidade de comentários?
- [ ] **Comentários:** Foram removidos todos os comentários que explicam "o que" o código faz?

### 4. Performance e Limpeza
- [ ] **Queries Redundantes:** Há chamadas ao banco de dados dentro de loops que poderiam ser otimizadas?
- [ ] **Imports e Dead Code:** Imports não utilizados e variáveis órfãs foram removidos?
- [ ] **Logs de Debug:** `console.log` usados durante o desenvolvimento foram limpos?

### 5. Integração de APIs (SaaS/Pagamento)
- [ ] **Documentação:** A implementação SEGUE RIGOROSAMENTE a documentação oficial da versão utilizada (v1, v2, etc.).
- [ ] **Revision First:** Antes de finalizar, revise todos os endpoints e payloads afetados.
- [ ] **Valores Monetários:** Valores estão em centavos conforme padrão de gateways?
- [ ] **Webhooks:** O payload do webhook coincide com os DTOs do Use Case?

### 5. Banco de Dados e Migrations
- [ ] **Tipagem:** A entidade está devidamente registrada no `AppDataSource` em `src/infra/config/data-source.ts`?

---

> [!IMPORTANT]
> **NUNCA** finalize uma tarefa que envolva persistência sem antes passar por este checklist. A integridade do banco de dados do AgendaOk e a capacidade de deploy via CI/CD dependem de migrations consistentes.
