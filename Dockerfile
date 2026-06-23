FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ARG NG_APP_API_URL=https://api.staging.365soft.com/
ARG NG_APP_API_TIMEOUT=30000
ARG NG_APP_SENTRY_DSN=
ARG NG_APP_SENTRY_ENV=staging
ARG NG_APP_GEOCODER_URL=https://nominatim.openstreetmap.org/search
ARG NG_APP_GEOCODER_EMAIL=

ENV NG_APP_API_URL=${NG_APP_API_URL}
ENV NG_APP_API_TIMEOUT=${NG_APP_API_TIMEOUT}
ENV NG_APP_SENTRY_DSN=${NG_APP_SENTRY_DSN}
ENV NG_APP_SENTRY_ENV=${NG_APP_SENTRY_ENV}
ENV NG_APP_GEOCODER_URL=${NG_APP_GEOCODER_URL}
ENV NG_APP_GEOCODER_EMAIL=${NG_APP_GEOCODER_EMAIL}

RUN node -e 'const fs=require("node:fs"); const timeout=Number(process.env.NG_APP_API_TIMEOUT); if(Number.isNaN(timeout)){throw new Error("NG_APP_API_TIMEOUT must be numeric");} const content=`export const environment = {\n  production: true,\n  apiUrl: ${JSON.stringify(process.env.NG_APP_API_URL)},\n  apiTimeout: ${timeout},\n  sentryDsn: ${JSON.stringify(process.env.NG_APP_SENTRY_DSN)},\n  sentryEnv: ${JSON.stringify(process.env.NG_APP_SENTRY_ENV)},\n  geocoder: {\n    url: ${JSON.stringify(process.env.NG_APP_GEOCODER_URL)},\n    email: ${JSON.stringify(process.env.NG_APP_GEOCODER_EMAIL)},\n  },\n};\n`; fs.writeFileSync("src/environments/environment.production.ts", content);'

RUN npm run build

FROM nginx:1.29-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/GestionAlquileres_365Soft/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
