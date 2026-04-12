# Docker Setup & Containerization - ConfirmaZap

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

- **api**: A aplicação Node.js (ConfirmaZap). Depende de `database` e `redis`.
- **database**: PostgreSQL (v16). Gerencia dois bancos de dados: `confirmazap` (app) e `evolution` (WhatsApp).
- **redis**: Cache e Message Broker para BullMQ e Evolution API.
- **evolution-api**: Gateway de WhatsApp (v2.x).

### Inicialização do Banco de Dados

Como a imagem padrão do PostgreSQL cria apenas um banco, adicionamos um script em `./docker/db/create-multiple-databases.sh` que é montado em `/docker-entrypoint-initdb.d/`. Ele garante a criação automática do banco `evolution` na primeira execução.

> [!WARNING]
> Se você já rodou o contêiner `database` antes desse ajuste, precisará deletar o volume (`docker compose down -v`) ou criar o banco `evolution` manualmente para que a Evolution API consiga se conectar.

### Como Rodar:

**Desenvolvimento:**
```bash
docker compose up --build
```

A Evolution API estará acessível externamente em `http://localhost:8080`. Internamente (para a `api`), use `http://evolution-api:8080`.

## 3. Variáveis de Ambiente e Rede

As variáveis foram atualizadas para o padrão Evolution v2:
- `DATABASE_PROVIDER=postgresql`
- `EVO_SERVER_URL`: Define o domínio base da API.
- `EVO_DATABASE_NAME`: Define o banco separado para o Prisma da Evolution.


---

> [!TIP]
> **Logs:** Para visualizar apenas os logs da API em tempo real:
> `docker compose logs -f api`
