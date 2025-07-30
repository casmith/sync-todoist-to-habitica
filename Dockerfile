FROM node:24.4.1-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

CMD [ "node", "index.js" ]
