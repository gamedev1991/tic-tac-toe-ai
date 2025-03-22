FROM node:18-slim

WORKDIR /app

COPY package*.json ./
COPY .npmrc ./

RUN npm install --production

COPY . .

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "start"] 