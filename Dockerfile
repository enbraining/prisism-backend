FROM node:18

RUN mkdir -p /var/app

WORKDIR /var/app

COPY . .

RUN npm install

RUN npm run build

EXPOSE 3001 3030

CMD [ "npm", "run", "start" ]