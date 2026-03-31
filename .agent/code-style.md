# Code Style & Pragmatic Architecture Rules

## 1. Regras dos Use Cases e Validação (`src/usecase` & `src/infra/http`)
- **Validação com Zod:** Toda validação de dados de entrada (body, params, query) DEVE ser feita utilizando a biblioteca `zod` na camada do Controller. O Use Case deve receber apenas dados limpos, tipados e validados. Aproveite o `z.infer` para gerar os tipos dos DTOs.
- **O Coração do Sistema:** Como não usamos uma camada de domínio puro, as regras de negócio vivem inteiramente nos Use Cases.
- **Isolamento HTTP:** O Use Case **NÃO** deve conhecer o Fastify (nada de importar `FastifyRequest` ou `FastifyReply`). O Controller extrai os dados, valida com Zod, monta o DTO e passa para o Use Case.
- **Responsabilidade Única:** Cada classe de Use Case deve ter apenas um método público principal (ex: `execute()`).
- **Injeção de Dependências:** O Use Case recebe seus repositórios pelo construtor através de Interfaces (Ports), nunca instanciando implementações concretas internamente.

## 2. Padrões do TypeORM (`src/infra/database`)
- **Uso Direto (Sem Mappers):** Os Use Cases podem importar, instanciar e manipular as Entidades do TypeORM (`@Entity`) diretamente.
- **Localização:** As Entidades devem ficar ESTRITAMENTE dentro de `src/infra/database/entities`.
- **Nomenclatura no Banco:** Usar `snake_case` para tabelas e colunas nativas do Postgres para evitar problemas de aspas duplas em queries manuais. Configure os decorators explicitamente: `@Column({ name: 'user_id' })`.

## 3. Padrões TypeScript e Arquivos
- **Nomenclatura de Arquivos:** Usar `kebab-case` com sufixo do tipo do arquivo. Exemplos: `user.entity.ts`, `create-appointment.usecase.ts`, `auth.controller.ts`, `appointment.repository.ts`.
- **Nomenclatura de Código:** `camelCase` para variáveis e métodos. `PascalCase` para Classes e Interfaces.
- **Tipagem:** PROIBIDO o uso de `any`. Dados externos dinâmicos (como o body do Webhook do WhatsApp) devem ser tipados como `unknown` até passarem pelo parse do `zod`.
- **Tratamento de Erros:** Usar o padrão de Early Return. Criar uma classe `AppError` customizada para padronizar exceções de negócio, contendo a mensagem e o `statusCode` HTTP. O Controller deve capturar erros do Zod (`ZodError`) e formatá-los adequadamente.

## 4. Injeção de Dependências
- Seguir o padrão pragmático documentado em `architecture.md`. 
- Usar a Factory manual em `src/infra/factory/factory.ts` para instanciar repositórios e injetá-los nos Use Cases. 
- Evitar bibliotecas mágicas de injeção de dependência para este MVP. Mantenha a injeção manual para facilitar o rastreio e o debug.

## 5. Princípios de Engenharia e Limpeza
- **SOLID:** O código deve seguir os princípios SOLID para garantir manutenibilidade e escalabilidade.
  - **S**ingle Responsibility: Cada classe/arquivo tem uma única razão para mudar.
  - **O**pen/Closed: Entidades abertas para extensão, fechadas para modificação.
  - **L**iskov Substitution: Subtipos devem ser substituíveis por seus tipos base.
  - **I**nterface Segregation: Interfaces específicas são melhores que uma interface geral.
  - **D**ependency Inversion: Depender de abstrações (Interfaces/Ports), não de implementações.
- **Código Limpo (Clean Code):** O código deve ser autoexplicativo através de nomes semânticos de variáveis, funções e classes.
- **Evitar Duplicação (DRY):** Lógicas redundantes entre Use Cases (ex: verificações de horário, formatação complexa) DEVEM ser extraídas para funções auxiliares (Helpers) em `src/shared/utils` para garantir consistência e diminuir boilerplate.
- **SEM COMENTÁRIOS:** Não deixe comentários no código explicando "o que" ele faz. Se um trecho precisa de explicação, ele deve ser refatorado para ser mais legível. Comentários só são permitidos em casos EXTREMAMENTE raros para explicar o "porquê" de uma decisão técnica obscura ou workaround.

## 6. Segurança e Dados Hardcoded
- **PROIBIDO Placeholder de Produção:** Nunca utilize strings como `"000.000.000-00"`, `"00000000000"`, `"test@test.com"`, ou `"123456"` em código que possa ir para produção. Se um dado é obrigatório mas opcional no cadastro, o Use Case deve validar sua presença e lançar um erro amigável, orientando o usuário a completar o cadastro.
- **Segredos no `.env`:** Chaves de API, senhas e tokens devem estar EXCLUSIVAMENTE em variáveis de ambiente, acessadas via objeto `env` centralizado em `src/infra/config/configs.ts`.
- **Sanitização:** Sempre utilize bibliotecas de validação (Zod) para garantir que dados sensíveis sigam o formato esperado.

---

## 7. Definição de Pronto (Definition of Done)
Após finalizar qualquer implementação, siga obrigatoriamente o **[Checklist de Revisão](file:///home/felipe/Repositories/personal/agendaOk/.agent/review-checklist.md)** para garantir a qualidade, ausência de bugs e aderência aos princípios SOLID.