# FE/uniknowledge-app/Dockerfile

# Stage 1: Build Image
FROM node:20-alpine AS build
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy everything else and build the production version
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve Image (Nginx)
FROM nginx:alpine
# Copy the custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the static assets from the build stage
# Note: Angular 17+ uses `browser` subfolder under `dist`
COPY --from=build /app/dist/uniknowledge-app/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Command to start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
