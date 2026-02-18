# Image Grasper - Chrome Extension

Ekstensi Chrome untuk mengunduh gambar dari halaman web secara *batch* dan mengonversinya menjadi satu file PDF dengan lebar yang identik (rapi dan tidak terpotong). Dibuat menggunakan React, TypeScript, Tailwind CSS, dan jsPDF.

## Fitur
* 🖼️ Mendeteksi semua gambar di halaman web (termasuk yang di-lazy load).
* 🛡️ Otomatis membuang gambar iklan dan icon-icon kecil.
* 📏 Menyaring gambar berdasarkan layout (Wide, Tall, Square) dan format (JPG, PNG, dll).
* 📄 Mengonversi gambar yang dipilih menjadi PDF berkualitas tinggi (Edge-to-Edge).
* ⚡ Bypass proteksi "Hotlink/403 Forbidden" menggunakan Content Script Proxy.

## Cara Menjalankan untuk Development
1. Clone repository ini.
2. Jalankan `npm install`.
3. Jalankan `npm run dev`.
4. Buka Chrome, masuk ke `chrome://extensions`.
5. Aktifkan **Developer mode** (pojok kanan atas).
6. Klik **Load unpacked** dan pilih folder `dist/` yang dihasilkan oleh perintah build.

## Tech Stack
* Vite + CRXJS (Bundler)
* React + TypeScript
* Tailwind CSS
* Zustand (State Management)
* jsPDF (PDF Engine)