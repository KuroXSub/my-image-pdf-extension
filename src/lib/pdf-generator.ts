import { jsPDF } from 'jspdf';
import { ScannedImage } from '../types';

// Helper: Minta tolong Content Script ambilkan data gambar (Bypass 403)
const urlToBase64 = (url: string, tabId: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Kirim pesan ke Tab yang aktif
    chrome.tabs.sendMessage(
      tabId,
      { type: 'FETCH_IMAGE_BASE64', payload: { url } },
      (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Unknown error converting image'));
        }
      }
    );
  });
};

export const generatePDF = async (
  images: ScannedImage[], 
  tabId: number, 
  onProgress: (current: number, total: number) => void
) => {
  if (images.length === 0) return;

  const targetWidth = 210; // Lebar identik 210mm
  let doc: jsPDF | null = null;

  for (let i = 0; i < images.length; i++) {
    const imgData = images[i];
    onProgress(i + 1, images.length);

    try {
      const base64 = await urlToBase64(imgData.url, tabId);

      const ratio = targetWidth / imgData.width;
      const pageHeight = imgData.height * ratio;

      // PERBAIKAN: Tentukan orientasi secara dinamis!
      // Jika lebar > tinggi, pakai Landscape ('l'). Jika tidak, Portrait ('p')
      const orientation = targetWidth > pageHeight ? 'l' : 'p';

      if (i === 0) {
        doc = new jsPDF({
          orientation: orientation,
          unit: 'mm',
          format: [targetWidth, pageHeight] 
        });
        doc.addImage(base64, 'JPEG', 0, 0, targetWidth, pageHeight);
      } else {
        // PERBAIKAN: Beritahu addPage tentang orientasi halamannya
        doc!.addPage([targetWidth, pageHeight], orientation);
        doc!.addImage(base64, 'JPEG', 0, 0, targetWidth, pageHeight);
      }
    } catch (error) {
      console.error(`Skip image: ${imgData.url}`, error);
    }
  }

  if (doc) {
    doc.save(`Image_Batch_${new Date().toISOString().slice(0,10)}.pdf`);
  }
};