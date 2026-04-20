[🏠 Voltar ao Contexto](../CONTEXT.md)

# Política de Documentação de API

Para manter o padrão profissional da ConfirmaZap API, toda nova funcionalidade ou alteração de endpoint **DEVE** seguir rigorosamente as regras de documentação descritas abaixo.

## Requisitos Mandatórios

Qualquer chamada ao método `addRoute` no `FastifyAdapter` deve obrigatoriamente incluir o objeto `schema` como quarto argumento.

### 1. Metadados Básicos
Toda rota deve possuir:
- `tags`: Array de strings para agrupar o endpoint no Swagger (ex: `['Auth']`).
- `summary`: Uma frase curta que descreve o objetivo da rota.
- `description`: Explicação detalhada do comportamento da rota.

### 2. Definição de Propriedades
Cada propriedade em `body`, `querystring`, `params` ou `response` deve conter:
- `type`: O tipo de dado (string, number, boolean, object, array).
- `description`: Explicação clara do que o campo representa.
- `example`: Um valor de exemplo realista para facilitar testes.
- `format`: (Se aplicável) ex: `date-time`, `uuid`, `email`.

### 3. Respostas (Responses)
Documente todos os códigos de status possíveis:
- `200` ou `201`: Sucesso.
- `400`: Erros de validação ou lógica de negócio do cliente.
- `401`/`403`: Falhas de autenticação/autorização.
- `500`: Erros inesperados do servidor.

## Exemplo de Documentação Padrão

```typescript
this.fastify.addRoute("POST", "/exemplo", handler, {
    tags: ["Exemplo"],
    summary: "Faz algo importante",
    description: "Descrição detalhada do processo de exemplo.",
    body: {
        type: 'object',
        properties: {
            nome: { type: 'string', description: 'Nome do usuário', example: 'João Silva' }
        },
        required: ['nome']
    },
    response: {
        200: {
            description: 'Operação concluída',
            type: 'object',
            properties: {
                status: { type: 'string', example: 'sucesso' }
            }
        }
    }
});
```

> A conformidade com esta política é essencial para que o Swagger UI permaneça como a "fonte da verdade" e facilite a integração de novos desenvolvedores e parceiros.

---

## Documentos Relacionados
- [Padrões de Código](./code-style.md)
- [Arquitetura](./architecture.md)
- [Contexto Geral](../CONTEXT.md)

