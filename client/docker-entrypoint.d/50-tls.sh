#!/bin/sh
# Runs after the nginx image's envsubst step (20-envsubst-on-templates.sh), so
# the HTTP and HTTPS server blocks are already rendered into /etc/nginx/conf.d.
# Turns TLS on or off from the ENABLE_TLS flag: generate a self-signed cert and
# redirect HTTP to HTTPS, or drop the HTTPS block entirely.
set -e

CERT_DIR=/etc/nginx/certs
HTTPS_PORT="${CLIENT_HTTPS_PORT:-8443}"

if [ "$ENABLE_TLS" != "1" ]; then
    # TLS off (the default, and how Railway runs — it terminates TLS at its
    # edge and forwards plain HTTP). Drop the HTTPS block so nginx never looks
    # for a certificate, and leave the plain-HTTP block serving the app.
    rm -f /etc/nginx/conf.d/tls.conf
    exit 0
fi

# Generate a self-signed cert on first boot unless one is already mounted
# (e.g. an mkcert cert bind-mounted at /etc/nginx/certs to skip the browser
# warning). SANs cover both localhost and 127.0.0.1.
if [ ! -f "$CERT_DIR/server.crt" ]; then
    mkdir -p "$CERT_DIR"
    openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
        -keyout "$CERT_DIR/server.key" \
        -out "$CERT_DIR/server.crt" \
        -subj "/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
fi

# With TLS on, the plain-HTTP block becomes a redirect to the HTTPS origin so
# http://localhost:8080 still lands on the app. $host and $request_uri stay
# literal for nginx; only the host-visible HTTPS port is filled in here.
cat > /etc/nginx/conf.d/default.conf <<EOF
server {
    listen 8080;
    server_name localhost;
    return 301 https://\$host:${HTTPS_PORT}\$request_uri;
}
EOF
