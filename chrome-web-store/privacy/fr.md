# Politique de confidentialité de Smart Scroll Navigator

**Dernière mise à jour** : 14 juin 2026

## Collecte de données

Pendant l'utilisation normale du défilement, Smart Scroll Navigator ne collecte ni ne transmet historique, URL ou domaine visité, titre ou contenu de page, recherche, formulaire, position, marque-page ou compte. La seule exception concerne les données que vous envoyez explicitement avec le formulaire facultatif décrit ci-dessous.

L'extension propose des statistiques d'utilisation anonymes facultatives. Cette fonction est désactivée par défaut pour les nouveaux utilisateurs comme pour les utilisateurs existants. Les données ne sont collectées et transmises qu'après activation explicite de l'option **Envoyer des statistiques d'utilisation anonymes** dans la page des options.

Après activation, l'extension peut envoyer :

- Des réglages énumérés ou regroupés par plages, tels que la disposition des boutons, la plage de taille, le style des icônes et les options des outils de lecture.
- Des compteurs quotidiens agrégés en UTC pour les actions autorisées : boutons haut/bas, commandes clavier, sauts de progression, actions sur les marque-pages et le sommaire.
- Des compteurs quotidiens agrégés en UTC pour l'activation ou la désactivation de l'extension et des fonctions avancées.
- La version de l'extension et la langue d'interface sélectionnée.

La requête de statistiques ne contient ni URL, domaine, titre, texte de page, donnée de marque-page, liste de sites activés, couleur personnalisée exacte, identifiant utilisateur persistant, identifiant publicitaire ou empreinte d'appareil. L'extension ne crée aucun identifiant permanent d'installation ou d'utilisateur.

## Stockage local

L'extension utilise l'API de stockage intégrée de Chrome (`chrome.storage.sync`) pour enregistrer des préférences telles que la vitesse de défilement, la position des boutons, les couleurs, l'opacité et les réglages des outils de lecture. Ces données sont synchronisées par l'infrastructure de Google entre les appareils sur lesquels vous êtes connecté à Chrome. Si les statistiques facultatives sont activées, seul le sous-ensemble énuméré ou regroupé décrit ci-dessus peut être envoyé ; les valeurs personnalisées exactes ne le sont pas.

Lorsque vous utilisez les fonctions concernées, l'extension peut également enregistrer dans `chrome.storage.local` l'état d'activation par site et les marque-pages de position de défilement. Ceux-ci contiennent l'URL, la progression approximative, le titre de la page et des métadonnées liées au conteneur de défilement afin de proposer une reprise ultérieure. Ces données restent dans votre navigateur et ne sont transmises ni au développeur ni à un tiers.

Lorsque la navigation intelligente par sections est activée, l'extension peut lire les titres visibles de la page actuelle afin de créer un sommaire en mémoire. Le sommaire, les textes des titres et la structure de la page ne sont pas enregistrés dans le stockage Chrome et ne sont transmis ni au développeur ni à un tiers.

Le consentement aux statistiques, jusqu'à sept jours UTC de compteurs agrégés en attente et un lot temporaire de nouvelle tentative sont stockés dans `chrome.storage.local`. La désactivation arrête immédiatement toute nouvelle collecte, supprime les données en attente, interrompt la programmation des envois et révoque les autorisations facultatives. Les statistiques agrégées déjà reçues par le serveur expirent selon les durées indiquées ci-dessous.

## Autorisations d'hôte

L'extension demande des autorisations d'hôte étendues (`<all_urls>`) uniquement pour injecter des boutons de défilement flottants dans les pages Web. Cette autorisation est nécessaire à sa fonction principale. L'extension ne lit, n'intercepte, ne collecte, ne stocke et ne transmet **aucun** contenu des pages visitées.

L'autorisation d'accès au point de terminaison des statistiques et l'autorisation de planification `alarms` sont facultatives. Chrome ne les demande que lorsque vous activez les statistiques anonymes. Elles servent uniquement à envoyer des lots agrégés de taille limitée à :

`https://page-scroll-master-analytics.kscje-apps.workers.dev/v1/events`

## Traitement et conservation des statistiques

Le point de terminaison est exploité par le développeur de l'extension à l'aide de Cloudflare Workers et Cloudflare D1. Aucun SDK statistique tiers, réseau publicitaire, pixel de suivi, cookie, script distant ou courtier en données n'est utilisé.

Les lots acceptés sont immédiatement convertis en compteurs quotidiens agrégés. Les événements d'action individuels ne sont pas conservés. Les identifiants aléatoires de lots, utilisés uniquement pour éviter les doublons lors des nouvelles tentatives, sont conservés jusqu'à 30 jours. Les statistiques quotidiennes agrégées sont conservées jusqu'à 13 mois.

Cloudflare peut traiter des métadonnées réseau ordinaires, notamment l'adresse IP et les en-têtes de requête, afin de fournir et protéger le service conformément à ses politiques d'infrastructure. L'extension n'ajoute ni URL de page, ni référent, ni donnée d'agent utilisateur personnalisée, ni identifiant persistant aux requêtes. Le développeur n'utilise pas ces métadonnées pour identifier les utilisateurs ou créer des profils.

Les statistiques servent uniquement à évaluer l'utilisation des fonctions, la répartition des réglages, les valeurs par défaut et les priorités du produit. Elles ne sont ni vendues, ni utilisées pour la publicité, ni partagées à des fins de profilage.

## Suggestions et avis

Le formulaire facultatif n'envoie des données qu'après votre validation. Le type, le message, la version de l'extension et la langue de l'interface sont transmis. Le contact et jusqu'à trois images JPEG, PNG ou WebP ne sont envoyés que si vous les fournissez. Le formulaire ne collecte ni l'URL actuelle ni la langue du navigateur. L'extension ne conserve pas le contenu.

Le service utilise Cloudflare Workers et D1, puis Resend pour l'envoi par e-mail. Une empreinte salée de l'adresse réseau sert uniquement à la limitation horaire; l'adresse IP en clair n'est pas conservée. Seuls des journaux sans contenu sont gardés jusqu'à 30 jours. Message, contact et images ne sont pas stockés dans D1. L'autorisation d'hôte facultative est demandée lors de l'envoi puis révoquée.

## Utilisation limitée de Chrome Web Store

L'utilisation des informations reçues des API Chrome respecte la [Politique relative aux données utilisateur du Chrome Web Store](https://developer.chrome.com/docs/webstore/program-policies/limited-use), y compris les exigences d'utilisation limitée. Les données sont utilisées uniquement pour fournir ou améliorer la finalité unique de l'extension. Elles ne sont ni transférées ni utilisées pour la publicité personnalisée, les décisions de crédit ou la vente à des courtiers en données.

## Confidentialité des enfants

L'extension ne collecte pas sciemment d'informations personnelles, y compris celles d'enfants de moins de 13 ans.

## Modifications de cette politique

Toute modification de cette politique sera reflétée dans une version mise à jour de l'extension et sur cette page.

## Contact

Pour toute question concernant cette politique : **kscj.ty@gmail.com**
