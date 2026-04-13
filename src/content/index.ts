// src/content/index.ts
import { ScannedImage } from '../types';
import { processImage } from './scanner';
import { getAllImageCandidates } from './dom-utils';

const seenUrls = new Set<string>();
let isScanning = false;
let scanTimeout: ReturnType<typeof setTimeout>;

const performScan = async () => {
  if (isScanning) return;
  isScanning = true;

  try {
    const candidates = getAllImageCandidates();
    
    const newCandidates = candidates.filter(url => !seenUrls.has(url));

    if (newCandidates.length === 0) {
      isScanning = false;
      return;
    }

    newCandidates.forEach(url => seenUrls.add(url));

    const results = await Promise.allSettled(
      newCandidates.map(url => processImage(url))
    );

    const validImages: ScannedImage[] = results
      .filter((res): res is PromiseFulfilledResult<ScannedImage | null> => res.status === 'fulfilled')
      .map(res => res.value)
      .filter((img): img is ScannedImage => img !== null);

    if (validImages.length > 0) {
      try {
        chrome.runtime.sendMessage({
          type: 'IMAGES_FOUND',
          payload: validImages
        }, () => {
          if (chrome.runtime.lastError) {
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

const observer = new MutationObserver(() => {
  clearTimeout(scanTimeout);
  scanTimeout = setTimeout(performScan, 500);
});

const startMonitoring = () => {
  performScan();

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'style', 'srcset']
  });
};

export const _stopMonitoring = () => {
  observer.disconnect();
  clearTimeout(scanTimeout);
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'alive' });
  } 
  else if (message.type === 'FORCE_RESCAN') {
    seenUrls.clear(); 
    performScan();
    sendResponse({ status: 'scanning_started' });
  }
  
  else if (message.type === 'FETCH_IMAGE_BASE64') {
    const { url } = message.payload;
    
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(blob);
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          }

          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          
          URL.revokeObjectURL(objectUrl);
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

    return true;
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startMonitoring);
} else {
  startMonitoring();
}