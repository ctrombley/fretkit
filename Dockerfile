FROM node:12-alpine
RUN apk add --update \
  python \
  build-base

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD [ "npx", "serve" ]
