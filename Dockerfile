FROM satantime/puppeteer-node:18.15-buster AS base

RUN corepack enable
WORKDIR /app

COPY . .
RUN pnpm install
ENV NODE_ENV production

CMD [ "pnpm", "start" ]