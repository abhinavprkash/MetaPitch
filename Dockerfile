FROM node:20-bookworm

WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci

COPY . .
RUN npm --workspace server run build && npm --workspace frontend run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server/dist/index.js"]
