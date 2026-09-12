import{defineConfig}from'vite';
import tailwindcss from'@tailwindcss/vite';

export default defineConfig({
  base:'./',
  plugins:[tailwindcss()],
  build:{
    outDir:'dist',
    emptyOutDir:true,
    assetsDir:'assets',
    rollupOptions:{
      output:{manualChunks:{three:['three'],motion:['motion']}}
    }
  }
});
