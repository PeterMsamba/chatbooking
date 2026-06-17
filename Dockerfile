# Use the official Playwright image which comes with Node and all browser prerequisites pre-installed
FROM mcr.microsoft.com/playwright:v1.45.0-jammy

# Set up the working directory inside the container
WORKDIR /app

# Copy dependency manifests and install them
COPY package*.json ./
RUN npm ci

# Copy the rest of your application code (including your public assets folder)
COPY . .

# Expose the application port and start the engine
EXPOSE 5000
CMD ["npm", "start"]