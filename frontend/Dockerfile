# Use Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all frontend code
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Run Vite dev server (for development)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]