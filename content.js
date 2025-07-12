// YouTube Auto Commenter Content Script
let isAutomationRunning = false;
let currentVideoIndex = 0;
let videoLinks = [];
let automationSettings = {};
let timeoutId = null;

// Funzione per aspettare un elemento
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Elemento ${selector} non trovato entro ${timeout}ms`));
    }, timeout);
  });
}

// Funzione per simulare un click più naturale
function simulateClick(element) {
  console.log(`🖱️ Simulando click su elemento:`);
  console.log(`   🏷️ Tag: ${element.tagName}`);
  console.log(`   🆔 ID: ${element.id}`);
  console.log(`   🎯 Classe: ${element.className}`);
  console.log(`   📍 Visibile: ${element.offsetParent !== null}`);
  console.log(`   ✏️ Abilitato: ${!element.disabled}`);
  console.log(`   📝 Testo: "${element.textContent?.trim() || 'N/A'}"`);
  
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  
  console.log(`   📐 Posizione: x=${x}, y=${y}`);
  console.log(`   📏 Dimensioni: ${rect.width}x${rect.height}`);
  
  // Scroll per assicurarsi che l'elemento sia visibile
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  console.log('🖱️ Triggering mousedown...');
  element.dispatchEvent(new MouseEvent('mousedown', {
    clientX: x,
    clientY: y,
    bubbles: true
  }));
  
  setTimeout(() => {
    console.log('🖱️ Triggering mouseup e click...');
    element.dispatchEvent(new MouseEvent('mouseup', {
      clientX: x,
      clientY: y,
      bubbles: true
    }));
    element.dispatchEvent(new MouseEvent('click', {
      clientX: x,
      clientY: y,
      bubbles: true
    }));
    
    console.log('✅ Click simulato completato');
  }, 100);
}

// Funzione per simulare digitazione più naturale
function simulateTyping(element, text) {
  return new Promise((resolve, reject) => {
    // Validazione dei parametri
    if (!element) {
      console.error('❌ Elemento non valido per la digitazione');
      reject(new Error('Elemento non valido'));
      return;
    }
    
    if (!text || typeof text !== 'string') {
      console.error('❌ Testo non valido per la digitazione:', text);
      reject(new Error('Testo non valido'));
      return;
    }
    
    console.log(`⌨️ Inizio simulazione digitazione: "${text}"`);
    console.log(`📝 Elemento target: ${element.tagName} - ID: ${element.id} - Classe: ${element.className}`);
    
    element.focus();
    let index = 0;
    
    // Pulisci prima il contenuto esistente
    const originalContent = element.value || element.textContent || element.innerText || '';
    console.log(`🧹 Contenuto originale da pulire: "${originalContent}"`);
    
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      element.value = '';
      console.log('🧹 Pulito input/textarea');
    } else if (element.contentEditable === 'true') {
      element.textContent = '';
      console.log('🧹 Pulito elemento contenteditable');
    }
    
    // Trigger evento per registrare la pulizia
    element.dispatchEvent(new Event('input', { bubbles: true }));
    
    function typeChar() {
      if (index < text.length) {
        const char = text[index];
        console.log(`⌨️ Digitando carattere ${index + 1}/${text.length}: "${char}"`);
        
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
          element.value += char;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (element.contentEditable === 'true') {
          element.textContent += char;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        // Log progresso ogni 10 caratteri
        if ((index + 1) % 10 === 0 || index === text.length - 1) {
          const currentContent = element.value || element.textContent || element.innerText || '';
          console.log(`📝 Progresso digitazione: "${currentContent}"`);
        }
        
        index++;
        setTimeout(typeChar, 50 + Math.random() * 100); // Velocità di digitazione variabile
      } else {
        // Trigger finale per assicurarsi che il contenuto sia registrato
        console.log('🔚 Digitazione completata, triggering eventi finali...');
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
        element.dispatchEvent(new Event('focus', { bubbles: true }));
        
        // Verifica contenuto finale
        const finalContent = element.value || element.textContent || element.innerText || '';
        console.log(`✅ Contenuto finale dopo digitazione: "${finalContent}"`);
        console.log(`✅ Digitazione riuscita: ${finalContent === text}`);
        
        resolve();
      }
    }
    
    // Inizia la digitazione dopo un piccolo ritardo
    console.log('⏳ Inizio digitazione tra 200ms...');
    setTimeout(typeChar, 200);
  });
}

// Funzione per effettuare la ricerca
async function searchVideos(keyword) {
  try {
    // Vai alla home di YouTube se non ci siamo già
    if (!window.location.href.includes('youtube.com')) {
      window.location.href = 'https://www.youtube.com';
      return;
    }

    // Aspetta che la pagina sia completamente caricata
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Cerca la barra di ricerca con selettori multipli
    let searchBox = null;
    const searchSelectors = [
      'input[name="search_query"]',
      'input#search',
      'input[aria-label*="Search"]',
      '#search-input input',
      'ytd-searchbox input',
      '#search input'
    ];

    for (const selector of searchSelectors) {
      try {
        searchBox = await waitForElement(selector, 2000);
        console.log(`Trovata barra di ricerca con selettore: ${selector}`);
        break;
      } catch (e) {
        console.log(`Selettore ${selector} non funziona, provo il prossimo...`);
      }
    }

    if (!searchBox) {
      throw new Error('Impossibile trovare la barra di ricerca di YouTube');
    }
    
    // Pulisci la barra di ricerca
    searchBox.value = '';
    searchBox.focus();
    
    // Digita la parola chiave
    await simulateTyping(searchBox, keyword);
    
    // Aspetta un po' prima di premere invio
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Premi invio per cercare
    searchBox.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true
    }));

    // Aspetta che i risultati si carichino
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return true;
  } catch (error) {
    console.error('Errore nella ricerca:', error);
    return false;
  }
}

// Funzione per raccogliere i link dei video
async function collectVideoLinks() {
  try {
    // Aspetta che i risultati di ricerca si carichino
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Scroll per caricare più video
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Prova selettori multipli per i video
    const videoSelectors = [
      'ytd-video-renderer a#video-title',
      'ytd-video-renderer a[href*="/watch"]',
      'a#video-title',
      'a[href*="/watch?v="]',
      'ytd-rich-item-renderer a[href*="/watch"]'
    ];
    
    let videoElements = [];
    
    for (const selector of videoSelectors) {
      videoElements = document.querySelectorAll(selector);
      if (videoElements.length > 0) {
        console.log(`Trovati video con selettore: ${selector}`);
        break;
      }
    }
    
    if (videoElements.length === 0) {
      throw new Error('Nessun video trovato nei risultati di ricerca');
    }
    
    const links = [];
    
    for (let i = 0; i < Math.min(videoElements.length, automationSettings.maxVideos); i++) {
      const element = videoElements[i];
      if (element && element.href && element.href.includes('/watch')) {
        links.push(element.href);
      }
    }
    
    console.log(`Trovati ${links.length} video`);
    return links;
  } catch (error) {
    console.error('Errore nel raccogliere i link:', error);
    return [];
  }
}

// Funzione per aprire un video e commentare - VERSIONE CORRETTA
async function openVideoAndComment(videoUrl, comment) {
  try {
    console.log(`🎬 Preparando per aprire video: ${videoUrl}`);
    console.log(`💬 Commento da aggiungere: "${comment}"`);
    
    // Controlla se siamo già sul video che vogliamo commentare
    const currentUrl = window.location.href;
    if (currentUrl.includes('/watch?v=') && currentUrl === videoUrl) {
      console.log('📍 Siamo già sul video giusto, procedo con il commento');
      return await addCommentToCurrentVideo(comment);
    }
    
    // Salva lo stato per riprendere dopo il reload
    const automationState = {
      isProcessingVideo: true,
      currentVideoUrl: videoUrl,
      currentVideoIndex: currentVideoIndex,
      videoLinks: videoLinks,
      automationSettings: automationSettings,
      timestamp: Date.now()
    };
    
    console.log('💾 Salvando stato automazione prima del cambio pagina...');
    await chrome.storage.local.set({ automationState: automationState });
    
    // Naviga al video
    console.log('🚀 Navigando al video...');
    window.location.href = videoUrl;
    
    // La funzione si interrompe qui perché la pagina si ricarica
    // Il processo continuerà nella funzione resumeAutomationAfterPageLoad
    return true;
    
  } catch (error) {
    console.error('❌ Errore nel preparare video:', error);
    return false;
  }
}

// Funzione per aggiungere commento al video corrente
async function addCommentToCurrentVideo(comment) {
  try {
    console.log('💬 Iniziando aggiunta commento al video corrente...');
    
    // Controlla se l'utente è loggato
    const isLoggedIn = isUserLoggedIn();
    console.log(`🔐 Utente loggato: ${isLoggedIn}`);
    if (!isLoggedIn) {
      throw new Error('Devi essere loggato per commentare');
    }
    
    // Controlla se siamo effettivamente su una pagina video
    const isVideoPage = window.location.href.includes('/watch?v=');
    console.log(`📺 Pagina video: ${isVideoPage}`);
    if (!isVideoPage) {
      throw new Error('Non siamo su una pagina video');
    }
    
    // Aspetta che la pagina sia completamente caricata
    console.log('⏳ Aspettando caricamento completo pagina...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Scroll verso il basso per caricare i commenti
    console.log('📜 Scrolling per caricare i commenti...');
    window.scrollTo(0, 800);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Scroll ulteriormente per assicurarsi che i commenti siano caricati
    console.log('📜 Scrolling ulteriore per caricare commenti...');
    window.scrollTo(0, 1200);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Debug: controlla cosa è disponibile
    console.log('🔍 Debug elementi commenti disponibili:');
    debugCommentsElements();
    
    // Controlla se i commenti sono disabilitati
    const commentsDisabled = document.querySelector('ytd-message-renderer');
    if (commentsDisabled && commentsDisabled.textContent.includes('disabled')) {
      console.log('❌ I commenti sono disabilitati per questo video');
      throw new Error('I commenti sono disabilitati per questo video');
    }
    
    // Fase 1: Cerca il placeholder dei commenti
    console.log('🔍 FASE 1: Cercando placeholder commenti...');
    const placeholder = document.querySelector('#simplebox-placeholder');
    if (placeholder) {
      console.log('✅ Placeholder trovato!');
      console.log(`📍 Placeholder visibile: ${placeholder.offsetParent !== null}`);
      console.log(`📝 Testo placeholder: "${placeholder.textContent.trim()}"`);
      
      // Clicca sul placeholder per attivare il box commenti
      console.log('👆 Cliccando sul placeholder...');
      simulateClick(placeholder);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Debug dopo il click
      console.log('🔍 Debug dopo click placeholder:');
      debugCommentsElements();
    } else {
      console.log('❌ Placeholder non trovato');
    }
    
    // Fase 2: Trova il box dei commenti
    console.log('🔍 FASE 2: Cercando box commenti attivo...');
    let commentBox = null;
    const commentSelectors = [
      'ytd-commentbox textarea',
      '#comment-textarea textarea',
      'div[contenteditable="true"]',
      'textarea[aria-label*="comment"]',
      'ytd-commentbox #textarea',
      'ytd-commentbox #contenteditable-root',
      '#contenteditable-root[contenteditable="true"]'
    ];
    
    // Prova ogni selettore con timeout aumentato
    for (const selector of commentSelectors) {
      try {
        console.log(`🔍 Provando selettore: ${selector}`);
        commentBox = await waitForElement(selector, 5000);
        
        // Verifica che l'elemento sia interagibile
        const isVisible = commentBox.offsetParent !== null;
        const isEnabled = !commentBox.disabled;
        const isContentEditable = commentBox.contentEditable === 'true' || commentBox.tagName === 'TEXTAREA';
        
        console.log(`✅ Elemento trovato con ${selector}:`);
        console.log(`   📍 Visibile: ${isVisible}`);
        console.log(`   ✏️ Abilitato: ${isEnabled}`);
        console.log(`   📝 Editabile: ${isContentEditable}`);
        console.log(`   🏷️ Tag: ${commentBox.tagName}`);
        console.log(`   🆔 ID: ${commentBox.id}`);
        console.log(`   🎯 Classe: ${commentBox.className}`);
        
        if (isVisible && isEnabled && isContentEditable) {
          console.log('✅ Elemento valido trovato!');
          break;
        } else {
          console.log('❌ Elemento non valido, continuo ricerca...');
          commentBox = null;
        }
      } catch (e) {
        console.log(`❌ ${selector} non trovato`);
      }
    }
    
    if (!commentBox) {
      console.log('❌ ERRORE: Nessun box commenti valido trovato');
      // Debug finale prima di fallire
      console.log('🔍 Debug finale elementi disponibili:');
      debugCommentsElements();
      throw new Error('Impossibile trovare il box dei commenti');
    }
    
    // Fase 3: Attiva il box commenti
    console.log('🔍 FASE 3: Attivando box commenti...');
    console.log('👆 Cliccando sul box commenti...');
    
    // Focus prima del click
    commentBox.focus();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Click simulato
    simulateClick(commentBox);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verifica che il box sia attivo
    const activeElement = document.activeElement;
    console.log(`🎯 Elemento attivo: ${activeElement === commentBox ? 'BOX COMMENTI' : activeElement.tagName + ' ' + activeElement.className}`);
    
    // Fase 4: Inserimento del commento
    console.log('🔍 FASE 4: Inserimento commento...');
    console.log('⌨️ Digitando commento...');
    
    // Salva il contenuto originale
    const originalContent = commentBox.value || commentBox.textContent || commentBox.innerText || '';
    console.log(`📝 Contenuto originale: "${originalContent}"`);
    
    // Inserisci il commento
    await simulateTyping(commentBox, comment);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verifica che il commento sia stato inserito
    const newContent = commentBox.value || commentBox.textContent || commentBox.innerText || '';
    console.log(`📝 Nuovo contenuto: "${newContent}"`);
    
    const commentInserted = newContent.includes(comment);
    console.log(`✅ Commento inserito correttamente: ${commentInserted}`);
    
    if (!commentInserted) {
      console.log('❌ ERRORE: Il commento non è stato inserito correttamente');
      
      // Prova metodo alternativo
      console.log('🔄 Provo metodo alternativo...');
      commentBox.focus();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Pulisci e inserisci direttamente
      if (commentBox.tagName === 'TEXTAREA' || commentBox.tagName === 'INPUT') {
        commentBox.value = comment;
        commentBox.dispatchEvent(new Event('input', { bubbles: true }));
        commentBox.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (commentBox.contentEditable === 'true') {
        commentBox.textContent = comment;
        commentBox.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verifica di nuovo
      const finalContent = commentBox.value || commentBox.textContent || commentBox.innerText || '';
      console.log(`📝 Contenuto finale: "${finalContent}"`);
      
      if (!finalContent.includes(comment)) {
        throw new Error('Il commento non è stato inserito correttamente nemmeno con il metodo alternativo');
      }
    }
    
    // Fase 5: Invio del commento
    console.log('🔍 FASE 5: Invio commento...');
    console.log('🔍 Cercando pulsante invio...');
    
    let submitButton = null;
    const submitSelectors = [
      'ytd-commentbox #submit-button button',
      '#submit-button button',
      'button[aria-label*="Comment"]',
      'ytd-button-renderer button',
      'ytd-commentbox button[aria-label*="Comment"]',
      'ytd-commentbox button[aria-label*="commenta"]',
      'ytd-commentbox button[aria-label*="Commenta"]'
    ];
    
    for (const selector of submitSelectors) {
      try {
        console.log(`🔍 Provando selettore pulsante: ${selector}`);
        const buttons = document.querySelectorAll(selector);
        
        for (const button of buttons) {
          const isVisible = button.offsetParent !== null;
          const isEnabled = !button.disabled;
          const buttonText = button.textContent.trim();
          
          console.log(`   🔘 Pulsante: "${buttonText}"`);
          console.log(`   📍 Visibile: ${isVisible}`);
          console.log(`   ✏️ Abilitato: ${isEnabled}`);
          
          if (isVisible && isEnabled && (buttonText.toLowerCase().includes('comment') || buttonText.toLowerCase().includes('commenta') || buttonText === 'Comment' || buttonText === 'Commenta')) {
            submitButton = button;
            console.log(`✅ Pulsante valido trovato: "${buttonText}"`);
            break;
          }
        }
        
        if (submitButton) break;
      } catch (e) {
        console.log(`❌ ${selector} non trovato`);
      }
    }
    
    if (!submitButton) {
      console.log('❌ ERRORE: Nessun pulsante di invio valido trovato');
      
      // Debug pulsanti disponibili
      console.log('🔍 Debug pulsanti disponibili:');
      const allButtons = document.querySelectorAll('ytd-commentbox button');
      allButtons.forEach((btn, i) => {
        console.log(`   ${i + 1}. "${btn.textContent.trim()}" - Visibile: ${btn.offsetParent !== null} - Abilitato: ${!btn.disabled}`);
      });
      
      throw new Error('Impossibile trovare il pulsante di invio commento abilitato');
    }
    
    console.log('📤 Inviando commento...');
    simulateClick(submitButton);
    
    // Aspetta che il commento venga inviato
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verifica che il commento sia stato inviato
    const commentSent = document.querySelector('ytd-toast-frame-renderer') || 
                       document.querySelector('[class*="toast"]') ||
                       document.querySelector('[id*="toast"]');
    
    if (commentSent) {
      console.log('✅ Commento inviato con successo! (toast rilevato)');
    } else {
      console.log('⚠️ Non è apparso il toast di conferma');
      
      // Verifica alternativa: controlla se il box commenti è tornato al placeholder
      const placeholderReturned = document.querySelector('#simplebox-placeholder');
      if (placeholderReturned) {
        console.log('✅ Il box commenti è tornato al placeholder - probabilmente inviato');
      } else {
        console.log('❓ Stato incerto - il commento potrebbe essere stato inviato');
      }
    }
    
    console.log('🎉 Processo commento completato!');
    return true;
    
  } catch (error) {
    console.error('❌ Errore nell\'aggiungere commento:', error);
    console.error('📍 Stack trace:', error.stack);
    
    // Debug finale in caso di errore
    console.log('🔍 DEBUG FINALE PER ERRORE:');
    console.log('   URL:', window.location.href);
    console.log('   Loggato:', isUserLoggedIn());
    debugCommentsElements();
    
    return false;
  }
}

// Funzione per verificare se l'utente è loggato
function isUserLoggedIn() {
  const loginIndicators = [
    'ytd-topbar-menu-button-renderer',
    'button[aria-label*="Account"]',
    '#avatar-btn',
    'ytd-masthead button[aria-label*="Account"]'
  ];
  
  return loginIndicators.some(selector => document.querySelector(selector));
}

// Funzione per il debug degli elementi
function debugElements() {
  console.log('--- DEBUG ELEMENTI YOUTUBE ---');
  
  const searchSelectors = [
    'input[name="search_query"]',
    'input#search',
    'input[aria-label*="Search"]',
    '#search-input input',
    'ytd-searchbox input',
    '#search input'
  ];
  
  console.log('Ricerca elementi di search:');
  searchSelectors.forEach(selector => {
    const element = document.querySelector(selector);
    console.log(`${selector}: ${element ? 'TROVATO' : 'NON TROVATO'}`);
  });
  
  console.log('User logged in:', isUserLoggedIn());
  console.log('URL corrente:', window.location.href);
  console.log('--- FINE DEBUG ---');
}

// Funzione per il debug specifico dei commenti
function debugCommentsElements() {
  console.log('=== DEBUG COMMENTI DETTAGLIATO ===');
  
  const commentSelectors = [
    'ytd-commentbox textarea',
    '#comment-textarea textarea',
    'div[contenteditable="true"]',
    'textarea[aria-label*="comment"]',
    'ytd-commentbox #textarea',
    '#simplebox-placeholder',
    'ytd-commentbox #contenteditable-root',
    '#contenteditable-root[contenteditable="true"]'
  ];
  
  console.log('🔍 Elementi box commenti:');
  let foundElements = 0;
  commentSelectors.forEach((selector, index) => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      foundElements++;
      console.log(`✅ ${index + 1}. ${selector}: ${elements.length} elementi`);
      elements.forEach((el, i) => {
        const isVisible = el.offsetParent !== null;
        const isEnabled = !el.disabled;
        const isEditable = el.contentEditable === 'true' || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT';
        const content = (el.value || el.textContent || el.innerText || '').trim();
        
        console.log(`   📍 Elemento ${i + 1}:`);
        console.log(`      🏷️ Tag: ${el.tagName}`);
        console.log(`      🆔 ID: ${el.id}`);
        console.log(`      🎯 Classe: ${el.className}`);
        console.log(`      👁️ Visibile: ${isVisible}`);
        console.log(`      ✏️ Abilitato: ${isEnabled}`);
        console.log(`      📝 Editabile: ${isEditable}`);
        console.log(`      📄 Contenuto: "${content}"`);
        console.log(`      📐 Posizione: ${el.getBoundingClientRect().top}px dall'alto`);
        console.log(`      🔍 Selettore funzionante: ${selector}`);
        
        if (isVisible && isEnabled && isEditable) {
          console.log(`      ✅ ELEMENTO VALIDO PER COMMENTI`);
        } else {
          console.log(`      ❌ Elemento non valido - V:${isVisible} E:${isEnabled} Ed:${isEditable}`);
        }
      });
    } else {
      console.log(`❌ ${index + 1}. ${selector}: nessun elemento trovato`);
    }
  });
  
  console.log(`📊 Totale selettori con elementi: ${foundElements}/${commentSelectors.length}`);
  
  const submitSelectors = [
    'ytd-commentbox #submit-button button',
    '#submit-button button',
    'button[aria-label*="Comment"]',
    'ytd-button-renderer button',
    'ytd-commentbox button[aria-label*="Comment"]',
    'ytd-commentbox button[aria-label*="commenta"]',
    'ytd-commentbox button[aria-label*="Commenta"]'
  ];
  
  console.log('🔍 Elementi pulsanti invio:');
  let foundButtons = 0;
  submitSelectors.forEach((selector, index) => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      foundButtons++;
      console.log(`✅ ${index + 1}. ${selector}: ${elements.length} elementi`);
      elements.forEach((el, i) => {
        const isVisible = el.offsetParent !== null;
        const isEnabled = !el.disabled;
        const buttonText = el.textContent.trim();
        const ariaLabel = el.getAttribute('aria-label') || '';
        
        console.log(`   📍 Pulsante ${i + 1}:`);
        console.log(`      🏷️ Tag: ${el.tagName}`);
        console.log(`      🆔 ID: ${el.id}`);
        console.log(`      🎯 Classe: ${el.className}`);
        console.log(`      👁️ Visibile: ${isVisible}`);
        console.log(`      ✏️ Abilitato: ${isEnabled}`);
        console.log(`      📝 Testo: "${buttonText}"`);
        console.log(`      🏷️ Aria-label: "${ariaLabel}"`);
        console.log(`      🔍 Selettore funzionante: ${selector}`);
        
        if (isVisible && isEnabled) {
          console.log(`      ✅ PULSANTE VALIDO`);
        } else {
          console.log(`      ❌ Pulsante non valido - V:${isVisible} E:${isEnabled}`);
        }
      });
    } else {
      console.log(`❌ ${index + 1}. ${selector}: nessun elemento trovato`);
    }
  });
  
  console.log(`📊 Totale selettori pulsanti con elementi: ${foundButtons}/${submitSelectors.length}`);
  
  // Debug placeholder
  const placeholder = document.querySelector('#simplebox-placeholder');
  console.log('🔍 Analisi placeholder commenti:');
  if (placeholder) {
    console.log('   ✅ Placeholder trovato');
    console.log(`   📝 Testo: "${placeholder.textContent.trim()}"`);
    console.log(`   👁️ Visibile: ${placeholder.offsetParent !== null}`);
    console.log(`   🎯 Classe: ${placeholder.className}`);
    console.log(`   📐 Posizione: ${placeholder.getBoundingClientRect().top}px dall'alto`);
  } else {
    console.log('   ❌ Placeholder non trovato');
  }
  
  // Debug messaggi di errore
  const errorMessages = document.querySelectorAll('ytd-message-renderer');
  if (errorMessages.length > 0) {
    console.log('⚠️ Messaggi di errore trovati:');
    errorMessages.forEach((msg, i) => {
      console.log(`   ${i + 1}. "${msg.textContent.trim()}"`);
    });
  } else {
    console.log('✅ Nessun messaggio di errore rilevato');
  }
  
  // Debug stato della pagina
  console.log('📊 Stato pagina:');
  console.log(`   🌐 URL: ${window.location.href}`);
  console.log(`   📺 È pagina video: ${window.location.href.includes('/watch?v=')}`);
  console.log(`   🔐 Utente loggato: ${isUserLoggedIn()}`);
  console.log(`   📜 Scroll position: ${window.scrollY}px`);
  console.log(`   📏 Altezza pagina: ${document.body.scrollHeight}px`);
  
  console.log('=== FINE DEBUG COMMENTI ===');
}

// Funzione principale dell'automazione - VERSIONE AGGIORNATA
async function runAutomation() {
  try {
    sendStatusUpdate('Inizio automazione...', 'success');
    
    // Debug iniziale
    debugElements();
    
    // Verifica se l'utente è loggato
    if (!isUserLoggedIn()) {
      throw new Error('Devi essere loggato su YouTube per commentare');
    }
    
    sendStatusUpdate('Inizio ricerca video...', 'success');
    
    // Effettua la ricerca
    const searchSuccess = await searchVideos(automationSettings.keyword);
    if (!searchSuccess) {
      throw new Error('Ricerca fallita');
    }
    
    // Raccogli i link dei video
    sendStatusUpdate('Raccogliendo link dei video...', 'success');
    videoLinks = await collectVideoLinks();
    
    if (videoLinks.length === 0) {
      throw new Error('Nessun video trovato');
    }
    
    sendStatusUpdate(`Trovati ${videoLinks.length} video. Inizio commentazione...`, 'success');
    
    // Inizia con il primo video
    currentVideoIndex = 0;
    console.log(`🎬 Iniziando con video ${currentVideoIndex + 1}/${videoLinks.length}`);
    
    // Processa il primo video
    // Il resto sarà gestito automaticamente dalla logica di continuazione
    const firstVideoUrl = videoLinks[currentVideoIndex];
    console.log(`📍 Primo video: ${firstVideoUrl}`);
    
    await openVideoAndComment(firstVideoUrl, getRandomComment());
    
  } catch (error) {
    console.error('❌ Errore nell\'automazione:', error);
    debugElements(); // Debug in caso di errore
    sendStatusUpdate(`Errore nell'automazione: ${error.message}`, 'error');
    chrome.runtime.sendMessage({
      action: 'automationError',
      error: error.message
    });
    
    // Pulisci lo stato in caso di errore
    isAutomationRunning = false;
    chrome.storage.local.set({isRunning: false});
    await chrome.storage.local.remove(['automationState']);
  }
}

// Funzione per inviare aggiornamenti di stato
function sendStatusUpdate(message, type = 'success') {
  chrome.runtime.sendMessage({
    action: 'updateStatus',
    message: message,
    type: type
  });
}

// Funzione per fermare l'automazione
function stopAutomation() {
  isAutomationRunning = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  chrome.storage.local.set({isRunning: false});
  sendStatusUpdate('Automazione fermata!', 'warning');
}

// Funzione per scegliere un commento randomico
function getRandomComment() {
  if (!automationSettings.comments || automationSettings.comments.length === 0) {
    console.error('❌ Nessun commento disponibile');
    return 'Great video!'; // fallback
  }
  
  const randomIndex = Math.floor(Math.random() * automationSettings.comments.length);
  const selectedComment = automationSettings.comments[randomIndex];
  
  console.log(`🎲 Scelto commento randomico ${randomIndex + 1}/${automationSettings.comments.length}: "${selectedComment}"`);
  
  return selectedComment;
}

// Listener per i messaggi dal popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    // Ping per verificare che il content script sia pronto
    sendResponse({success: true, ready: true});
    return true;
  } else if (request.action === 'startAutomation') {
    if (isAutomationRunning) {
      sendResponse({success: false, message: 'Automazione già in corso'});
      return true;
    }
    
    automationSettings = {
      keyword: request.keyword,
      comments: request.comments || [request.comment], // Supporta sia singolo che array
      commentMode: request.commentMode || 'single',
      delay: request.delay,
      maxVideos: request.maxVideos
    };
    
    // Log della configurazione
    console.log('🚀 Configurazione automazione:');
    console.log(`📝 Modalità commenti: ${automationSettings.commentMode}`);
    console.log(`💬 Commenti disponibili: ${automationSettings.comments.length}`);
    console.log(`🔍 Keyword: ${automationSettings.keyword}`);
    console.log(`⏱️ Delay: ${automationSettings.delay}ms`);
    console.log(`🎯 Max video: ${automationSettings.maxVideos}`);
    
    if (automationSettings.commentMode === 'json') {
      console.log('🎲 Commenti:', automationSettings.comments);
    }
    
    isAutomationRunning = true;
    currentVideoIndex = 0;
    videoLinks = [];
    
    chrome.storage.local.set({isRunning: true});
    
    // Avvia l'automazione
    runAutomation();
    
    sendResponse({success: true});
    return true;
  } else if (request.action === 'stopAutomation') {
    stopAutomation();
    sendResponse({success: true});
    return true;
  }
});

// Pulisci lo stato quando la pagina viene ricaricata
window.addEventListener('beforeunload', () => {
  chrome.storage.local.set({isRunning: false});
});

// Aggiungi funzione di debug globale per testing manuale
window.youtubeAutoCommenterDebug = function() {
  console.log('=== YOUTUBE AUTO COMMENTER DEBUG ===');
  debugElements();
  
  // Test dei selettori
  console.log('\n--- TEST SELETTORI ---');
  
  const searchSelectors = [
    'input[name="search_query"]',
    'input#search',
    'input[aria-label*="Search"]',
    '#search-input input',
    'ytd-searchbox input',
    '#search input'
  ];
  
  console.log('Elementi di ricerca disponibili:');
  searchSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`✓ ${selector}: ${elements.length} elementi`);
      elements.forEach((el, i) => {
        console.log(`  ${i + 1}. Visibile: ${el.offsetParent !== null}, Tipo: ${el.tagName}`);
      });
    }
  });
  
  const videoSelectors = [
    'ytd-video-renderer a#video-title',
    'ytd-video-renderer a[href*="/watch"]',
    'a#video-title',
    'a[href*="/watch?v="]',
    'ytd-rich-item-renderer a[href*="/watch"]'
  ];
  
  console.log('\nElementi video disponibili:');
  videoSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`✓ ${selector}: ${elements.length} elementi`);
    }
  });
  
  // Debug commenti se siamo su una pagina video
  if (window.location.href.includes('/watch?v=')) {
    console.log('\n--- DEBUG COMMENTI ---');
    debugCommentsElements();
  }
  
  console.log('\nUtente loggato:', isUserLoggedIn());
  console.log('Automazione in corso:', isAutomationRunning);
  console.log('URL corrente:', window.location.href);
  console.log('=== FINE DEBUG ===');
};

// Aggiungi funzione di debug specifica per i commenti
window.youtubeAutoCommenterDebugComments = function() {
  console.log('=== DEBUG COMMENTI YOUTUBE ===');
  
  if (!window.location.href.includes('/watch?v=')) {
    console.log('⚠️ Non sei su una pagina video. Vai su un video di YouTube per testare i commenti.');
    return;
  }
  
  console.log('📍 Pagina video rilevata');
  console.log('🔐 Utente loggato:', isUserLoggedIn());
  
  debugCommentsElements();
  
  // Test manuale per aprire il box commenti
  console.log('\n--- SUGGERIMENTI PER IL TEST ---');
  const placeholder = document.querySelector('#simplebox-placeholder');
  if (placeholder) {
    console.log('✅ Placeholder trovato, puoi testare cliccandoci sopra');
    console.log('💡 Per testare: document.querySelector("#simplebox-placeholder").click()');
  } else {
    console.log('❌ Placeholder non trovato');
  }
  
  console.log('\n🧪 Per un test completo passo-passo:');
  console.log('   youtubeAutoCommenterTestComment("Il mio commento di test")');
  console.log('=== FINE DEBUG COMMENTI ===');
};

// Aggiungi funzione di test manuale per commentare - VERSIONE AGGIORNATA
window.youtubeAutoCommenterTestComment = async function(testComment = 'Test commento automatico 👍') {
  console.log('🧪 === TEST MANUALE COMMENTI ===');
  console.log(`📝 Commento di test: "${testComment}"`);
  
  try {
    // Verifica prerequisiti
    console.log('🔍 STEP 1: Verifica prerequisiti...');
    
    if (!window.location.href.includes('/watch?v=')) {
      console.log('❌ Non sei su una pagina video di YouTube');
      return false;
    }
    console.log('✅ Pagina video YouTube rilevata');
    
    if (!isUserLoggedIn()) {
      console.log('❌ Non sei loggato su YouTube');
      return false;
    }
    console.log('✅ Utente loggato');
    
    // Usa la nuova funzione di aggiunta commento
    console.log('🔍 STEP 2: Eseguendo test completo...');
    const success = await addCommentToCurrentVideo(testComment);
    
    if (success) {
      console.log('✅ Test completato con successo!');
      console.log('🎉 Il commento dovrebbe essere stato aggiunto');
      return true;
    } else {
      console.log('❌ Test fallito');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error);
    return false;
  }
  
  console.log('🧪 === FINE TEST MANUALE ===');
};

// Funzione per riprendere l'automazione dopo il reload della pagina
async function resumeAutomationAfterPageLoad() {
  try {
    console.log('🔄 Controllando se c\'è un\'automazione da riprendere...');
    
    // Controlla se c'è uno stato salvato
    const result = await chrome.storage.local.get(['automationState']);
    const automationState = result.automationState;
    
    if (!automationState || !automationState.isProcessingVideo) {
      console.log('📭 Nessuna automazione da riprendere');
      return;
    }
    
    // Controlla se lo stato non è troppo vecchio (max 5 minuti)
    const timeDiff = Date.now() - automationState.timestamp;
    if (timeDiff > 300000) { // 5 minuti
      console.log('⏰ Stato automazione troppo vecchio, lo ignoro');
      await chrome.storage.local.remove(['automationState']);
      return;
    }
    
    console.log('🔄 Riprendendo automazione...');
    console.log(`📍 Video corrente: ${automationState.currentVideoUrl}`);
    
    // Ripristina le variabili globali
    currentVideoIndex = automationState.currentVideoIndex;
    videoLinks = automationState.videoLinks;
    automationSettings = automationState.automationSettings;
    isAutomationRunning = true;
    
    // Scegli un commento randomico
    const randomComment = getRandomComment();
    console.log(`💬 Commento scelto randomicamente: "${randomComment}"`);

    console.log('✅ Siamo sul video giusto, procedo con il commento');
    
    // Aggiorna lo stato
    sendStatusUpdate(`Commentando video ${currentVideoIndex + 1}/${videoLinks.length} (ripreso dopo reload)...`, 'success');
    
    // Commenta il video corrente
    const success = await addCommentToCurrentVideo(randomComment);
    
    if (success) {
      console.log('✅ Commento aggiunto con successo');
      sendStatusUpdate(`Video ${currentVideoIndex + 1} commentato con successo!`, 'success');
    } else {
      console.log('❌ Errore nell\'aggiungere commento');
      sendStatusUpdate(`Errore nel commentare video ${currentVideoIndex + 1}`, 'error');
    }
    
    // Pulisci lo stato corrente
    await chrome.storage.local.remove(['automationState']);
    
    // Continua con il prossimo video se ce ne sono altri
    await continueAutomationWithNextVideo();
    
  } catch (error) {
    console.error('❌ Errore nel riprendere automazione:', error);
    await chrome.storage.local.remove(['automationState']);
    sendStatusUpdate('Errore nel riprendere automazione', 'error');
  }
}

// Funzione per continuare con il prossimo video
async function continueAutomationWithNextVideo() {
  try {
    console.log('🔄 Continuando con il prossimo video...');
    
    // Incrementa l'indice del video
    currentVideoIndex++;
    
    // Controlla se ci sono altri video da processare
    console.log('currentVideoIndex', currentVideoIndex)
    console.log('videoLinks.length', videoLinks.length)
    console.log('!isAutomationRunning', !isAutomationRunning  )

    if (currentVideoIndex >= videoLinks.length || !isAutomationRunning) {
      console.log('🎉 Automazione completata!');
      sendStatusUpdate('Automazione completata!', 'success');
      chrome.runtime.sendMessage({action: 'automationComplete'});
      isAutomationRunning = false;
      chrome.storage.local.set({isRunning: false});
      return;
    }
    
    // Aspetta il delay prima del prossimo video
    const remainingTime = automationSettings.delay / 1000;
    console.log(`⏳ Aspettando ${remainingTime} secondi prima del prossimo video...`);
    sendStatusUpdate(`Aspettando ${remainingTime} secondi prima del prossimo video...`, 'warning');
    
    await new Promise(resolve => {
      timeoutId = setTimeout(resolve, automationSettings.delay);
    });
    
    // Processa il prossimo video
    if (isAutomationRunning) {
      const nextVideoUrl = videoLinks[currentVideoIndex];
      console.log(`🎬 Prossimo video: ${nextVideoUrl}`);
      
      await openVideoAndComment(nextVideoUrl, getRandomComment());
    }
    
  } catch (error) {
    console.error('❌ Errore nel continuare automazione:', error);
    sendStatusUpdate('Errore nel continuare automazione', 'error');
    isAutomationRunning = false;
    chrome.storage.local.set({isRunning: false});
  }
}

// Controlla se c'è un'automazione da riprendere quando la pagina si carica
setTimeout(async () => {
  if (window.location.href.includes('youtube.com')) {
    console.log('YouTube rilevato, controllo automazione da riprendere...');
    await resumeAutomationAfterPageLoad();
  }
}, 3000); // Aspetta 3 secondi che la pagina si carichi completamente

console.log('YouTube Auto Commenter Content Script loaded');
console.log('📋 === FUNZIONI DI DEBUG DISPONIBILI ===');
console.log('   youtubeAutoCommenterDebug() - Debug generale estensione');
console.log('   youtubeAutoCommenterDebugComments() - Debug specifico commenti');
console.log('   youtubeAutoCommenterTestComment("Il mio commento") - Test manuale aggiunta commento');
console.log('💡 Usa queste funzioni nella console per diagnosticare problemi');
console.log('🔍 Tutti i log sono dettagliati per aiutarti a identificare il problema');
console.log('=========================================='); 