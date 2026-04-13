// src/lib/zip-generator.ts
import JSZip from 'jszip';
import { ScannedImage } from '../types';

// Helper untuk meminta Content Script mengambilkan gambar (Bypass 403)
// Ini persis seperti yang ada di pdf-generator.ts
const fetchImageBase64 = (url: string, tabId: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type: 'FETCH_IMAGE_BASE64', payload: { url } }, (response) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (response && response.success) resolve(response.data);
        else reject(new Error(response?.error || 'Unknown error'));
      }
    );
  });
};

export const generateZIP = async (
  images: ScannedImage[], 
  tabId: number, 
  fileName: string,
  onProgress: (current: number, total: number) => void
) => {
  if (images.length === 0) return;

  const zip = new JSZip();
  // Opsional: Buat folder di dalam ZIP agar file tidak berantakan saat diekstrak
  const folder = zip.folder(fileName); 

  if (!folder) throw new Error("Gagal membuat folder ZIP");

  for (let i = 0; i < images.length; i++) {
    const imgData = images[i];
    onProgress(i + 1, images.length);

    try {
      // Ambil Base64 (Contoh format: "data:image/jpeg;base64,/9j/4AAQSkZJRg...")
      const base64DataUrl = await fetchImageBase64(imgData.url, tabId);
      
      // JSZip hanya butuh data mentahnya, jadi kita buang awalan "data:image/...;base64,"
      const base64Content = base64DataUrl.split(',')[1];
      
      // Tentukan ekstensi file. Jika 'unknown', fallback ke 'jpg' (karena diconvert lewat canvas)
      const ext = imgData.format !== 'unknown' ? imgData.format : 'jpg';
      
      // Buat nama file rapi dengan padding angka (contoh: image_01.jpg, image_02.jpg)
      const padLength = String(images.length).length;
      const fileNum = String(i + 1).padStart(padLength, '0');
      const fileName = `image_${fileNum}.${ext}`;

      // Masukkan ke dalam ZIP
      folder.file(fileName, base64Content, { base64: true });
    } catch (error) {
      console.error(`Skip image (Gagal ZIP): ${imgData.url}`, error);
    }
  }

  // Generate file ZIP dan buat link download
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipUrl = URL.createObjectURL(zipBlob);
  
  // Trigger download otomatis
  const a = document.createElement('a');
  a.href = zipUrl;
  a.download = `${fileName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(zipUrl); // Bersihkan memori
};