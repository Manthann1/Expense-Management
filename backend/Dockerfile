FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i

COPY src ./src
COPY .env.example ./.env

EXPOSE 3000
CMD ["npm", "start"]
