FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl ca-certificates libc6-compat
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
