# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
ENV CI=true

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
COPY .sequelizerc ./
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY tsconfig.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# TẠO USER TRƯỚC
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    # CHỈNH QUYỀN SAU KHI USER ĐÃ TỒN TẠI
    chown -R nestjs:nodejs /app/dist

COPY src/config/sequelize.config.js ./src/config/sequelize.config.js
COPY src/migrations ./src/migrations
COPY .sequelizerc ./
COPY docker/entrypoint.sh ./docker/entrypoint.sh

RUN chmod +x docker/entrypoint.sh

USER nestjs

EXPOSE 8000

ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["node", "dist/src/server.js"]