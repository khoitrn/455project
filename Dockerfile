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

EXPOSE 3443

CMD ["node", "src/server.js"]
