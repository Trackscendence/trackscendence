FROM alpine:3.22

ARG SSL_SUBJECT
ENV SSL_SUBJECT=${SSL_SUBJECT}

RUN apk add --no-cache nginx \
	&& mkdir -p /run/nginx /var/www/ft

COPY utils/nginx.conf /etc/nginx/nginx.conf

RUN	apk add openssl

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
