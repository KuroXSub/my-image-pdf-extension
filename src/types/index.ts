// src/types/index.ts

export type ImageLayout = 'wide' | 'tall' | 'square';

export interface ScannedImage {
  id: string;          // Hash atau URL unik
  url: string;         // URL sumber gambar
  width: number;       // Lebar asli
  height: number;      // Tinggi asli
  format: string;      // jpg, png, webp, dll
  layout: ImageLayout; // Hasil kalkulasi rasio
}