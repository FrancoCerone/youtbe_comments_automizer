// TEST SELETTORI YOUTUBE - Da eseguire nella console di YouTube
// Copia e incolla questo codice nella console del browser su youtube.com

console.log('🧪 TESTING SELETTORI YOUTUBE AUTO COMMENTER');

// Test selettori ricerca
console.log('\n📍 TEST SELETTORI RICERCA:');
const searchSelectors = [
  'input[name="search_query"]',
  'input#search',
  'input[aria-label*="Search"]',
  '#search-input input',
  'ytd-searchbox input',
  '#search input'
];

searchSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(`✅ ${selector}: ${elements.length} elementi trovati`);
    elements.forEach((el, i) => {
      console.log(`   ${i + 1}. Visibile: ${el.offsetParent !== null}, Tipo: ${el.tagName}, Placeholder: "${el.placeholder}"`);
    });
  } else {
    console.log(`❌ ${selector}: nessun elemento trovato`);
  }
});

// Test selettori video
console.log('\n🎬 TEST SELETTORI VIDEO:');
const videoSelectors = [
  'ytd-video-renderer a#video-title',
  'ytd-video-renderer a[href*="/watch"]',
  'a#video-title',
  'a[href*="/watch?v="]',
  'ytd-rich-item-renderer a[href*="/watch"]'
];

videoSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(`✅ ${selector}: ${elements.length} elementi trovati`);
    // Mostra i primi 3 titoli come esempio
    for (let i = 0; i < Math.min(3, elements.length); i++) {
      console.log(`   ${i + 1}. "${elements[i].textContent.trim().substring(0, 50)}..."`);
    }
  } else {
    console.log(`❌ ${selector}: nessun elemento trovato`);
  }
});

// Test selettori commenti
console.log('\n💬 TEST SELETTORI COMMENTI:');
const commentSelectors = [
  'ytd-commentbox textarea',
  '#comment-textarea textarea',
  'div[contenteditable="true"]',
  'textarea[aria-label*="comment"]',
  'ytd-commentbox #textarea'
];

commentSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(`✅ ${selector}: ${elements.length} elementi trovati`);
  } else {
    console.log(`❌ ${selector}: nessun elemento trovato`);
  }
});

// Test login
console.log('\n👤 TEST LOGIN:');
const loginSelectors = [
  'ytd-topbar-menu-button-renderer',
  'button[aria-label*="Account"]',
  '#avatar-btn',
  'ytd-masthead button[aria-label*="Account"]'
];

let isLoggedIn = false;
loginSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(`✅ ${selector}: ${elements.length} elementi trovati`);
    isLoggedIn = true;
  } else {
    console.log(`❌ ${selector}: nessun elemento trovato`);
  }
});

console.log(`\n🔐 Stato login: ${isLoggedIn ? 'LOGGATO' : 'NON LOGGATO'}`);

// Test pulsanti submit
console.log('\n📤 TEST PULSANTI SUBMIT:');
const submitSelectors = [
  'ytd-commentbox #submit-button button',
  '#submit-button button',
  'button[aria-label*="Comment"]',
  'ytd-button-renderer button'
];

submitSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(`✅ ${selector}: ${elements.length} elementi trovati`);
  } else {
    console.log(`❌ ${selector}: nessun elemento trovato`);
  }
});

// Informazioni generali
console.log('\n📊 INFORMAZIONI GENERALI:');
console.log(`URL: ${window.location.href}`);
console.log(`Pagina: ${document.title}`);
console.log(`User Agent: ${navigator.userAgent.split(' ').slice(-2).join(' ')}`);
console.log(`Timestamp: ${new Date().toISOString()}`);

console.log('\n🏁 TEST COMPLETATO');
console.log('📋 Usa questi risultati per troubleshooting dell\'estensione');

// Suggerimenti
console.log('\n💡 SUGGERIMENTI:');
if (!isLoggedIn) {
  console.log('⚠️  Effettua il login per commentare');
}

const hasSearchElements = searchSelectors.some(selector => document.querySelectorAll(selector).length > 0);
if (!hasSearchElements) {
  console.log('⚠️  Nessun elemento di ricerca trovato - ricarica la pagina');
}

const hasVideoElements = videoSelectors.some(selector => document.querySelectorAll(selector).length > 0);
if (!hasVideoElements) {
  console.log('⚠️  Nessun video trovato - vai alla home o fai una ricerca');
}

console.log('✨ Fine test selettori!'); 