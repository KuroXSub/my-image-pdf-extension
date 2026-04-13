// src/background/index.ts

chrome.sidePanel.setOptions({ enabled: false });

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
  .catch((error) => console.error(error));

// 3. Saat user mengklik ikon ekstensi...
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: 'index.html',
      enabled: true
    });
    
    chrome.sidePanel.open({ tabId: tab.id });
  }
});