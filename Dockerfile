FROM node:24-alpine AS base

RUN mkdir /app

WORKDIR /app

COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json

RUN mkdir -p ./packages/apps/control
RUN mkdir -p ./packages/apps/scribe
RUN mkdir -p ./packages/libs/database
RUN mkdir -p ./packages/libs/utils

COPY ./packages/apps/control/package.json ./packages/apps/control/package.json
COPY ./packages/apps/control/tsconfig.json ./packages/apps/control/tsconfig.json
COPY ./packages/apps/scribe/package.json ./packages/apps/scribe/package.json
COPY ./packages/apps/scribe/tsconfig.json ./packages/apps/scribe/tsconfig.json
COPY ./packages/libs/utils/package.json ./packages/libs/utils/package.json
COPY ./packages/libs/utils/tsconfig.json ./packages/libs/utils/tsconfig.json
COPY ./packages/libs/database/package.json ./packages/libs/database/package.json
COPY ./packages/libs/database/tsconfig.json ./packages/libs/database/tsconfig.json

FROM base AS builder

RUN npm ci

COPY ./tsconfig.base.jsonc ./tsconfig.base.jsonc
COPY ./tsconfig.build.json ./tsconfig.build.json

COPY ./packages/apps/control/src ./packages/apps/control/src
COPY ./packages/apps/scribe/src ./packages/apps/scribe/src
COPY ./packages/libs/utils/src ./packages/libs/utils/src
COPY ./packages/libs/database/src ./packages/libs/database/src

RUN npm run build

FROM base

RUN npm ci --omit=dev

COPY ./packages/apps/control/assets ./packages/apps/control/assets
COPY --from=builder /app/packages/apps/control/dist ./packages/apps/control/dist
COPY --from=builder /app/packages/apps/scribe/dist ./packages/apps/scribe/dist
COPY --from=builder /app/packages/libs/utils/dist ./packages/libs/utils/dist
COPY --from=builder /app/packages/libs/database/dist ./packages/libs/database/dist
