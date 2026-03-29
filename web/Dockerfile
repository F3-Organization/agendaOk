# Stage Dev: Para desenvolvimento rápido via Compose
FROM node:20-alpine AS dev
WORKDIR /app

# No Monorepo, o contexto de build é a raiz. Copiamos o que é necessário.
COPY web/package*.json ./
RUN npm install

# Copiar web e shared explicitamente
COPY web/ ./
COPY shared/ ../shared/

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Stage 1: Build para produção
FROM node:20-alpine AS build
WORKDIR /app

COPY web/package*.json ./
RUN npm install

COPY web/ ./
COPY shared/ ../shared/

RUN npm run build

# Stage 2: Serve with Nginx for production feel
FROM nginx:stable-alpine AS prod
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
