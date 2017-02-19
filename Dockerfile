FROM node:boron

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Bundle app source
COPY . /app

RUN npm install -d
RUN npm run build

EXPOSE 80
