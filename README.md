# Image to PDF Chrome Extension

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/KuroXSub/my-image-pdf-extension?style=for-the-badge)](https://github.com/KuroXSub/my-image-pdf-extension/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/KuroXSub/my-image-pdf-extension?style=for-the-badge)](https://github.com/KuroXSub/my-image-pdf-extension/network)
[![GitHub issues](https://img.shields.io/github/issues/KuroXSub/my-image-pdf-extension?style=for-the-badge)](https://github.com/KuroXSub/my-image-pdf-extension/issues)

</div>

Image Grasper adalah ekstensi Chrome untuk mengunduh gambar dari halaman web secara massal dan mengonversinya menjadi satu file PDF dengan lebar seragam, rapi, dan tidak terpotong. Cocok untuk menyimpan artikel bergambar, komik, atau dokumentasi visual dari web.

## Fitur Utama

* Mendeteksi semua gambar di halaman web (termasuk *lazy load*)
* Otomatis memfilter iklan dan ikon kecil
* Filter gambar berdasarkan rasio (Wide, Tall, Square) dan format (JPG, PNG, dll)
* Konversi gambar terpilih menjadi PDF berkualitas tinggi (*edge-to-edge*)

## Tech Stack

- React: 18.2.0
- Typescript: 5.2.2
- Tailwindcss: 3.4.1
- Jspdf: 2.5.1

## Instalasi

### Prasyarat
- Node.js (Direkomendasikan LTS version)
- npm (Satu paket dengan Node.js)

### Petunjuk Instalasi

1.  **Clone repositori**
    ```bash
    git clone https://github.com/KuroXSub/my-image-pdf-extension.git
    cd my-image-pdf-extension
    ```

2.  **Install dependency**
    ```bash
    npm install
    ```

3.  **Jalankan mode development**
    ```bash
    npm run dev
    ```

4.  **Buka Chrome** dan arahkan ke `chrome://extensions` atau melalui icon menu chrome

5.  Aktifkan **Developer mode** (di pojok kanan atas)

6.  **Klik Load unpacked** dan pilih folder dist/ dari proyek ini

## 📁 Struktur Singkat Project

```
src/
├── background/     # Background script
├── content/        # Scanner & filter gambar halaman
├── popup/          # UI ekstensi (React)
├── lib/            # PDF generator & utilities
├── store/          # Zustand state management
└── manifest.json   # Konfigurasi ekstensi Chrome
```

## Pengembang

Dikembangkan oleh Qurrota sebagai bagian dari ekosistem KuroSapa Labs.

Website Pengembang: [kuroxsub.my.id](https://kuroxsub.my.id)

GitHub: @KuroXSub