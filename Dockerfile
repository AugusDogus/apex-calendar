FROM node:18.15.0-alpine AS base

RUN apk add --no-cache libc6-compat curl chromium

RUN curl -L https://unpkg.com/@pnpm/self-installer | node
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile --prod
ENV NODE_ENV production

CMD [ "pnpm", "start" ]