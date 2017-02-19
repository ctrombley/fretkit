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
# RUN npm prune --production

EXPOSE 80
