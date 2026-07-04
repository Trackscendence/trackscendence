# Stage 1: Build the React app
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# nginx renders /etc/nginx/templates/*.template with envsubst at container
# start, writing the result to /etc/nginx/conf.d/. BACKEND_HOST/BACKEND_PORT
# default to the Compose service name; override BACKEND_HOST on Railway
# (e.g. server.railway.internal).
COPY default.conf.template /etc/nginx/templates/default.conf.template
# NGINX_ENTRYPOINT_LOCAL_RESOLVERS makes the image populate NGINX_LOCAL_RESOLVERS
# from /etc/resolv.conf, which the template uses for runtime DNS re-resolution.
ENV BACKEND_HOST=server \
    BACKEND_PORT=3001 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1

ARG CLIENT_PORT=8080
EXPOSE ${CLIENT_PORT}

CMD ["nginx", "-g", "daemon off;"]
