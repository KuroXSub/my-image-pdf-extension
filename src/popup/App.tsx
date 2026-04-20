import { useEffect, useState, useMemo, useRef } from 'react';
import { useImageStore } from '../store/useImageStore';
import { ImageCard } from './components/ImageCard';
import { generatePDF } from '../lib/pdf-generator'; 
import { generateZIP } from '../lib/zip-generator';
import { sanitizeFileName } from '../lib/utils';
import { t } from '../i18n/translations';
import { 
  Download, RefreshCw, Filter, Image as ImageIcon, 
  Trash2, Loader2, ChevronDown, FileArchive, Edit3, FolderDown, AlertTriangle, Languages 
} from 'lucide-react';
import './index.css'; 

function App() {
  const { images, addUniqueImages, selectedIds, toggleSelection, toggleSelectAll, clearImages, hasCorsIssue, setCorsIssue, language, setLanguage } = useImageStore();
  const currentTabId = useRef<number | null>(null);
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [generatingType, setGeneratingType] = useState<'pdf' | 'zip' | 'native' | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [fileNameInput, setFileNameInput] = useState(`Image_Grasper_${new Date().toISOString().slice(0,10)}`);

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const availableFormats = useMemo(() => Array.from(new Set(images.map(img => img.format))).filter(Boolean), [images]);
  const [selectedLayouts, setSelectedLayouts] = useState<string[]>(['wide', 'tall', 'square']);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [rememberFilters, setRememberFilters] = useState(false);
  const [isFilterLoaded, setIsFilterLoaded] = useState(false);
  const [blockedUrls, setBlockedUrls] = useState<Set<string>>(new Set());

  const lang = t[language]; // Kamus bahasa aktif

  const handleImageError = (url: string) => {
    setBlockedUrls(prev => new Set(prev).add(url));
  };
  const hasHotlinkProtection = blockedUrls.size > 0;

  useEffect(() => {
    const init = async () => {
      setIsInitialLoading(true);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        currentTabId.current = tab.id;
        clearImages();

        const storageKey = `scannedImages_${tab.id}`;
        chrome.storage.local.get([storageKey, 'savedFilters', 'savedLanguage'], (result) => {
          if (result.savedLanguage) setLanguage(result.savedLanguage);
          
          if (result.savedFilters) {
            setSelectedLayouts(result.savedFilters.layouts || ['wide', 'tall', 'square']);
            setSelectedFormats(result.savedFilters.formats || []);
            setRememberFilters(true);
          }
          
          setIsFilterLoaded(true);

          if (result[storageKey] && result[storageKey].length > 0) {
            addUniqueImages(result[storageKey]);
            setIsInitialLoading(false);
          } else {
            requestScan().finally(() => setIsInitialLoading(false));
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

  const firstImageUrl = images[0]?.url;
  useEffect(() => {
    if (firstImageUrl && currentTabId.current) {
      chrome.tabs.sendMessage(currentTabId.current, { type: 'FETCH_IMAGE_BASE64', payload: { url: firstImageUrl } }, (response) => {
        setCorsIssue(!!(chrome.runtime.lastError || !response || !response.success));
      });
    }
  }, [firstImageUrl]);

  useEffect(() => {
    if (!rememberFilters && availableFormats.length > 0) {
      const newFormats = availableFormats.filter(f => !selectedFormats.includes(f));
      if (newFormats.length > 0) setSelectedFormats(prev => [...prev, ...newFormats]);
    }
  }, [availableFormats, rememberFilters]);

  useEffect(() => {
    if (!isFilterLoaded) return;
    if (rememberFilters) {
      chrome.storage.local.set({ savedFilters: { layouts: selectedLayouts, formats: selectedFormats } });
    } else {
      chrome.storage.local.remove('savedFilters');
    }
  }, [selectedLayouts, selectedFormats, rememberFilters, isFilterLoaded]);

  const filteredImages = useMemo(() => {
    return images.filter(img => selectedLayouts.includes(img.layout) && selectedFormats.includes(img.format));
  }, [images, selectedLayouts, selectedFormats]);

  const isAllSelected = filteredImages.length > 0 && filteredImages.every(img => selectedIds.has(img.id));

  const requestScan = async () => {
    setIsScanning(true);
    if (currentTabId.current) {
      chrome.tabs.sendMessage(currentTabId.current, { type: 'FORCE_RESCAN' }, (_res) => {
         if (chrome.runtime.lastError) {}
         setTimeout(() => setIsScanning(false), 500);
      });
    } else setIsScanning(false);
  };

  const handleDownload = async (type: 'pdf' | 'zip') => {
    const imagesToDownload = images.filter(img => selectedIds.has(img.id));
    if (imagesToDownload.length === 0 || !currentTabId.current) return;

    const finalName = sanitizeFileName(fileNameInput, `Download_${type.toUpperCase()}`);
    setGeneratingType(type);
    setProgress({ current: 0, total: imagesToDownload.length });

    try {
      if (type === 'pdf') {
        await generatePDF(imagesToDownload, currentTabId.current, finalName, (curr, total) => setProgress({ current: curr, total }));
      } else {
        await generateZIP(imagesToDownload, currentTabId.current, finalName, (curr, total) => setProgress({ current: curr, total }));
      }
    } catch (error) {
      alert(type === 'pdf' ? lang.errorPdf : lang.errorZip);
    } finally {
      setGeneratingType(null);
    }
  };

  const handleNativeDownload = async () => {
    const imagesToDownload = images.filter(img => selectedIds.has(img.id));
    if (imagesToDownload.length === 0) return;

    const folderName = sanitizeFileName(fileNameInput, "Downloaded_Images");
    setGeneratingType('native');
    setProgress({ current: 0, total: imagesToDownload.length });

    for (let i = 0; i < imagesToDownload.length; i++) {
      const img = imagesToDownload[i];
      const ext = img.format !== 'unknown' ? img.format : 'jpg';
      const padLength = String(imagesToDownload.length).length;
      const fileNum = String(i + 1).padStart(padLength, '0');
      const filename = `${folderName}/${folderName}_${fileNum}.${ext}`;

      try {
        await new Promise((resolve) => {
          chrome.downloads.download({ url: img.url, filename, conflictAction: 'uniquify', saveAs: false }, () => setTimeout(resolve, 800));
        });
        setProgress({ current: i + 1, total: imagesToDownload.length });
      } catch (err) {
        console.error("Download failed:", err);
      }
    }
    setGeneratingType(null);
  };

  const toggleLanguage = () => {
    const newLang = language === 'id' ? 'en' : 'id';
    setLanguage(newLang);
    chrome.storage.local.set({ savedLanguage: newLang });
  };

  const toggleLayout = (val: string) => setSelectedLayouts(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  const toggleFormat = (val: string) => setSelectedFormats(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">{lang.scanLoading}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800">
      <header className="bg-white border-b shadow-sm z-30 sticky top-0">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                <ImageIcon size={18} />
            </div>
            <h1 className="font-bold text-gray-800">{lang.title}</h1>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-full text-gray-500">{lang.total} {images.length}</span>
             <button onClick={toggleLanguage} title="Change Language" className="p-1 hover:bg-gray-100 text-gray-500 rounded flex items-center"><Languages size={16} /></button>
             <button onClick={() => clearImages()} title={lang.clearList} className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded"><Trash2 size={16} /></button>
          </div>
        </div>

        <div className="px-4 pb-3 flex gap-2">
            <button 
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex-1 flex items-center justify-between px-3 py-2 border rounded-lg text-xs font-medium transition-colors ${showFilterPanel ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2"><Filter size={14} /><span>{lang.filterDisplay} ({filteredImages.length})</span></div>
              <ChevronDown size={14} className={`transition-transform ${showFilterPanel ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={requestScan} disabled={isScanning} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50">
                <RefreshCw size={16} className={isScanning ? "animate-spin text-blue-600" : "text-gray-600"} />
            </button>
        </div>

        {showFilterPanel && (
           <div className="px-4 py-4 bg-gray-50/95 border-t border-gray-200 shadow-inner">
             <div className="mb-4">
               <span className="font-bold text-gray-800 mb-2 block text-sm">{lang.layoutSize}</span>
               <div className="grid grid-cols-2 gap-2">
                 {['wide', 'tall', 'square'].map(layout => {
                   const count = images.filter(img => img.layout === layout).length;
                   return (
                     <label key={layout} className="flex items-center gap-3 cursor-pointer p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors shadow-sm">
                       <input type="checkbox" checked={selectedLayouts.includes(layout)} onChange={() => toggleLayout(layout)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                       <span className="capitalize text-sm font-medium text-gray-700">{layout} <span className="text-gray-400 font-normal">({count})</span></span>
                     </label>
                   );
                 })}
               </div>
             </div>

             <div className="mb-3">
               <span className="font-bold text-gray-800 mb-2 block text-sm">{lang.fileType}</span>
               {availableFormats.length === 0 ? (
                 <span className="text-gray-400 italic text-sm">{lang.noFormat}</span>
               ) : (
                 <div className="grid grid-cols-2 gap-2">
                   {availableFormats.map(fmt => {
                     const count = images.filter(img => img.format === fmt).length;
                     return (
                       <label key={fmt} className="flex items-center gap-3 cursor-pointer p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors shadow-sm">
                         <input type="checkbox" checked={selectedFormats.includes(fmt)} onChange={() => toggleFormat(fmt)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                         <span className="uppercase text-sm font-medium text-gray-700">{fmt} <span className="text-gray-400 font-normal">({count})</span></span>
                       </label>
                     );
                   })}
                 </div>
               )}
             </div>

             <div className="mt-5 pt-4 border-t border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer text-blue-700 font-medium p-2 hover:bg-blue-50/50 rounded-lg">
                   <input type="checkbox" checked={rememberFilters} onChange={(e) => setRememberFilters(e.target.checked)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-blue-300" />
                   <span className="text-sm">{lang.saveFilter}</span>
                </label>
             </div>
           </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-3">
        {filteredImages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3"><p className="text-sm">{lang.noImages}</p></div>
        ) : (
          <div className="grid gap-3 pb-20" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            {filteredImages.map((img) => (
              <ImageCard key={img.id} image={img} isSelected={selectedIds.has(img.id)} onToggle={() => toggleSelection(img.id)} onError={handleImageError} />
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white border-t p-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-20">
        {hasHotlinkProtection && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex items-start gap-2">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <p>{lang.hotlinkWarning}</p>
          </div>
        )}

        <div className="mb-4">
          <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block flex items-center gap-1"><Edit3 size={12} /> {lang.fileNameLabel}</label>
          <input type="text" value={fileNameInput} onChange={(e) => setFileNameInput(e.target.value)} placeholder={lang.placeholderName} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input type="checkbox" checked={isAllSelected} onChange={(e) => toggleSelectAll(e.target.checked, filteredImages)} className="w-4 h-4 rounded text-blue-600 border-gray-300" />
            {lang.selectAll} ({filteredImages.length})
          </label>
          <span className="text-xs text-gray-500">{selectedIds.size} {lang.selected}</span>
        </div>

        <div className="flex gap-2">
          <button 
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 text-[11px] shadow-sm shadow-emerald-200"
            disabled={selectedIds.size === 0 || generatingType !== null} onClick={handleNativeDownload} title={lang.btnNativeTitle}
          >
            {generatingType === 'native' ? <><Loader2 className="animate-spin shrink-0" size={14} /><span>({progress.current}/{progress.total})</span></> : <><FolderDown size={14} className="shrink-0"/><span>{lang.btnNative}</span></>}
          </button>
          <button 
            className={`flex-1 font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[11px] shadow-sm ${hasCorsIssue || hasHotlinkProtection ? 'bg-gray-100 text-gray-400' : 'bg-gray-800 hover:bg-black text-white shadow-gray-300'}`}
            disabled={selectedIds.size === 0 || generatingType !== null || hasHotlinkProtection} onClick={() => handleDownload('zip')}
          >
            {generatingType === 'zip' ? <><Loader2 className="animate-spin shrink-0" size={14} /><span>({progress.current}/{progress.total})</span></> : <><FileArchive size={14} className="shrink-0"/><span>ZIP</span></>}
          </button>
          <button 
            className={`flex-1 font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[11px] shadow-sm ${hasCorsIssue || hasHotlinkProtection ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'}`}
            disabled={selectedIds.size === 0 || generatingType !== null || hasHotlinkProtection} onClick={() => handleDownload('pdf')}
          >
            {generatingType === 'pdf' ? <><Loader2 className="animate-spin shrink-0" size={14} /><span>({progress.current}/{progress.total})</span></> : <><Download size={14} className="shrink-0"/><span>PDF</span></>}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;