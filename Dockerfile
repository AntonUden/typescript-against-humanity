FROM node:14

RUN npm install --global typescript

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npm run-script build

EXPOSE 8080

CMD ["npm", "start"]