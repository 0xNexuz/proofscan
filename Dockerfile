FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/proofscan/package.json packages/proofscan/package.json
RUN pnpm install --frozen-lockfile --prod=false
COPY apps/api apps/api
COPY packages/contracts packages/contracts
COPY packages/proofscan packages/proofscan
RUN pnpm --filter @proofscan/contracts build && pnpm --filter @proofscan/core build && pnpm --filter @proofscan/api build
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/packages ./packages
EXPOSE 3000
CMD ["node","apps/api/dist/index.js"]
