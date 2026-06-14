# Informativa sulla privacy di Smart Scroll Navigator

**Ultimo aggiornamento**: 14 giugno 2026

## Raccolta dei dati

Smart Scroll Navigator **non** raccoglie né trasmette cronologia di navigazione, URL o domini visitati, titoli o contenuti delle pagine, termini di ricerca, dati inseriti nei moduli, posizioni di scorrimento, contenuto dei segnalibri salvati, informazioni sull'account o altri contenuti personali.

L'estensione include statistiche anonime facoltative sull'utilizzo. La funzione è disattivata per impostazione predefinita sia per i nuovi utenti sia per quelli esistenti. I dati vengono raccolti e trasmessi solo dopo l'attivazione esplicita di **Invia statistiche anonime sull'utilizzo** nella pagina delle opzioni.

Quando la funzione è attiva, l'estensione può inviare:

- Impostazioni enumerate o raggruppate per intervalli, come disposizione dei pulsanti, intervallo delle dimensioni, stile delle icone e opzioni degli strumenti di lettura.
- Conteggi giornalieri aggregati in UTC delle azioni consentite, come uso dei pulsanti inizio/fine, comandi da tastiera, salti di avanzamento, azioni sui segnalibri e sull'indice.
- Conteggi giornalieri aggregati in UTC delle attivazioni o disattivazioni dell'estensione e delle funzioni avanzate.
- Versione dell'estensione e lingua dell'interfaccia selezionata.

La richiesta di statistiche non contiene URL, domini, titoli, testo delle pagine, dati dei segnalibri, elenchi di siti attivati, colori personalizzati esatti, identificatori utente persistenti, identificatori pubblicitari o impronte digitali del dispositivo. L'estensione non crea un ID permanente di installazione o utente.

## Archiviazione locale

L'estensione utilizza l'API di archiviazione integrata di Chrome (`chrome.storage.sync`) per salvare preferenze quali velocità di scorrimento, posizione dei pulsanti, colori, opacità e impostazioni degli strumenti di lettura. Questi dati vengono sincronizzati tramite l'infrastruttura di Google tra i dispositivi su cui è stato eseguito l'accesso a Chrome. Se le statistiche facoltative sono attive, solo il sottoinsieme enumerato o raggruppato descritto sopra può essere incluso nella richiesta; i valori personalizzati esatti non vengono inviati.

Quando si utilizzano le funzioni corrispondenti, l'estensione può anche salvare in `chrome.storage.local` lo stato di attivazione per sito e i segnalibri della posizione di scorrimento. Questi contengono URL, avanzamento approssimativo, titolo della pagina e metadati del contenitore di scorrimento per consentire di riprendere successivamente. I dati restano nel browser e non vengono trasmessi allo sviluppatore o a terzi.

Quando la navigazione intelligente per sezioni è attiva, l'estensione può leggere le intestazioni visibili della pagina corrente per creare un indice in memoria. L'indice, i testi delle intestazioni e la struttura della pagina non vengono salvati nell'archivio Chrome né trasmessi allo sviluppatore o a terzi.

Il consenso alle statistiche, fino a sette giorni UTC di conteggi aggregati in attesa e un lotto temporaneo per i nuovi tentativi sono memorizzati in `chrome.storage.local`. La disattivazione interrompe immediatamente la nuova raccolta, elimina i dati in attesa, arresta la pianificazione degli invii e revoca le autorizzazioni facoltative. Le statistiche aggregate già ricevute dal server scadono secondo i periodi indicati di seguito.

## Autorizzazioni host

L'estensione richiede autorizzazioni host estese (`<all_urls>`) esclusivamente per inserire pulsanti mobili di scorrimento nelle pagine Web. Questa autorizzazione è necessaria per la funzione principale. L'estensione **non** legge, intercetta, raccoglie, archivia o trasmette il contenuto delle pagine visitate.

L'autorizzazione per l'endpoint delle statistiche e l'autorizzazione di pianificazione `alarms` sono facoltative. Chrome le richiede solo quando si attivano le statistiche anonime e vengono utilizzate esclusivamente per inviare lotti aggregati di dimensioni limitate a:

`https://page-scroll-master-analytics.kscje-apps.workers.dev/v1/events`

## Elaborazione e conservazione delle statistiche

L'endpoint è gestito dallo sviluppatore dell'estensione tramite Cloudflare Workers e Cloudflare D1. Non vengono utilizzati SDK di statistiche di terze parti, reti pubblicitarie, pixel di tracciamento, cookie, script remoti o broker di dati.

I lotti accettati vengono convertiti immediatamente in contatori giornalieri aggregati. Gli eventi delle singole azioni non vengono conservati. Gli ID casuali dei lotti, usati solo per evitare duplicati durante i nuovi tentativi, vengono conservati per un massimo di 30 giorni. Le statistiche giornaliere aggregate vengono conservate per un massimo di 13 mesi.

Cloudflare può elaborare normali metadati di rete, inclusi indirizzo IP e intestazioni della richiesta, per fornire e proteggere il servizio secondo le proprie politiche infrastrutturali. L'estensione non aggiunge URL delle pagine, referrer, dati personalizzati dello user agent o identificatori persistenti alle richieste. Lo sviluppatore non usa i metadati di rete per identificare gli utenti o creare profili.

I dati vengono usati solo per valutare l'utilizzo delle funzioni, la distribuzione delle impostazioni, i valori predefiniti e le priorità del prodotto. Non vengono venduti, utilizzati per la pubblicità o condivisi per la profilazione.

## Uso limitato del Chrome Web Store

L'uso delle informazioni ricevute dalle API di Chrome è conforme alla [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use), inclusi i requisiti di Uso limitato. I dati vengono usati solo per fornire o migliorare l'unica finalità dell'estensione e non vengono trasferiti o utilizzati per pubblicità personalizzata, decisioni sul credito o vendita a broker di dati.

## Privacy dei minori

L'estensione non raccoglie consapevolmente informazioni personali da nessuno, inclusi i minori di 13 anni.

## Modifiche a questa informativa

Eventuali modifiche saranno riportate in una versione aggiornata dell'estensione e in questa pagina.

## Contatti

Per domande su questa informativa: **kscj.ty@gmail.com**
