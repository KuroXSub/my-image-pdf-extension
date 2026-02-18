import React from 'react';
import { ScannedImage } from '../../types';
import { Check } from 'lucide-react';

interface Props {
  image: ScannedImage;
  isSelected: boolean;
  onToggle: () => void;
}

export const ImageCard: React.FC<Props> = ({ image, isSelected, onToggle }) => {
  return (
    <div 
      onClick={onToggle}
      className={`
        relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-200
        /* Border Logic: Jika selected, border biru tebal & shadow */
        ${isSelected 
          ? 'border-4 border-blue-500 ring-2 ring-blue-200 shadow-lg scale-95' 
          : 'border border-gray-200 hover:border-gray-400 hover:shadow-md'}
      `}
    >
      {/* PERBAIKAN: Gunakan flex, justify-center, items-center dan p-2 agar gambar di tengah */}
      <div className="aspect-square bg-gray-100 relative flex items-center justify-center p-2">
        <img 
          src={image.url} 
          alt="thumb"
          referrerPolicy="no-referrer" 
          className="object-contain max-w-full max-h-full drop-shadow-sm"
          loading="lazy"
        />
        
        {/* Overlay Gelap */}
        {isSelected && (
          <div className="absolute inset-0 bg-blue-900/30 transition-opacity" />
        )}
      </div>

      {/* Info Badge (Ganti background agar lebih elegan) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-[10px] p-2 pt-4 truncate text-center">
        {image.width} x {image.height} • {image.format.toUpperCase()}
      </div>

      {/* Checkbox Icon */}
      <div className={`
        absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-all
        ${isSelected 
          ? 'bg-blue-600 text-white scale-100' 
          : 'bg-white/80 text-transparent border border-gray-300 scale-90 opacity-0 group-hover:opacity-100'}
      `}>
        <Check size={16} strokeWidth={3} />
      </div>
    </div>
  );
};