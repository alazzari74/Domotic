FROM node:10

#RUN mkdir -p /home/app/node_modules && /home/node/app

WORKDIR /app

COPY package*.json /app/

RUN npm install

COPY . /app/

CMD  node server.js

EXPOSE 80

