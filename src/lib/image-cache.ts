// // src/lib/image-cache.ts
// const cache = new Map<string, string>();

// export const getImageDataUrl = async (url: string, tabId: number): Promise<string> => {
//   // Kembalikan dari cache jika sudah ada
//   if (cache.has(url)) {
//     return cache.get(url)!;
//   }

//   // Fetch via background
//   return new Promise((resolve, reject) => {
//     chrome.runtime.sendMessage(
//       {
//         type: 'FETCH_IMAGE_BASE64',
//         payload: { url, tabId },
//       },
//       (response) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else if (response?.success) {
//           cache.set(url, response.data); // cache hanya jika sukses
//           resolve(response.data);
//         } else {
//           reject(new Error(response?.error || 'Unknown error'));
//         }
//       }
//     );
//   });
// };

// export const clearImageCache = () => cache.clear();