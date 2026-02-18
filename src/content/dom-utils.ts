// src/content/dom-utils.ts (File baru atau gabung di index)
export const getAllImageCandidates = (): string[] => {
  const candidates = new Set<string>();

  // 1. Tag <img> dan <source>
  document.querySelectorAll('img, source').forEach((el: any) => {
    if (el.src) candidates.add(el.src);
    if (el.srcset) {
      // Ambil URL terbesar dari srcset (biasanya yang terakhir)
      const sources = el.srcset.split(',');
      const lastSource = sources[sources.length - 1].trim().split(' ')[0];
      if (lastSource) candidates.add(lastSource);
    }
  });

  // 2. CSS Background Images
  const allElements = document.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const style = window.getComputedStyle(allElements[i]);
    const bg = style.backgroundImage;
    if (bg && bg !== 'none' && bg.startsWith('url(')) {
      const url = bg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
      candidates.add(url);
    }
  }

  // 3. Link <a> ke file gambar (High Res targets)
  document.querySelectorAll('a[href]').forEach((a: any) => {
    if (/\.(jpg|jpeg|png|webp|gif)$/i.test(a.href)) {
      candidates.add(a.href);
    }
  });

  return Array.from(candidates);
};