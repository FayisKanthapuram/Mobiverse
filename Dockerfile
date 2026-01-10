# 1. Small & fast Node image
FROM node:20-alpine

# 2. Inside-container working folder
WORKDIR /

# 3. Copy dependency files first (for caching)
COPY package*.json ./

# 4. Install dependencies 
RUN npm ci

# 5. Copy rest of the source code
COPY . .

# 6. App port
EXPOSE 3000

# 7. Start app 
CMD ["node", "main.js"]
