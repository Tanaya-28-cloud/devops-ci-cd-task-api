# Use a small, official Node image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy only package files first (better Docker layer caching —
# npm install only re-runs when dependencies actually change)
COPY package*.json ./

# Install only production dependencies (no jest/nodemon/supertest in the final image)
RUN npm install --omit=dev

# Now copy the rest of the app
COPY src ./src

# The app listens on this port (matches src/index.js default)
EXPOSE 3000

# Run as a non-root user for better security
USER node

CMD ["node", "src/index.js"]
