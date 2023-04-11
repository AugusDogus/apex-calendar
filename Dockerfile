FROM node:18.15.0-alpine AS base

RUN apk add --no-cache libc6-compat curl chromium

RUN corepack enable
WORKDIR /app

COPY . .
RUN pnpm install
ENV NODE_ENV production

CMD [ "pnpm", "start" ]