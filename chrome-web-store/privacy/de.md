# Datenschutzrichtlinie für Smart Scroll Navigator

**Letzte Aktualisierung**: 8. August 2026

## Datenerhebung

Bei der normalen Scroll-Nutzung erhebt oder überträgt Smart Scroll Navigator **keinen** Browserverlauf, besuchte URLs oder Domains, Seitentitel, Seiteninhalte, Suchbegriffe, Formulareingaben, Scrollpositionen, Lesezeicheninhalte oder Kontoinformationen. Die einzige Ausnahme sind Daten, die Sie ausdrücklich über das unten beschriebene optionale Feedback-Formular senden.

Aktuelle Versionen enthalten keine anonymen Nutzungsstatistiken und erfassen, speichern oder übertragen keine Nutzungsstatistikdaten. Die nachstehenden Statistikhinweise bleiben nur als historischer Nachweis für Versionen vor 2.5.4 erhalten.

Nach der Aktivierung kann die Erweiterung Folgendes senden:

- Aufgezählte oder in Bereiche eingeteilte Einstellungen, etwa Schaltflächenlayout, Größenbereich, Symbolstil und Optionen der Lesewerkzeuge.
- Nach UTC-Tag aggregierte Zähler erlaubter Aktionen, etwa Nutzung der Oben/Unten-Schaltflächen, Tastaturbefehle, Fortschrittssprünge, Lesezeichen- und Gliederungsaktionen.
- Nach UTC-Tag aggregierte Zähler für das Aktivieren oder Deaktivieren der Erweiterung und erweiterter Funktionen.
- Erweiterungsversion und ausgewählte Oberflächensprache.

Die Statistik-Anfrage enthält keine URLs, Domains, Seitentitel, Seitentexte, Lesezeichendaten, Listen aktivierter Websites, exakten benutzerdefinierten Farben, dauerhaften Benutzerkennungen, Werbekennungen oder Gerätefingerabdrücke. Die Erweiterung erstellt keine langfristige Installations- oder Benutzer-ID.

## Lokale Speicherung

Die Erweiterung nutzt die integrierte Chrome-Speicher-API (`chrome.storage.sync`), um Einstellungen wie Scrollgeschwindigkeit, Schaltflächenposition, Farben, Deckkraft und Lesewerkzeuge zu speichern. Diese Daten werden über die Google-Infrastruktur zwischen Geräten synchronisiert, auf denen Sie bei Chrome angemeldet sind. Bei aktivierter Statistik kann nur die oben beschriebene aufgezählte oder gruppierte Teilmenge übertragen werden; exakte benutzerdefinierte Werte werden nicht gesendet.

Wenn Sie die entsprechenden Funktionen verwenden, kann `chrome.storage.local` außerdem Website-Aktivierungszustände und Scrollpositions-Lesezeichen speichern. Diese enthalten die Seiten-URL, den ungefähren Scrollfortschritt, den Seitentitel und zugehörige Metadaten des Scroll-Containers, damit die Erweiterung später eine Fortsetzung anbieten kann. Die Daten bleiben im Browser und werden weder an den Entwickler noch an Dritte übertragen.

Bei aktivierter intelligenter Abschnittsnavigation kann die Erweiterung sichtbare Überschriften der aktuellen Seite lesen, um eine Seitengliederung im Arbeitsspeicher zu erstellen. Gliederung, Überschriftentexte und Seitenstruktur werden weder im Chrome-Speicher gespeichert noch an den Entwickler oder Dritte übertragen.

Die Einwilligung zur Statistik, ausstehende aggregierte Zähler für bis zu sieben UTC-Tage und ein temporärer Wiederholungsstapel werden in `chrome.storage.local` gespeichert. Beim Deaktivieren der Statistik werden neue Erhebungen sofort gestoppt, ausstehende Daten gelöscht, geplante Uploads beendet und optionale Berechtigungen widerrufen. Bereits serverseitig empfangene Aggregate verfallen gemäß den unten genannten Fristen.

## Host-Berechtigungen

Die Erweiterung fordert umfassende Host-Berechtigungen (`<all_urls>`) ausschließlich an, um schwebende Scroll-Schaltflächen in Webseiten einzufügen. Diese Berechtigung ist für die Kernfunktion erforderlich. Die Erweiterung liest, überwacht, erhebt, speichert oder überträgt **keine** Inhalte besuchter Webseiten.

Die Berechtigung für den Statistik-Endpunkt und die Zeitplanberechtigung `alarms` sind optional. Chrome fordert sie nur an, wenn Sie die anonyme Statistik aktivieren. Sie werden ausschließlich verwendet, um größenbegrenzte aggregierte Stapel an folgende Adresse zu senden:

`https://page-scroll-master-analytics.kscje-apps.workers.dev/v1/events`

## Verarbeitung und Aufbewahrung der Statistik

Der Statistik-Endpunkt wird vom Entwickler der Erweiterung mit Cloudflare Workers und Cloudflare D1 betrieben. Es werden keine Statistik-SDKs Dritter, Werbenetzwerke, Tracking-Pixel, Cookies, Remote-Skripte oder Datenhändler verwendet.

Akzeptierte Stapel werden sofort in aggregierte Tageszähler umgewandelt. Einzelne Aktionsereignisse werden nicht gespeichert. Zufällige Stapel-IDs, die nur zur Vermeidung von Duplikaten bei Wiederholungen dienen, werden bis zu 30 Tage aufbewahrt. Aggregierte Tagesstatistiken werden bis zu 13 Monate aufbewahrt.

Cloudflare kann gemäß seinen Infrastruktur-Richtlinien gewöhnliche Netzwerkmetadaten wie IP-Adresse und Anfrage-Header verarbeiten, um den Dienst bereitzustellen und zu schützen. Die Erweiterung fügt Statistik-Anfragen keine Seiten-URLs, Referrer, benutzerdefinierten User-Agent-Daten oder dauerhaften Kennungen hinzu. Der Entwickler verwendet Netzwerkmetadaten nicht zur Identifizierung oder Profilbildung.

Die Statistik dient ausschließlich zur Bewertung von Funktionsnutzung, Einstellungsverteilungen, Standardwerten und Produktprioritäten. Sie wird nicht verkauft, für Werbung verwendet oder zur Profilbildung weitergegeben.

## Vorschläge und Feedback

Das optionale Feedback-Formular sendet Daten nur nach dem Absenden. Feedbacktyp, Nachricht, Erweiterungsversion und Oberflächensprache werden übertragen. Kontaktangaben und bis zu drei JPEG-, PNG- oder WebP-Bilder werden nur auf ausdrückliche Auswahl gesendet. Das Formular erfasst weder die Seiten-URL noch die Browsersprache. Die Erweiterung speichert das Feedback nicht.

Nach der Deinstallation kann der Browser eine freiwillige Umfrageseite des Entwicklers öffnen. Das Öffnen der Seite sendet keinen Deinstallationsgrund. Daten werden nur übertragen, wenn Sie die Umfrage absenden, und können ausgewählte Gründe, optionale Details, optionale Kontaktangaben, die Erweiterungsversion und die Oberflächensprache enthalten. Die Umfrage erfasst keine besuchten URLs, Seiteninhalte, Lesezeichen, Website-Status, Einstellungsdetails oder Analytics-Einwilligung.

Der Entwickler betreibt den Endpunkt mit Cloudflare Workers und D1 und nutzt Resend zur E-Mail-Weiterleitung. Zur stündlichen Begrenzung wird nur ein gesalzener Hash der Netzwerkadresse verwendet; Klartext-IP-Adressen werden nicht gespeichert. Inhaltsfreie Protokolle werden höchstens 30 Tage aufbewahrt, etwa Anfrage-ID, Feedbacktyp, Bildanzahl, Deinstallationsgrund-Enums, ob optionale Felder enthalten waren, Zustellstatus und Zeitstempel. Nachricht, Deinstallationsdetails, Kontakt und Bilder werden nicht in D1 gespeichert. Die optionale Host-Berechtigung wird nur beim Absenden angefordert und danach widerrufen.

## Eingeschränkte Nutzung im Chrome Web Store

Die Nutzung von Informationen aus Chrome-APIs entspricht der [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use), einschließlich der Anforderungen zur eingeschränkten Nutzung. Daten werden nur verwendet, um den einzigen Zweck der Erweiterung bereitzustellen oder zu verbessern. Sie werden nicht für personalisierte Werbung, Kreditentscheidungen oder den Verkauf an Datenhändler übertragen oder verwendet.

## Datenschutz für Kinder

Die Erweiterung erhebt wissentlich keine personenbezogenen Daten, auch nicht von Kindern unter 13 Jahren.

## Änderungen dieser Richtlinie

Änderungen dieser Datenschutzrichtlinie werden in einer aktualisierten Version der Erweiterung und auf dieser Seite wiedergegeben.

## Kontakt

Bei Fragen zu dieser Datenschutzrichtlinie: **kscj.ty@gmail.com**
