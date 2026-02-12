FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY src ./src

RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]
