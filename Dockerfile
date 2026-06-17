FROM mcr.microsoft.com/playwright:v1.60.0-jammy

# Set up the working directory inside the container
WORKDIR /app

# Copy dependency manifests and install them
COPY package*.json ./

RUN npm ci

COPY . .

# Expose the application port and start the engine
EXPOSE 5000
CMD ["npm", "start"]