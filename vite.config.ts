import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => ({
  plugins: [react(), viteSingleFile()],
  base: mode === 'mobile' ? './' : '/portuguese-flashcards/',
}));
