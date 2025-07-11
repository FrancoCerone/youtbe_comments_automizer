# 🎬 YouTube Auto Commenter Extension

Un'estensione Chrome che automatizza l'inserimento di commenti su YouTube per parole chiave specifiche.

## ⚠️ IMPORTANTE - AVVISO LEGALE

**ATTENZIONE:** Questa estensione è stata creata solo per scopi educativi e di ricerca. L'uso di automazioni per commentare su YouTube potrebbe violare i termini di servizio della piattaforma e portare alla sospensione o al ban del tuo account.

**Usa questa estensione a tuo rischio e responsabilità.**

## 🚀 Caratteristiche

- 🔍 Ricerca automatica di video con parole chiave
- 💬 Inserimento automatico di commenti personalizzati
- ⏱️ Controllo del tempo tra commenti (minimo 30 secondi)
- 📊 Limitazione del numero di video da commentare
- 🛑 Possibilità di fermare l'automazione in qualsiasi momento
- 💾 Salvataggio automatico delle impostazioni
- 🔗 Test automatico della connessione con YouTube
- 📡 Indicatore di stato della connessione in tempo reale
- 🔄 Iniezione automatica del content script se necessario
- 🐛 Strumenti di debug avanzati per troubleshooting

## 📦 Installazione

1. **Scarica l'estensione**: Clona o scarica tutti i file di questa repository
2. **Apri Chrome**: Vai su `chrome://extensions/`
3. **Abilita Developer Mode**: Attiva l'interruttore "Modalità sviluppatore" in alto a destra
4. **Carica l'estensione**: Clicca "Carica estensione non pacchettizzata" e seleziona la cartella contenente i file
5. **Verifica l'installazione**: Dovresti vedere l'icona dell'estensione nella barra degli strumenti

## 🎯 Come usare

1. **Vai su YouTube**: Apri https://www.youtube.com
2. **Apri l'estensione**: Clicca sull'icona dell'estensione nella barra degli strumenti
3. **Verifica la connessione**: 
   - Controlla l'indicatore di stato (✅ Connesso / ❌ Disconnesso)
   - Se necessario, clicca "🔗 Testa Connessione"
4. **Configura le impostazioni**:
   - **Parola chiave**: Inserisci cosa vuoi cercare (es: "tutorial javascript")
   - **Commento**: Scrivi il commento che verrà inserito automaticamente
   - **Tempo tra commenti**: Imposta i secondi di attesa tra un commento e l'altro (minimo 30)
   - **Numero massimo di video**: Limita quanti video commentare (massimo 20)
5. **Avvia l'automazione**: Clicca "🚀 Inizia Automazione" (disponibile solo se connesso)
6. **Monitora il progresso**: Vedrai aggiornamenti di stato in tempo reale
7. **Ferma se necessario**: Clicca "⏹️ Ferma Automazione" per interrompere

## 🔧 Funzionalità tecniche

### Sicurezza e protezione
- Velocità di digitazione variabile per sembrare più naturale
- Ritardi casuali per evitare pattern sospetti
- Timeout minimo di 30 secondi tra commenti
- Interruzione automatica in caso di errore

### Gestione degli errori
- Rilevamento automatico di elementi mancanti
- Gestione di timeout e connessioni lente
- Recupero da errori di caricamento pagina

## 📋 Requisiti tecnici

- Google Chrome (versione 88 o superiore)
- Connessione internet attiva
- Account YouTube valido

## 🛠️ Struttura del progetto

```
chrome-extension/
├── manifest.json      # Configurazione dell'estensione
├── popup.html         # Interfaccia utente
├── popup.js          # Logica dell'interfaccia
├── content.js        # Script di automazione
├── background.js     # Script di background
├── icon16.png        # Icona 16x16
├── icon48.png        # Icona 48x48
├── icon128.png       # Icona 128x128
└── README.md         # Questo file
```

## 🔒 Privacy e sicurezza

- L'estensione non raccoglie dati personali
- Tutte le impostazioni sono salvate localmente
- Non invia informazioni a server esterni
- Accesso limitato solo a youtube.com

## 🚫 Limitazioni

- Funziona solo su YouTube
- Richiede un account YouTube per commentare
- Potrebbe non funzionare se YouTube cambia la struttura del sito
- Soggetto ai rate limit di YouTube

## 🐛 Risoluzione problemi

### L'estensione non si avvia
- Assicurati di essere su youtube.com
- Ricarica la pagina di YouTube
- Controlla che l'estensione sia attiva
- Verifica di essere loggato su YouTube

### Errore "ricarica la pagina di YouTube"
- **Causa**: Il content script non è caricato o non comunica
- **Soluzione rapida**: Ricarica la pagina di YouTube (F5)
- **Test connessione**: Usa il pulsante "🔗 Testa Connessione"
- **Verifica stato**: Controlla l'indicatore di connessione (✅/❌)
- **Guida completa**: Vedi `RISOLUZIONE-ERRORE-RICARICA.md`

### Errore "Elemento input#search non trovato"
- Apri la console del browser (F12)
- Digita `youtubeAutoCommenterDebug()` e premi Invio
- Controlla quali selettori sono disponibili
- Ricarica la pagina di YouTube

### I commenti non vengono inseriti
- **Verifica login**: Assicurati di essere loggato su YouTube
- **Controlla video**: I commenti potrebbero essere disabilitati per il video
- **Scroll manuale**: Fai scroll fino ai commenti prima di avviare l'automazione
- **Debug specifico**: Usa `youtubeAutoCommenterDebugComments()` nella console
- **Test manuale**: Prova a commentare manualmente prima dell'automazione
- **Guida completa**: Vedi `RISOLUZIONE-ERRORI-COMMENTI.md`

### L'automazione si ferma
- Controlla la connessione internet
- Verifica che YouTube non abbia mostrato un CAPTCHA
- Riavvia l'automazione con un tempo di attesa maggiore
- Controlla la console per errori specifici

## 🔧 Debug e Testing

### Debug manuale
1. Apri la console del browser (F12)
2. Vai su youtube.com
3. Usa una di queste funzioni:
   - `youtubeAutoCommenterDebug()` - Debug generale
   - `youtubeAutoCommenterDebugComments()` - Debug specifico commenti
4. Controlla l'output per vedere quali elementi sono disponibili

### Cosa controlla il debug:
- Disponibilità degli elementi di ricerca
- Elementi video presenti nella pagina
- Stato di login dell'utente
- Automazione in corso
- **Elementi per i commenti** (box, pulsanti, placeholder)
- **Messaggi di errore** di YouTube

### Log della console
L'estensione scrive log dettagliati nella console. Controlla:
- Messaggi di caricamento
- Selettori trovati/non trovati
- Errori specifici
- Stato dell'automazione

## 📞 Supporto

Se riscontri problemi:
1. Usa la funzione di debug `youtubeAutoCommenterDebug()`
2. Controlla la console del browser (F12) per errori
3. Verifica di avere l'ultima versione dell'estensione
4. Prova a riavviare Chrome
5. Assicurati che YouTube non abbia cambiato la struttura della pagina

## ⚖️ Disclaimer

Questo software è fornito "così com'è" senza garanzie. L'autore non si assume responsabilità per eventuali danni derivanti dall'uso di questa estensione, inclusi ma non limitati a:
- Sospensione o ban dell'account YouTube
- Violazione dei termini di servizio
- Perdita di dati o altri danni

Usa responsabilmente e nel rispetto delle politiche di YouTube.

## 📝 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file LICENSE per maggiori dettagli.

---

**Ricorda: L'automazione dovrebbe essere usata con moderazione e rispetto per la piattaforma e gli altri utenti.** 