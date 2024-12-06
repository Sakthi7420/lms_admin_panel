import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'; // Add this import


export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": "http://localhost:5050",
      "/getcategory": "http://localhost:5050",
      "/deletecategory": "http://localhost:5050",
      "/updatecategory": "http://localhost:5050",
      "/createcourse-category": "http://localhost:5050",
      
      "/createcourse": "http://localhost:5050",
      "/getallcourse": "http://localhost:5050",
      "/updatecourse": "http://localhost:5050",
      "/deletecourse": "http://localhost:5050",

      "/auth/roles": "http://localhost:5050"
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

