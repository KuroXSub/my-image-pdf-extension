import { useEffect, useState, useMemo, useRef } from 'react';
import { useImageStore } from '../store/useImageStore';
import { ImageCard } from './components/ImageCard';
import { generatePDF } from '../lib/pdf-generator'; 
import { Download, RefreshCw, Filter, Image as ImageIcon, Trash2, Loader2, ChevronDown } from 'lucide-react';
import './index.css'; 

function App() {
  const { images, addUniqueImages, selectedIds, toggleSelection, toggleSelectAll, clearImages } = useImageStore();
  const currentTabId = useRef<number | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // --- STATE UNTUK FILTER BARU ---
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Format file yang tersedia di halaman web saat ini
  const availableFormats = useMemo(() => Array.from(new Set(images.map(img => img.format))).filter(Boolean), [images]);

  // Default: Pilih semua ukuran & semua format
  const [selectedLayouts, setSelectedLayouts] = useState<string[]>(['wide', 'tall', 'square']);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [rememberFilters, setRememberFilters] = useState(false);

  // 1. Inisialisasi Data & Filter
  useEffect(() => {
    const init = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        currentTabId.current = tab.id;
        clearImages(); 

        // Load Gambar dari Tab Ini
        const storageKey = `scannedImages_${tab.id}`;
        chrome.storage.local.get([storageKey, 'savedFilters'], (result) => {
          // Load Saved Filters jika ada
          if (result.savedFilters) {
            setSelectedLayouts(result.savedFilters.layouts || ['wide', 'tall', 'square']);
            setSelectedFormats(result.savedFilters.formats || []);
            setRememberFilters(true);
          }

          if (result[storageKey] && result[storageKey].length > 0) {
            addUniqueImages(result[storageKey]);
          } else {
            requestScan();
          }
        });
      }
    };
    init();

    const messageListener = (message: any, sender: chrome.runtime.MessageSender) => {
      if (message.type === 'IMAGES_FOUND' && sender.tab?.id === currentTabId.current) {
        addUniqueImages(message.payload);
        if (currentTabId.current) {
           chrome.storage.local.set({ [`scannedImages_${currentTabId.current}`]: message.payload });
        }
        setIsScanning(false);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  // 2. Auto-select format baru jika user TIDAK menggunakan saved filters
  useEffect(() => {
    if (!rememberFilters && availableFormats.length > 0) {
      // Tambahkan format baru yang belum ada di selectedFormats
      const newFormats = availableFormats.filter(f => !selectedFormats.includes(f));
      if (newFormats.length > 0) {
        setSelectedFormats(prev => [...prev, ...newFormats]);
      }
    }
  }, [availableFormats, rememberFilters]);

  // 3. Simpan pengaturan otomatis jika "Remember" aktif
  useEffect(() => {
    if (rememberFilters) {
      chrome.storage.local.set({ savedFilters: { layouts: selectedLayouts, formats: selectedFormats } });
    } else {
      chrome.storage.local.remove('savedFilters');
    }
  }, [selectedLayouts, selectedFormats, rememberFilters]);

  // --- LOGIC PENYARINGAN (FILTER) KETAT ---
  const filteredImages = useMemo(() => {
    return images.filter(img => {
      const isLayoutMatch = selectedLayouts.includes(img.layout);
      const isFormatMatch = selectedFormats.includes(img.format);
      return isLayoutMatch && isFormatMatch;
    });
  }, [images, selectedLayouts, selectedFormats]);

  const isAllSelected = filteredImages.length > 0 && filteredImages.every(img => selectedIds.has(img.id));

  const requestScan = async () => {
    setIsScanning(true);
    if (currentTabId.current) {
      chrome.tabs.sendMessage(currentTabId.current, { type: 'FORCE_RESCAN' }, (_res) => {
         if (chrome.runtime.lastError) {}
         setTimeout(() => setIsScanning(false), 500);
      });
    } else {
        setIsScanning(false);
    }
  };

  const handleDownload = async () => {
    const imagesToDownload = images.filter(img => selectedIds.has(img.id));
    if (imagesToDownload.length === 0 || !currentTabId.current) return;

    setIsGenerating(true);
    setProgress({ current: 0, total: imagesToDownload.length });

    try {
      await generatePDF(imagesToDownload, currentTabId.current, (curr, total) => {
        setProgress({ current: curr, total });
      });
    } catch (error) {
      console.error("Gagal membuat PDF", error);
      alert("Terjadi kesalahan saat membuat PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper untuk Checkbox
  const toggleLayout = (val: string) => {
    setSelectedLayouts(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };
  const toggleFormat = (val: string) => {
    setSelectedFormats(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800">
      
      {/* HEADER */}
      <header className="bg-white border-b shadow-sm z-30 sticky top-0">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                <ImageIcon size={18} />
            </div>
            <h1 className="font-bold text-gray-800">Image Grasper</h1>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-full text-gray-500">
                Total: {images.length}
             </span>
             <button onClick={() => clearImages()} title="Clear List" className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded">
                <Trash2 size={16} />
             </button>
          </div>
        </div>

        {/* CONTROLS (TOMBOL FILTER & REFRESH) */}
        <div className="px-4 pb-3 flex gap-2">
            <button 
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex-1 flex items-center justify-between px-3 py-2 border rounded-lg text-xs font-medium transition-colors ${showFilterPanel ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <Filter size={14} />
                <span>Filter Tampilan ({filteredImages.length})</span>
              </div>
              <ChevronDown size={14} className={`transition-transform ${showFilterPanel ? 'rotate-180' : ''}`} />
            </button>

            <button 
                onClick={requestScan}
                disabled={isScanning}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
                <RefreshCw size={16} className={isScanning ? "animate-spin text-blue-600" : "text-gray-600"} />
            </button>
        </div>

        {/* PANEL CHECKBOX FILTER (Muncul saat ditekan) */}
        {showFilterPanel && (
          <div className="px-4 py-4 bg-gray-50/95 border-t border-gray-200 shadow-inner">
            
            <div className="mb-4">
              <span className="font-bold text-gray-800 mb-2 block text-sm">Layout Ukuran:</span>
              <div className="grid grid-cols-2 gap-2">
                {['wide', 'tall', 'square'].map(layout => {
                  // Hitung jumlah gambar untuk layout ini
                  const count = images.filter(img => img.layout === layout).length;
                  
                  return (
                    <label key={layout} className="flex items-center gap-3 cursor-pointer p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={selectedLayouts.includes(layout)} 
                        onChange={() => toggleLayout(layout)} 
                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" 
                      />
                      <span className="capitalize text-sm font-medium text-gray-700">
                        {layout} <span className="text-gray-400 font-normal">({count})</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mb-3">
              <span className="font-bold text-gray-800 mb-2 block text-sm">Tipe File:</span>
              {availableFormats.length === 0 ? (
                <span className="text-gray-400 italic text-sm">Belum ada format terdeteksi</span>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableFormats.map(fmt => {
                    // Hitung jumlah gambar untuk format ini
                    const count = images.filter(img => img.format === fmt).length;
                    
                    return (
                      <label key={fmt} className="flex items-center gap-3 cursor-pointer p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={selectedFormats.includes(fmt)} 
                          onChange={() => toggleFormat(fmt)} 
                          className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" 
                        />
                        <span className="uppercase text-sm font-medium text-gray-700">
                          {fmt} <span className="text-gray-400 font-normal">({count})</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-200">
               <label className="flex items-center gap-3 cursor-pointer text-blue-700 font-medium p-2 hover:bg-blue-50/50 rounded-lg">
                  <input 
                    type="checkbox" 
                    checked={rememberFilters} 
                    onChange={(e) => setRememberFilters(e.target.checked)} 
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-blue-300" 
                  />
                  <span className="text-sm">Simpan Pengaturan Filter Ini</span>
               </label>
            </div>
          </div>
        )}
      </header>

      {/* GALLERY GRID */}
      <main className="flex-1 overflow-y-auto p-3">
        {filteredImages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
             <p className="text-sm">Tidak ada gambar sesuai filter.</p>
          </div>
        ) : (
          <div className="grid gap-3 pb-20" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            {filteredImages.map((img) => (
              <ImageCard key={img.id} image={img} isSelected={selectedIds.has(img.id)} onToggle={() => toggleSelection(img.id)} />
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t p-4 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.1)] z-20">
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
            <input type="checkbox" checked={isAllSelected} onChange={(e) => toggleSelectAll(e.target.checked, filteredImages)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
            Pilih Tampil ({filteredImages.length})
          </label>
          <span className="text-xs text-gray-500">{selectedIds.size} terpilih</span>
        </div>

        <button 
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
          disabled={selectedIds.size === 0 || isGenerating}
          onClick={handleDownload}
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Memproses ({progress.current}/{progress.total})</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span>Download PDF</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
}

export default App;