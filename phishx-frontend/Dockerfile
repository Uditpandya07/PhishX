FROM node:19-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Run the app
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
