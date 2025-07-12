// YouTube Auto Commenter Background Script

chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Auto Commenter estensione installata');
  
  // Pulisci lo stato dell'automazione al primo avvio
  chrome.storage.local.set({isRunning: false});
  
  // Imposta valori predefiniti se non esistono
  chrome.storage.sync.get(['keyword', 'comment', 'commentsList', 'commentMode', 'delay', 'maxVideos'], (data) => {
    if (!data.keyword) {
      chrome.storage.sync.set({
        keyword: '',
        comment: `Love this video!`,
        commentsList: `["Great video! 👍", "Thanks for sharing this!", "Very informative!", "Love this content!", "Keep up the great work!"]`,
        commentMode: 'single',
        delay: 60,
        maxVideos: 5
      });
    }
  });
});

// Gestisce la comunicazione tra popup e content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStatus') {
    // Inoltra il messaggio al popup se è aperto
    chrome.runtime.sendMessage(request).catch(() => {
      // Il popup potrebbe non essere aperto, ignora l'errore
    });
  } else if (request.action === 'automationComplete') {
    // Inoltra il messaggio al popup
    chrome.runtime.sendMessage(request).catch(() => {
      // Il popup potrebbe non essere aperto, ignora l'errore
    });
  } else if (request.action === 'automationError') {
    // Inoltra il messaggio al popup
    chrome.runtime.sendMessage(request).catch(() => {
      // Il popup potrebbe non essere aperto, ignora l'errore
    });
  }
});

// Pulisci lo stato quando il browser viene chiuso
chrome.runtime.onSuspend.addListener(() => {
  chrome.storage.local.set({isRunning: false});
});

// Gestisce i cambiamenti di tab per fermare l'automazione se l'utente naviga via da YouTube
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.includes('youtube.com')) {
    chrome.storage.local.get(['isRunning'], (data) => {
      if (data.isRunning) {
        chrome.storage.local.set({isRunning: false});
      }
    });
  }
});

console.log('YouTube Auto Commenter Background Script loaded'); 
