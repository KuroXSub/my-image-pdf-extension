// src/i18n/translations.ts

export type Language = 'id' | 'en';

export const t = {
  id: {
    title: "Image Grasper",
    total: "Total:",
    clearList: "Bersihkan Daftar",
    filterDisplay: "Filter Tampilan",
    layoutSize: "Layout Ukuran:",
    fileType: "Tipe File:",
    noFormat: "Belum ada format terdeteksi",
    saveFilter: "Simpan Pengaturan Filter Ini",
    noImages: "Tidak ada gambar sesuai filter.",
    hotlinkWarning: "Website ini memblokir akses gambar langsung (hotlink protection). Gunakan tombol Unduh Terpisah.",
    fileNameLabel: "Nama File / Folder:",
    placeholderName: "Masukkan nama folder...",
    selectAll: "Pilih Tampil",
    selected: "terpilih",
    btnNative: "Terpisah",
    btnNativeTitle: "Unduh satu per satu secara langsung",
    processing: "Memproses",
    scanLoading: "Memindai gambar...",
    errorPdf: "Gagal membuat PDF",
    errorZip: "Gagal membuat ZIP"
  },
  en: {
    title: "Image Grasper",
    total: "Total:",
    clearList: "Clear List",
    filterDisplay: "Display Filter",
    layoutSize: "Layout Size:",
    fileType: "File Type:",
    noFormat: "No format detected",
    saveFilter: "Save Filter Settings",
    noImages: "No images match the filter.",
    hotlinkWarning: "This website blocks direct image access (hotlink protection). Use the Separate Download button.",
    fileNameLabel: "File / Folder Name:",
    placeholderName: "Enter folder name...",
    selectAll: "Select Visible",
    selected: "selected",
    btnNative: "Separate",
    btnNativeTitle: "Download one by one directly",
    processing: "Processing",
    scanLoading: "Scanning images...",
    errorPdf: "Failed to create PDF",
    errorZip: "Failed to create ZIP"
  }
};