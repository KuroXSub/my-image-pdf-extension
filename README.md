# 🖼️ Image to PDF Chrome Extension

<div align="center">

<!-- TODO: Add project logo -->

[![GitHub stars](https://img.shields.io/github/stars/KuroXSub/my-image-pdf-extension?style=for-the-badge)](https://github.com/KuroXSub/my-image-pdf-extension/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/KuroXSub/my-image-pdf-extension?style=for-the-badge)](https://github.com/KuroXSub/my-image-pdf-extension/network)
[![GitHub issues](https://img.shields.io/github/issues/KuroXSub/my-image-pdf-extension?style=for-the-badge)](https://github.com/KuroXSub/my-image-pdf-extension/issues)
[![GitHub license](https://img.shields.io/github/license/KuroXSub/my-image-pdf-extension?style=for-the-badge)](LICENSE)

**Ekstensi Chrome untuk mengunduh gambar dari halaman web secara *batch* dan mengonversinya menjadi satu file PDF dengan lebar yang identik. Dibuat menggunakan React, TypeScript, Tailwind CSS, dan jsPDF.**

<!-- TODO: Add live demo link --> 

<!-- TODO: Add documentation link -->

</div>

## 📖 Overview

Image Grasper adalah ekstensi Chrome untuk mengunduh gambar dari halaman web secara massal dan mengonversinya menjadi satu file PDF dengan lebar seragam, rapi, dan tidak terpotong. Cocok untuk menyimpan artikel bergambar, komik, atau dokumentasi visual dari web.

## ✨ Fitur Utama

* 🖼️ Mendeteksi semua gambar di halaman web (termasuk *lazy load*)
* 🛡️ Otomatis memfilter iklan dan ikon kecil
* 📏 Filter gambar berdasarkan rasio (Wide, Tall, Square) dan format (JPG, PNG, dll)
* 📄 Konversi gambar terpilih menjadi PDF berkualitas tinggi (*edge-to-edge*)

## 🛠️ Tech Stack

**Frontend:**
- ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white)
- ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

**Styling:**
- ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
- ![PostCSS](https://img.shields.io/badge/PostCSS-DD3A0A?style=for-the-badge&logo=postcss&logoColor=white)

**Build Tools:**
- ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
- ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)

## 📦 Key Dependencies

```
jspdf: ^2.5.1
lucide-react: ^0.563.0
react: ^18.2.0
react-dom: ^18.2.0
zustand: ^4.5.0
```

## 🚀 Cara Menjalankan (Development)

### Prasyarat
- Node.js (Direkomendasikan LTS version)
- npm (Satu paket dengan Node.js)

### Instalasi

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