# Stage Dev: Para desenvolvimento rápido via Compose
FROM node:20-alpine AS dev
WORKDIR /app

# No Monorepo, o contexto de build é a raiz. Copiamos o que é necessário.
COPY frontend/package*.json ./
RUN npm install

# Copiar frontend e shared explicitamente
COPY frontend/ ./
COPY shared/ ../shared/

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Stage 1: Build para produção
FROM node:20-alpine AS build
WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
COPY shared/ ../shared/

RUN npm run build

# Stage 2: Serve with Nginx for production feel
FROM nginx:stable-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
