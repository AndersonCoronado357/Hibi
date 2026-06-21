# Imagen oficial pedida por el contrato de acmsy
FROM node:22-bookworm-slim

WORKDIR /app

# Instala dependencias con el flag que pide el contrato
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Build de produccion (Nuxt + Nitro)
COPY . .
RUN npm run build

# Defaults; acmsy puede sobreescribir PORT en runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0
ENV PORT=3000
ENV NITRO_PORT=3000

EXPOSE 3000

# Arranca el servidor compilado, escucha en $PORT / 0.0.0.0
CMD ["npm", "start"]
