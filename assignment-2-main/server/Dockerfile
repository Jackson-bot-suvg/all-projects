ARG NODE_VERSION=18.17.0
FROM node:${NODE_VERSION}-alpine
WORKDIR /app
COPY package*.json ./

# We acknowledge the use of Perplexity AI to generate the next line to fix the package installation process:
RUN apk add --no-cache make gcc g++ python3

RUN npm install
COPY . .
CMD ["npm", "run", "dev"]