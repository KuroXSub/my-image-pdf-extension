import React, { useState } from 'react';
import { ScannedImage } from '../../types';
import { Check, ImageOff } from 'lucide-react';

interface Props {
  image: ScannedImage;
  isSelected: boolean;
  onToggle: () => void;
  onError: (url: string) => void; // 🔥 penting
}

export const ImageCard: React.FC<Props> = ({ image, isSelected, onToggle, onError }) => {
  const [broken, setBroken] = useState(false);

  return (
    <div
      onClick={onToggle}
      className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-200 border-2
        ${isSelected ? 'border-blue-500 shadow-lg scale-95' : 'border-transparent hover:border-gray-300'}`}
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center p-1 relative">
        
        {!broken ? (
          <img
            src={image.url}
            loading="lazy"
            alt=""
            referrerPolicy="strict-origin-when-cross-origin"
            className="object-contain max-w-full max-h-full"
            onError={() => {
              setBroken(true);
              onError(image.url); // 🔥 kirim ke parent
            }}
          />
        ) : (
          <ImageOff size={24} className="text-gray-300" />
        )}

        {isSelected && <div className="absolute inset-0 bg-blue-500/20" />}
      </div>

      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] p-1 text-center truncate">
        {image.width}x{image.height}
      </div>

      <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm
        ${isSelected ? 'bg-blue-600 text-white' : 'bg-white/90 text-transparent border border-gray-200'}`}>
        <Check size={12} strokeWidth={4} />
      </div>
    </div>
  );
};