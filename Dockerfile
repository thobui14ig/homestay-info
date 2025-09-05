# Stage 1: build
FROM node:20 AS builder
WORKDIR /usr/src/app

COPY package*.json ./
# Cài đủ cả dependencies và devDependencies để build được
RUN npm install --legacy-peer-deps --include=dev

COPY . .
RUN npm run build

# Stage 2: run
FROM node:20
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 1000
CMD ["node", "dist/main.js"]
