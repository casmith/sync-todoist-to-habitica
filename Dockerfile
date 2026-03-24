FROM node:24.4.1-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

CMD [ "node", "index.js" ]
