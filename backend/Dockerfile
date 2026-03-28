FROM node:20-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate

FROM base AS production
RUN npm run build
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]

FROM base AS development
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
