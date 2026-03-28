# Docker Setup & Containerization - AgendaOk

Este documento descreve como a aplicação está dockerizada, as etapas do build e como gerenciar o ambiente de contêineres.

## 1. Dockerfile (Multi-stage Build)

O projeto utiliza um `Dockerfile` multi-estágio para otimizar o tamanho da imagem final e separar as dependências de desenvolvimento das de produção.

### Estágios:
1. **base**: Define o ambiente Node.js (Alpine) e copia o `package.json`.
2. **dependencies**: Instala todos os pacotes (`npm ci`).
3. **dev**: Estágio para desenvolvimento. Mapeia a porta 3000 e executa o `npm run dev` com recarregamento automático (via ts-node).
4. **build**: Executa o `npm run build` para gerar os arquivos JavaScript na pasta `dist/`.
5. **prod**: A imagem final de produção. Copia apenas os arquivos compilados (`dist/`) e instala apenas as dependências de produção (`--omit=dev`).

## 2. Orquestração (Compose)

O arquivo `compose.yaml` (ou `docker-compose.yml`) gerencia os serviços necessários:

- **api**: A aplicação Node.js. Depende do banco de dados.
- **database**: Banco de Dados PostgreSQL (v16). Persiste dados no volume `postgres_data`.

### Como Rodar:

**Desenvolvimento (com hot-reload):**
```bash
docker compose up --build
```

**Produção (Imagem otimizada):**
Para rodar a imagem de produção localmente (para testes), você pode usar:
```bash
docker build --target prod -t agendaok-prod .
docker run -p 3000:3000 --env-file .env agendaok-prod
```

## 3. Variáveis de Ambiente

O Docker Compose utiliza o arquivo `.env` da raiz do projeto. Certifique-se de que variáveis como `DB_HOST`, `DB_PORT`, `DB_USER` e `DB_PASSWORD` estejam configuradas para apontar para o serviço `database` definido no compose.

- `DB_HOST=database` (dentro da rede do Docker)
- `DB_PORT=5432`

---

> [!TIP]
> **Logs:** Para visualizar apenas os logs da API em tempo real:
> `docker compose logs -f api`
