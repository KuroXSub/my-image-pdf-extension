// src/store/useImageStore.ts
import { create } from 'zustand';
import { ScannedImage } from '../types';
import { Language } from '../i18n/translations';

interface ImageStore {
  images: ScannedImage[];
  selectedIds: Set<string>;
  hasCorsIssue: boolean;
  language: Language; // STATE BAHASA
  
  addUniqueImages: (newImages: ScannedImage[]) => void;
  toggleSelection: (id: string) => void;
  toggleSelectAll: (select: boolean, filteredImages: ScannedImage[]) => void;
  clearImages: () => void;
  setCorsIssue: (status: boolean) => void;
  setLanguage: (lang: Language) => void; // ACTION BAHASA
}

export const useImageStore = create<ImageStore>((set) => ({
  images: [],
  selectedIds: new Set(),
  hasCorsIssue: false,
  language: 'id',

  setLanguage: (lang) => set({ language: lang }),
  setCorsIssue: (status) => set({ hasCorsIssue: status }),

  addUniqueImages: (newImages) => set((state) => {
    const existingIds = new Set(state.images.map(img => img.id));
    const uniqueIncoming = Array.from(new Map(newImages.map(img => [img.id, img])).values());
    const uniqueNewImages = uniqueIncoming.filter(img => !existingIds.has(img.id));
    if (uniqueNewImages.length === 0) return state;
    return { images: [...state.images, ...uniqueNewImages] };
  }),

  toggleSelection: (id) => set((state) => {
    const newSelected = new Set(state.selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    return { selectedIds: newSelected };
  }),

  toggleSelectAll: (select, filteredImages) => set((state) => {
    const newSelected = new Set(state.selectedIds);
    filteredImages.forEach(img => select ? newSelected.add(img.id) : newSelected.delete(img.id));
    return { selectedIds: newSelected };
  }),

  clearImages: () => set({ images: [], selectedIds: new Set(), hasCorsIssue: false })
}));