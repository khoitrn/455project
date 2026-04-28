FROM node:24-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

# Generate combined server.pem (key + cert) for HTTPS
RUN openssl req -x509 -newkey rsa:2048 \
      -keyout key.pem -out cert.pem \
      -days 365 -nodes \
      -subj "/CN=455project.khoitrn.com" && \
    cat key.pem cert.pem > server.pem && \
    rm key.pem cert.pem

RUN mkdir -p /app/data

ENV PORT=3443
ENV DB_PATH=/app/data/contacts.db
ENV CERT_PATH=/app/server.pem

# Fix DS-0002: run as non-root user (node user is built into node:alpine)
RUN chown -R node:node /app
USER node

EXPOSE 3443

# Fix DS-0026: health check so Docker can detect an unhealthy container
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3443/health || exit 1

CMD ["node", "src/server.js"]
