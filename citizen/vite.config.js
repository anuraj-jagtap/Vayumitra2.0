import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-mocks',
      configureServer(server) {
        server.middlewares.use('/mocks', (req, res, next) => {
          // Serve from ../mocks
          const mockPath = path.resolve(__dirname, '../mocks', req.url.slice(1));
          if (fs.existsSync(mockPath) && fs.statSync(mockPath).isFile()) {
            res.setHeader('Content-Type', 'application/json');
            res.end(fs.readFileSync(mockPath));
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    port: 5174,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    port: 5174,
    strictPort: true,
    allowedHosts: true,
  }
});
