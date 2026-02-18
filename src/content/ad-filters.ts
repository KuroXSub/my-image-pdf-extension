// src/content/ad-filters.ts

// 1. Daftar kata kunci umum pada URL iklan/tracker
const AD_KEYWORDS = [
  'doubleclick', 'googlead', 'ads.', 'adservice', 
  'banner', 'promo', 'sponsor', 'pixel', 'tracker',
  'facebook.com/tr', 'analytics'
];

// 2. Standar Ukuran Iklan (IAB Standard Ad Units)
// Format: [width, height]
const KNOWN_AD_SIZES = [
  [300, 250], // Medium Rectangle
  [728, 90],  // Leaderboard
  [160, 600], // Wide Skyscraper
  [320, 50],  // Mobile Banner
  [970, 250], // Billboard
  [336, 280], // Large Rectangle
  [300, 600]  // Half Page
];

/**
 * Mengecek apakah gambar adalah iklan atau sampah
 */
export const isAdOrUseless = (url: string, width: number, height: number): boolean => {
  const lowerUrl = url.toLowerCase();

  // A. Filter Berdasarkan URL (String Matching)
  // Jika URL mengandung kata terlarang -> IKLAN
  if (AD_KEYWORDS.some(keyword => lowerUrl.includes(keyword))) {
    return true;
  }

  // B. Filter Berdasarkan Ukuran Minimum (Threshold)
  // Jika gambar terlalu kecil (misal icon medsos atau spacer) -> SAMPAH
  // Kita set minimal 150px (bisa disesuaikan)
  if (width < 150 || height < 150) {
    return true;
  }

  // C. Filter Berdasarkan Rasio/Dimensi Iklan Standar
  // Kita beri toleransi 5 pixel karena kadang styling CSS mengubah ukuran sedikit
  const tolerance = 5;
  
  const isStandardAdSize = KNOWN_AD_SIZES.some(([adW, adH]) => {
    const wMatch = Math.abs(width - adW) <= tolerance;
    const hMatch = Math.abs(height - adH) <= tolerance;
    return wMatch && hMatch;
  });

  if (isStandardAdSize) {
    return true;
  }

  // D. Filter Rasio Ekstrem (Opsional)
  // Membuang gambar yang sangat gepeng (garis) atau sangat kurus
  const ratio = width / height;
  if (ratio > 5 || ratio < 0.2) { 
    return true; // Kemungkinan besar banner atau sidebar background
  }

  return false; // Lolos seleksi (Bukan Iklan)
};