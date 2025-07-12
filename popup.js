document.addEventListener('DOMContentLoaded', function() {
  const keywordInput = document.getElementById('keyword');
  const commentInput = document.getElementById('comment');
  const commentsListInput = document.getElementById('commentsList');
  const delayInput = document.getElementById('delay');
  const maxVideosInput = document.getElementById('maxVideos');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const testBtn = document.getElementById('testBtn');
  const statusDiv = document.getElementById('status');
  const connectionIndicator = document.getElementById('connectionIndicator');
  const connectionStatus = document.getElementById('connectionStatus');
  
  // Elementi per la modalità commenti
  const singleCommentBtn = document.getElementById('singleCommentBtn');
  const jsonCommentBtn = document.getElementById('jsonCommentBtn');
  const singleCommentField = document.getElementById('singleCommentField');
  const jsonCommentField = document.getElementById('jsonCommentField');

  let isRunning = false;
  let commentMode = 'single'; // 'single' o 'json'

  // Carica i valori salvati
  chrome.storage.sync.get(['keyword', 'comment', 'commentsList', 'commentMode', 'delay', 'maxVideos'], function(data) {
    if (data.keyword) keywordInput.value = data.keyword;
    if (data.comment) commentInput.value = data.comment;
    if (data.commentsList) commentsListInput.value = data.commentsList;
    if (data.commentMode) {
      commentMode = data.commentMode;
      updateCommentMode();
    }
    if (data.delay) delayInput.value = data.delay;
    if (data.maxVideos) maxVideosInput.value = data.maxVideos;
  });

  // Gestione modalità commenti
  singleCommentBtn.addEventListener('click', function() {
    commentMode = 'single';
    updateCommentMode();
    saveSettings();
  });

  jsonCommentBtn.addEventListener('click', function() {
    commentMode = 'json';
    updateCommentMode();
    saveSettings();
  });

  function updateCommentMode() {
    if (commentMode === 'single') {
      singleCommentBtn.classList.add('active');
      jsonCommentBtn.classList.remove('active');
      singleCommentField.style.display = 'block';
      jsonCommentField.style.display = 'none';
    } else {
      singleCommentBtn.classList.remove('active');
      jsonCommentBtn.classList.add('active');
      singleCommentField.style.display = 'none';
      jsonCommentField.style.display = 'block';
    }
  }

  // Validazione JSON in tempo reale
  commentsListInput.addEventListener('input', function() {
    const value = commentsListInput.value.trim();
    if (value) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(item => typeof item === 'string')) {
          commentsListInput.style.borderColor = '#4CAF50';
          commentsListInput.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
        } else {
          commentsListInput.style.borderColor = '#f44336';
          commentsListInput.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
        }
      } catch (e) {
        commentsListInput.style.borderColor = '#f44336';
        commentsListInput.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
      }
    } else {
      commentsListInput.style.borderColor = '';
      commentsListInput.style.backgroundColor = '';
    }
    saveSettings();
  });

  // Salva i valori quando cambiano
  function saveSettings() {
    chrome.storage.sync.set({
      keyword: keywordInput.value,
      comment: commentInput.value,
      commentsList: commentsListInput.value,
      commentMode: commentMode,
      delay: delayInput.value,
      maxVideos: maxVideosInput.value
    });
  }

  keywordInput.addEventListener('input', saveSettings);
  commentInput.addEventListener('input', saveSettings);
  delayInput.addEventListener('input', saveSettings);
  maxVideosInput.addEventListener('input', saveSettings);

  // Controlla lo stato dell'automazione
  chrome.storage.local.get(['isRunning'], function(data) {
    if (data.isRunning) {
      showRunningState();
    }
  });

  // Testa la connessione al caricamento
  testConnection();

  // Funzione per validare i commenti
  function validateComments() {
    if (commentMode === 'single') {
      const comment = commentInput.value.trim();
      if (!comment) {
        return { valid: false, message: 'Inserisci un commento!' };
      }
      return { valid: true, comments: [comment] };
    } else {
      const value = commentsListInput.value.trim();
      if (!value) {
        return { valid: false, message: 'Inserisci la lista di commenti JSON!' };
      }
      
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) {
          return { valid: false, message: 'La lista deve essere un array JSON!' };
        }
        if (parsed.length === 0) {
          return { valid: false, message: 'La lista non può essere vuota!' };
        }
        if (!parsed.every(item => typeof item === 'string')) {
          return { valid: false, message: 'Tutti gli elementi devono essere stringhe!' };
        }
        if (parsed.some(item => item.trim().length === 0)) {
          return { valid: false, message: 'I commenti non possono essere vuoti!' };
        }
        
        return { valid: true, comments: parsed };
      } catch (e) {
        return { valid: false, message: 'JSON non valido! Formato: ["Commento 1", "Commento 2"]' };
      }
    }
  }

  startBtn.addEventListener('click', function() {
    const keyword = keywordInput.value.trim();
    const delay = parseInt(delayInput.value);
    const maxVideos = parseInt(maxVideosInput.value);

    if (!keyword) {
      showStatus('Inserisci una parola chiave!', 'error');
      return;
    }

    // Valida i commenti
    const commentsValidation = validateComments();
    if (!commentsValidation.valid) {
      showStatus(commentsValidation.message, 'error');
      return;
    }

    if (delay < 30) {
      showStatus('Il tempo minimo tra commenti è 30 secondi!', 'error');
      return;
    }

    // Verifica se siamo su YouTube
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs[0].url.includes('youtube.com')) {
        showStatus('Devi essere su YouTube per usare questa estensione!', 'error');
        return;
      }

      // Funzione per testare se il content script è pronto
      function testContentScript(callback) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'ping'}, function(response) {
          if (chrome.runtime.lastError) {
            callback(false);
          } else {
            callback(true);
          }
        });
      }

      // Prova a connettersi al content script
      testContentScript(function(isReady) {
        if (!isReady) {
          showStatus('Content script non pronto. Ricarica la pagina e riprova.', 'error');
          
          // Prova a iniettare il content script
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
          }, function(result) {
            if (chrome.runtime.lastError) {
              showStatus('Errore nell\'iniettare il content script. Ricarica la pagina.', 'error');
              return;
            }
            
            // Riprova dopo l'iniezione
            setTimeout(() => {
              testContentScript(function(isReadyAfterInject) {
                if (isReadyAfterInject) {
                  sendAutomationMessage();
                } else {
                  showStatus('Content script non risponde. Ricarica YouTube.', 'error');
                }
              });
            }, 1000);
          });
          return;
        }

        // Content script è pronto, invia il messaggio
        sendAutomationMessage();
      });

      function sendAutomationMessage() {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'startAutomation',
          keyword: keyword,
          comments: commentsValidation.comments, // Passa l'array di commenti
          commentMode: commentMode,
          delay: delay * 1000, // converti in millisecondi
          maxVideos: maxVideos
        }, function(response) {
          if (chrome.runtime.lastError) {
            showStatus('Errore di comunicazione: ' + chrome.runtime.lastError.message, 'error');
            return;
          }

          if (response && response.success) {
            showRunningState();
            const modeText = commentMode === 'single' ? 'commento singolo' : `${commentsValidation.comments.length} commenti randomici`;
            showStatus(`Automazione avviata con ${modeText}!`, 'success');
          } else {
            showStatus('Errore nell\'avviare l\'automazione', 'error');
          }
        });
      }
    });
  });

  stopBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'stopAutomation'}, function(response) {
        showStoppedState();
        showStatus('Automazione fermata!', 'warning');
      });
    });
  });

  testBtn.addEventListener('click', function() {
    testConnection();
  });

  function showRunningState() {
    isRunning = true;
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    keywordInput.disabled = true;
    commentInput.disabled = true;
    commentsListInput.disabled = true;
    singleCommentBtn.disabled = true;
    jsonCommentBtn.disabled = true;
    delayInput.disabled = true;
    maxVideosInput.disabled = true;
    
    chrome.storage.local.set({isRunning: true});
  }

  function showStoppedState() {
    isRunning = false;
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    keywordInput.disabled = false;
    commentInput.disabled = false;
    commentsListInput.disabled = false;
    singleCommentBtn.disabled = false;
    jsonCommentBtn.disabled = false;
    delayInput.disabled = false;
    maxVideosInput.disabled = false;
    
    chrome.storage.local.set({isRunning: false});
  }

  function showStatus(message, type) {
    statusDiv.innerHTML = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }

  function showConnectionStatus(isConnected, message) {
    if (isConnected) {
      connectionIndicator.textContent = '✅ Connesso';
      connectionStatus.style.background = 'rgba(76, 175, 80, 0.3)';
      startBtn.disabled = false;
    } else {
      connectionIndicator.textContent = '❌ Disconnesso';
      connectionStatus.style.background = 'rgba(244, 67, 54, 0.3)';
      startBtn.disabled = true;
    }
    
    if (message) {
      showStatus(message, isConnected ? 'success' : 'error');
    }
  }

  function testConnection() {
    connectionIndicator.textContent = '🔄 Testando...';
    connectionStatus.style.background = 'rgba(255, 152, 0, 0.3)';
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs[0]) {
        showConnectionStatus(false, 'Nessuna tab attiva');
        return;
      }

      if (!tabs[0].url.includes('youtube.com')) {
        showConnectionStatus(false, 'Non sei su YouTube');
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, {action: 'ping'}, function(response) {
        if (chrome.runtime.lastError) {
          showConnectionStatus(false, 'Content script non caricato. Ricarica YouTube.');
          
          // Prova a iniettare il content script
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
          }, function(result) {
            if (chrome.runtime.lastError) {
              showConnectionStatus(false, 'Errore nell\'iniettare il content script');
            } else {
              setTimeout(() => {
                testConnection(); // Riprova dopo l'iniezione
              }, 1000);
            }
          });
        } else if (response && response.ready) {
          showConnectionStatus(true, 'Connessione OK - Pronto per l\'automazione');
        } else {
          showConnectionStatus(false, 'Content script non risponde');
        }
      });
    });
  }

  // Ascolta i messaggi dal content script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateStatus') {
      showStatus(request.message, request.type || 'success');
    } else if (request.action === 'automationComplete') {
      showStoppedState();
      showStatus('Automazione completata!', 'success');
    } else if (request.action === 'automationError') {
      showStoppedState();
      showStatus('Errore nell\'automazione: ' + request.error, 'error');
    }
  });
}); 