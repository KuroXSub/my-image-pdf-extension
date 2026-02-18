// src/background/index.ts

// 1. Matikan perilaku default Chrome yang membuka panel di semua tab
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
  .catch((error) => console.error(error));

// 2. Saat user mengklik ikon ekstensi di pojok kanan atas...
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    // Aktifkan Side Panel KHUSUS untuk tab yang sedang diklik ini
    chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: 'index.html',
      enabled: true
    });
    
    // Perintahkan Chrome untuk membuka Side Panel di tab ini
    chrome.sidePanel.open({ tabId: tab.id });
  }
});