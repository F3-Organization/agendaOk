[🏠 Voltar ao Contexto](./CONTEXT.md)

# Padrões de Versionamento (Git Flow & Conventional Commits)

Este documento define os padrões de versionamento e fluxo de trabalho de Git para a ConfirmaZap. Estes padrões devem ser seguidos rigorosamente tanto por desenvolvedores humanos quanto por agentes de IA.

## 1. Git Flow (Fluxo de Trabalho)

Utilizamos uma versão simplificada do Git Flow para garantir que o código em produção esteja sempre estável.

### Branches Principais
- **`main`**: Reflete o estado de produção. Apenas merge de `release/*` ou `hotfix/*`.
- **`dev`**: Branch de integração para o desenvolvimento. Todo desenvolvimento começa a partir daqui.

### Branches de Suporte
- **`feature/*`**: Para novas funcionalidades. Criada a partir de `dev`, mergeada de volta para `dev`.
- **`bugfix/*`**: Para correção de bugs em desenvolvimento. Criada a partir de `dev`.
- **`hotfix/*`**: Para correções críticas em produção. Criada a partir de `main`, mergeada em `main` e `dev`.
- **`release/*`**: Para preparação de novos deploys. Criada a partir de `dev`, mergeada em `main` e `dev`.

## 2. Conventional Commits

Todas as mensagens de commit devem seguir a especificação [Conventional Commits](https://www.conventionalcommits.org/).

### Estrutura
```
<tipo>[escopo opcional]: <descrição curta>

[corpo opcional]

[rodapé opcional]
```

### Tipos Permitidos
- **feat**: Uma nova funcionalidade.
- **fix**: Correção de um bug.
- **refactor**: Alteração de código que não corrige bug nem adiciona funcionalidade.
- **docs**: Alterações apenas na documentação.
- **style**: Alterações que não afetam o sentido do código (espaço em branco, formatação, ponto e vírgula, etc).
- **test**: Adição de testes ausentes ou correção de testes existentes.
- **chore**: Atualização de tarefas de build, configurações de pacotes, etc.
- **perf**: Alteração de código que melhora a performance.
- **ci**: Alterações em scripts e arquivos de configuração de CI/CD.

### Regras Adicionais
- Use o imperativo ("add" em vez de "added").
- A descrição curta não deve terminar com ponto final.
- **Breaking Changes:** Se houver uma alteração que quebre a compatibilidade, adicione um `!` após o tipo ou `BREAKING CHANGE:` no rodapé.

## 3. Instruções para o AI Agent

Como um Agente de IA, você **DEVE** seguir estas regras ao realizar tarefas de codificação:

1. **Check de Branch:** Antes de começar, verifique em qual branch você está. Se for uma nova funcionalidade, sugira a criação de uma branch `feature/nome-da-task`.
2. **Commit por Unidade de Trabalho:** Não faça commits gigantescos. Divida o trabalho em commits lógicos seguindo os tipos acima.
3. **Draft de Commit:** Após concluir uma alteração, sempre proponha a mensagem de commit correspondente.
4. **Resumo Visual:** Ao finalizar, utilize commits de `docs:` para atualizar o `.agent/CONTEXT.md` ou outros guias se necessário.
5. **Push Obligatório:** Sempre que concluir uma tarefa de codificação e realizar o commit, realize o `git push` para garantir que o repositório remoto esteja atualizado.

---

## Documentos Relacionados
- [Review Checklist](./backend/review-checklist.md)
- [Padrões de Código](./backend/code-style.md)
- [Documentação do Projeto](./CONTEXT.md)
