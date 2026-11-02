FROM node:24-alpine AS build-stage

ENV HOME=/srv/package

WORKDIR ${HOME}

COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

RUN npm ci

COPY tsconfig.json ./tsconfig.json
COPY src ./src
COPY tools ./tools
COPY .eslintrc ./.eslintrc
COPY .eslintignore ./.eslintignore

RUN npm run build

# Production dependencies only, so the final image carries no build or test tooling.
FROM node:24-alpine AS dependency-stage

ENV HOME=/srv/package

WORKDIR ${HOME}

COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

RUN npm ci --omit=dev

FROM node:24-alpine

LABEL maintainer="Erik Hage <ehage4@gmail.com>" \
      description="Vigilant Harvest Service"

ENV HOME=/srv/package

WORKDIR ${HOME}

COPY --from=dependency-stage ${HOME}/node_modules ./node_modules
COPY --from=build-stage ${HOME}/dist ./dist
COPY package.json ./package.json
COPY ./database.json ${HOME}/
COPY ./migrations ${HOME}/migrations

USER node

EXPOSE 8002

# The start period covers the 20 s wait for the database outside dev, plus the migrations.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \
    CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8002) + '/api/vigilant-harvest-service/v0/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"

# node as PID 1, so that it receives docker stop's SIGTERM itself.
CMD [ "node", "dist/src/server.js" ]
