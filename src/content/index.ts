// src/content/index.ts
import { ScannedImage } from '../types';
import { processImage } from './scanner'; // Fungsi yang sudah ada filter iklannya
import { getAllImageCandidates } from './dom-utils';

// State Lokal
const seenUrls = new Set<string>(); // Mencegah duplikat & re-processing
let isScanning = false;
let scanTimeout: ReturnType<typeof setTimeout>;

// Fungsi Utama: Scan & Process
const performScan = async () => {
  if (isScanning) return;
  isScanning = true;

  try {
    // 1. Ambil semua kandidat URL dari DOM
    const candidates = getAllImageCandidates();
    
    // 2. Filter: Hanya ambil yang BELUM pernah dilihat
    const newCandidates = candidates.filter(url => !seenUrls.has(url));

    if (newCandidates.length === 0) {
      isScanning = false;
      return;
    }

    // 3. Tandai sebagai 'seen' agar tidak diproses ulang
    newCandidates.forEach(url => seenUrls.add(url));

    // 4. Proses Metadata & Filter Iklan (Parallel)
    // Kita gunakan Promise.allSettled agar jika satu gagal, yang lain tetap jalan
    const results = await Promise.allSettled(
      newCandidates.map(url => processImage(url))
    );

    // 5. Ambil hasil yang sukses & valid (bukan null)
    const validImages: ScannedImage[] = results
      .filter((res): res is PromiseFulfilledResult<ScannedImage | null> => res.status === 'fulfilled')
      .map(res => res.value)
      .filter((img): img is ScannedImage => img !== null); // Hapus null (iklan/sampah)

    // const uniqueValidImages = Array.from(
    //   new Map(validImages.map(img => [img.id, img])).values()
    // );

// 6. Simpan ke Storage (Solusi Paling Stabil)
    // Daripada kirim pesan langsung, kita simpan datanya di laci (storage).
    // Nanti saat Popup dibuka, Popup yang akan mengambil data dari laci ini.
    if (validImages.length > 0) {
      // Simpan data ke local storage agar Popup bisa membacanya kapan saja
      // chrome.storage.local.set({ 'scannedImages': uniqueValidImages }, () => {
      //   console.log(`[Batch Downloader] Saved ${uniqueValidImages.length} images.`);
      // });

      // Opsional: Tetap kirim pesan untuk update realtime jika popup SEDANG terbuka
      try {
        chrome.runtime.sendMessage({
          type: 'IMAGES_FOUND',
          payload: validImages
        }, (response) => {
          // Abaikan error jika popup tertutup (runtime.lastError)
          if (chrome.runtime.lastError) {
             // Do nothing, ini wajar
          }
        });
      } catch (e) {
        // Ignore connection errors
      }
    }

  } catch (error) {
    console.error('Scan error:', error);
  } finally {
    isScanning = false;
  }
};

// --- AUTOMATION SETUP ---

// 1. Observer: Pantau perubahan DOM (Infinite Scroll)
const observer = new MutationObserver(() => {
  // DEBOUNCE: Tunggu 500ms setelah DOM berhenti berubah, baru scan.
  // Ini mencegah scan berjalan ratusan kali per detik saat scroll.
  clearTimeout(scanTimeout);
  scanTimeout = setTimeout(performScan, 500);
});

// 2. Start Monitoring
const startMonitoring = () => {
  // Scan awal saat halaman baru dibuka
  performScan();

  // Aktifkan mata-mata DOM
  observer.observe(document.body, {
    childList: true,  // Elemen baru ditambahkan
    subtree: true,    // Pantau sampai ke anak-cucu elemen
    attributes: true, // Pantau perubahan atribut (misal src berubah)
    attributeFilter: ['src', 'style', 'srcset'] // Hanya atribut relevan
  });
};

// 3. Stop Monitoring (Cleanup)
const _stopMonitoring = () => {
  observer.disconnect();
  clearTimeout(scanTimeout);
};

// --- MESSAGE LISTENER ---
// Menerima perintah dari Popup (misal: User klik tombol "Rescan")
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'alive' });
  } 
  else if (message.type === 'FORCE_RESCAN') {
    seenUrls.clear(); 
    performScan();
    sendResponse({ status: 'scanning_started' });
  }
  
  // --- FITUR BARU: PROXY DOWNLOADER (SOLUSI ERROR 403) ---
  else if (message.type === 'FETCH_IMAGE_BASE64') {
    const { url } = message.payload;
    
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(blob);
        
        img.onload = () => {
          // Gunakan Canvas untuk mengkonversi ke JPEG
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            // Beri background putih (mencegah PNG transparan jadi hitam)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          }

          // KOMPRESI: Ubah ke format JPEG dengan kualitas 75% (0.75)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          
          URL.revokeObjectURL(objectUrl); // Bersihkan memori
          sendResponse({ success: true, data: dataUrl });
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          sendResponse({ success: false, error: 'Gagal memuat gambar ke Canvas' });
        };
        
        img.src = objectUrl;
      })
      .catch(error => {
        console.error('Gagal fetch gambar via Content Script:', error);
        sendResponse({ success: false, error: error.toString() });
      });

    return true; // Wajib return true untuk async sendResponse
  }
});

// Jalankan saat script dimuat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startMonitoring);
} else {
  startMonitoring();
}