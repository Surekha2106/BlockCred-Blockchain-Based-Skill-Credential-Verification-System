# Base image
FROM node:18-slim

# Create app directory
WORKDIR /app

# Copy package files (from gateway folder in context)
COPY gateway/package*.json ./

# Install dependencies
RUN npm install

# Copy gateway source
COPY gateway/ .

# Copy frontend source (to sibling folder relative to /app)
COPY frontend/ ../frontend

# Set Environment Variables
ENV PORT=5000
ENV JAVA_BACKEND_URL=http://backend:8081/api

EXPOSE 5000

CMD ["npm", "start"]
