# Stage 1: Build the React app
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:stable-alpine

# openssl is needed by 50-tls.sh to generate the self-signed cert (#60); it is
# not in the base image.
RUN apk add --no-cache openssl

COPY --from=build /app/dist /usr/share/nginx/html

# nginx renders /etc/nginx/templates/*.template with envsubst at container
# start, writing the result to /etc/nginx/conf.d/. BACKEND_HOST/BACKEND_PORT
# default to the Compose service name; override BACKEND_HOST on Railway
# (e.g. server.railway.internal). The HTTP (default.conf) and HTTPS (tls.conf)
# blocks share app-locations.inc so their proxy rules can never drift.
COPY default.conf.template tls.conf.template app-locations.inc.template \
    /etc/nginx/templates/
# TLS toggle (#60): 50-tls.sh runs after the envsubst step to generate a
# self-signed cert and redirect HTTP to HTTPS when ENABLE_TLS=1, or drop the
# HTTPS block when it is off. The image runs every /docker-entrypoint.d/*.sh.
COPY docker-entrypoint.d/50-tls.sh /docker-entrypoint.d/50-tls.sh
RUN chmod +x /docker-entrypoint.d/50-tls.sh
# NGINX_ENTRYPOINT_LOCAL_RESOLVERS makes the image populate NGINX_LOCAL_RESOLVERS
# from /etc/resolv.conf, which the template uses for runtime DNS re-resolution.
ENV BACKEND_HOST=server \
    BACKEND_PORT=3001 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1

# Only the HTTP port is EXPOSEd. Railway auto-detects the target port from
# here and serves plain HTTP (ENABLE_TLS is unset there); the HTTPS port is
# published by the compose stack's `ports` mapping, which does not need EXPOSE.
ARG CLIENT_PORT=8080
EXPOSE ${CLIENT_PORT}

CMD ["nginx", "-g", "daemon off;"]
