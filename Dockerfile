FROM node:boron

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /app && cp -a /tmp/node_modules /app/

# Bundle app source
COPY . /app

RUN npm run build

EXPOSE 80
