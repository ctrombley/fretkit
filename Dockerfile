FROM node:boron

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json /app/
RUN npm install -d

# Bundle app source
COPY . /app

RUN npm build

# Add client bundle
RUN mkdir -p /app/public
COPY ./public /app/public

EXPOSE 80
