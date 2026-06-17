# 1. Update this tag to match your package.json Playwright version (v1.60.0)
FROM mcr.microsoft.com/playwright:v1.60.0-jammy

# Set up the working directory inside the container
WORKDIR /app

# Copy dependency manifests and install them
COPY package*.json ./
# npm ci is perfect for Docker builds
RUN npm ci

# 2. Fix the syntax typo here (ensure it is COPY . .)
COPY . .

# Expose the application port and start the engine
EXPOSE 5000
CMD ["npm", "start"]