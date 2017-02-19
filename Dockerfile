FROM node:boron

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Bundle app source
COPY . /app

RUN npm install -d
RUN npm run build

# Add client bundle
RUN mkdir -p /app/public
COPY ./public /app/public

EXPOSE 80
