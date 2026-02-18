// src/content/scanner.ts
import { isAdOrUseless } from './ad-filters';
import { ScannedImage } from '../types';

export const collectImageUrls = (): string[] => {
  const urls = new Set<string>();

  // 1. Ambil dari tag <img>
  document.querySelectorAll('img').forEach(img => {
    if (img.src) urls.add(img.src);
  });

  // 2. Ambil dari CSS Background Image
  document.querySelectorAll('*').forEach(el => {
    const bgImg = window.getComputedStyle(el).backgroundImage;
    if (bgImg && bgImg !== 'none' && bgImg.includes('url')) {
      const cleanUrl = bgImg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
      urls.add(cleanUrl);
    }
  });

  // 3. Ambil dari link <a> yang mengarah ke file gambar
  document.querySelectorAll('a').forEach(a => {
    if (a.href.match(/\.(jpg|jpeg|png|webp|avif|gif)$/i)) {
      urls.add(a.href);
    }
  });

  return Array.from(urls);
};

export const processImage = (url: string): Promise<ScannedImage | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;

    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      // --- INTEGRASI FILTER DISINI ---
      if (isAdOrUseless(url, w, h)) {
        console.log(`Blocked Ad/Small Image: ${url}`);
        resolve(null);
        return; 
      }
      // -------------------------------

      const ratio = w / h;
      let layout = 'square';
      if (ratio > 1.2) layout = 'wide';
      else if (ratio < 0.8) layout = 'tall';

      const generateStableId = (url: string) => {
        return btoa(url).replace(/[^a-zA-Z0-9]/g, '');
      };

      // --- PERBAIKAN FORMAT (MENCEGAH UUID MUNCUL DI FILTER) ---
      let ext = url.split('.').pop()?.split(/[?#]/)[0]?.toLowerCase() || 'unknown';
      const validFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'];
      
      // Jika ekstensi tidak dikenali (seperti UUID), paksa menjadi 'unknown'
      if (!validFormats.includes(ext)) {
          ext = 'unknown';
      }

      resolve({
        id: generateStableId(url), 
        url,
        width: w,
        height: h,
        format: ext, // Format yang sudah dibersihkan
        layout: layout as any
      });
    };

    img.onerror = () => resolve(null);
  });
};