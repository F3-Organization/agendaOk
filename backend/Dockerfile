FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY backend/package*.json ./

FROM base AS dependencies
RUN npm ci

FROM dependencies AS dev
ENV NODE_ENV=development
ENV NODE_PATH=/usr/src/app/node_modules
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM dependencies AS build
COPY backend/ ./
COPY shared/ ../shared/
RUN ln -sf /usr/src/app/node_modules /usr/src/shared/node_modules
RUN npm run build

FROM base AS prod
ENV NODE_ENV=production
ENV NODE_PATH=/usr/src/app/node_modules

RUN npm ci --omit=dev

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/shared ../shared

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

EXPOSE 3000
CMD ["npm", "start"]