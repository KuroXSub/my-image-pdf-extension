// // src/lib/page-scanner.ts
// import { ScannedImage, ImageLayout } from '../types';

// // Filter iklan (copy dari ad-filters.ts)
// const AD_KEYWORDS = [
//   'doubleclick', 'googlead', 'ads.', 'adservice',
//   'banner', 'promo', 'sponsor', 'pixel', 'tracker',
//   'facebook.com/tr', 'analytics'
// ];
// const KNOWN_AD_SIZES = [
//   [300, 250], [728, 90], [160, 600], [320, 50],
//   [970, 250], [336, 280], [300, 600]
// ];

// const isAdOrUseless = (url: string, width: number, height: number): boolean => {
//   const lowerUrl = url.toLowerCase();
//   if (AD_KEYWORDS.some(keyword => lowerUrl.includes(keyword))) return true;
//   if (width < 150 || height < 150) return true;
//   const tolerance = 5;
//   if (KNOWN_AD_SIZES.some(([adW, adH]) => 
//     Math.abs(width - adW) <= tolerance && Math.abs(height - adH) <= tolerance
//   )) return true;
//   const ratio = width / height;
//   if (ratio > 5 || ratio < 0.2) return true;
//   return false;
// };

// // Generate ID unik dari URL
// const generateStableId = (url: string) => btoa(url).replace(/[^a-zA-Z0-9]/g, '');

// // Proses satu URL → ScannedImage atau null
// const processImage = (url: string): Promise<ScannedImage | null> => {
//   return new Promise((resolve) => {
//     const img = new Image();
//     img.crossOrigin = 'anonymous'; // penting untuk canvas nanti
//     img.src = url;

//     img.onload = () => {
//       const w = img.naturalWidth;
//       const h = img.naturalHeight;

//       if (isAdOrUseless(url, w, h)) {
//         resolve(null);
//         return;
//       }

//       const ratio = w / h;
//       let layout: ImageLayout = 'square';
//       if (ratio > 1.2) layout = 'wide';
//       else if (ratio < 0.8) layout = 'tall';

//       resolve({
//         id: generateStableId(url),
//         url,
//         width: w,
//         height: h,
//         format: (url.split('.').pop()?.split('?')[0] || 'jpg').toLowerCase(),
//         layout,
//       });
//     };

//     img.onerror = () => resolve(null);
//   });
// };

// // MAIN FUNCTION – akan dipanggil dari side panel
// export const scanCurrentPage = async (): Promise<ScannedImage[]> => {
//   // 1. Kumpulkan semua URL kandidat
//   const candidates = new Set<string>();

//   // <img>
//   document.querySelectorAll('img').forEach(img => {
//     if (img.src) candidates.add(img.src);
//   });

//   // background-image
//   document.querySelectorAll('*').forEach(el => {
//     const bg = window.getComputedStyle(el).backgroundImage;
//     if (bg && bg !== 'none' && bg.startsWith('url(')) {
//       const url = bg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
//       candidates.add(url);
//     }
//   });

//   // <a href> gambar
//   document.querySelectorAll('a[href]').forEach(a => {
//     const href = (a as HTMLAnchorElement).href;
//     if (/\.(jpg|jpeg|png|webp|gif|avif)$/i.test(href)) {
//       candidates.add(href);
//     }
//   });

//   // 2. Proses semua URL secara parallel, filter null
//   const results = await Promise.allSettled(
//     Array.from(candidates).map(url => processImage(url))
//   );

//   const validImages = results
//     .filter((r): r is PromiseFulfilledResult<ScannedImage | null> => r.status === 'fulfilled')
//     .map(r => r.value)
//     .filter((img): img is ScannedImage => img !== null);

//   // 3. Deduplikasi berdasarkan id
//   const uniqueMap = new Map<string, ScannedImage>();
//   validImages.forEach(img => uniqueMap.set(img.id, img));

//   return Array.from(uniqueMap.values());
// };