import { create } from 'zustand';
import { ScannedImage } from '../types';

interface ImageStore {
  images: ScannedImage[];
  selectedIds: Set<string>;
  
  // Actions
  addUniqueImages: (newImages: ScannedImage[]) => void; // Ganti setImages jadi ini
  toggleSelection: (id: string) => void;
  toggleSelectAll: (select: boolean, filteredImages: ScannedImage[]) => void;
  clearImages: () => void; // Fungsi baru untuk reset
}

export const useImageStore = create<ImageStore>((set) => ({
  images: [],
  selectedIds: new Set(),

  // LOGIC BARU: Hanya masukkan gambar jika URL belum ada
    addUniqueImages: (newImages) => set((state) => {
      const existingIds = new Set(state.images.map(img => img.id));

      // 1️⃣ Dedupe within the incoming array itself
      const uniqueIncoming = Array.from(
        new Map(newImages.map(img => [img.id, img])).values()
      );

      // 2️⃣ Filter out already existing IDs
      const uniqueNewImages = uniqueIncoming.filter(img => !existingIds.has(img.id));

      if (uniqueNewImages.length === 0) return state;

      console.log(`[Store] Adding ${uniqueNewImages.length} new images.`);
      return { images: [...state.images, ...uniqueNewImages] };
    }),

  toggleSelection: (id) => set((state) => {
    const newSelected = new Set(state.selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    return { selectedIds: newSelected };
  }),

  // Perbaikan Select All: Hanya select yang sedang TAMPIL (terfilter)
  toggleSelectAll: (select, filteredImages) => set((state) => {
    const newSelected = new Set(state.selectedIds);
    
    filteredImages.forEach(img => {
      if (select) newSelected.add(img.id);
      else newSelected.delete(img.id);
    });
    
    return { selectedIds: newSelected };
  }),

  // Reset bersih saat pindah tab/reload
  clearImages: () => set({ images: [], selectedIds: new Set() })
}));