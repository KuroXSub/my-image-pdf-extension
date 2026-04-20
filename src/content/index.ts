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

    // 1. Cari di DOM (gambar sudah termuat)
    const imgs = Array.from(document.images);
    const found = imgs.find(img => img.src === url);
    
    if (found && found.complete) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = found.naturalWidth;
        canvas.height = found.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(found, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        sendResponse({ success: true, data: dataUrl });
        return true;
      } catch (e) {
        // CORS error, lanjut ke background fetch
        console.log('Canvas CORS, fallback to background fetch');
      }
    }

    // 2. Kirim ke background dengan referer halaman saat ini
    const referer = window.location.href;
    chrome.runtime.sendMessage({
      type: 'FETCH_IMAGE_BACKGROUND',
      payload: { url, referer }
    }, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else if (response?.success) {
        sendResponse({ success: true, data: response.data });
      } else {
        sendResponse({ success: false, error: response?.error || 'Background fetch failed' });
      }
    });
    
    return true; // async
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startMonitoring);
} else {
  startMonitoring();
}