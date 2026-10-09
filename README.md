# Your Car Your Way — POC Tchat

Projet réalisé dans le cadre du parcours OpenClassrooms *Architecte Logiciel* (P7).
Ce dépôt contient le **POC (preuve de concept)** validant la faisabilité de l'architecture cible retenue pour la nouvelle application Your Car Your Way, à travers une seule fonctionnalité : un **tchat en temps réel entre un client et une agence**.

## Contexte et livrables

Les livrables d'analyse et de conception sont remis séparément sur la plateforme OpenClassrooms et **ne sont pas versionnés dans ce dépôt** :

| Livrable | Contenu |
|---|---|
| Cahier des charges v2.1 | Exigences fonctionnelles et non fonctionnelles consolidées (26 EF, priorisées MoSCoW) |
| Backlog v1.2 | 35 user stories avec critères d'acceptation (Gherkin), dont accessibilité (PSH), sécurité et internationalisation |
| Audit technique v1.0 | Forces, faiblesses et contraintes des quatre applications existantes |
| Proposition d'architecture v1.2 | Architecture cible, diagrammes (composants, déploiement, séquence, classes) et choix technologiques argumentés |

L'architecture cible, en résumé :

- **Style** : orienté services + événementiel — cinq services Spring Boot (Utilisateur, Catalogue, Réservation, Paiement, Notification), une base PostgreSQL par service, exposés derrière une API Gateway unique (Azure API Management) commune au client et aux agences.
- **Communication** : REST pour les appels synchrones, Azure Service Bus pour les événements.
- **Réservation ↔ paiement** : saga orchestrée par événements — réservation temporaire `EN_ATTENTE_PAIEMENT`, paiement délégué à Stripe (webhook signé, traitement idempotent), confirmation ou expiration après 15 min, remboursement automatique de tout paiement réalisé pour une réservation non confirmable.
- **Identité** : Microsoft Entra External ID pour les clients (remplace Azure AD B2C, plus commercialisé depuis le 1er mai 2025), Microsoft Entra ID de l'entreprise pour les applications agence.
- **Hébergement** : Azure (Front Door, AKS multi-zone, services managés).

Ce POC valide la brique la plus risquée techniquement : la **communication temps réel** entre le client et l'agence.

## Architecture du POC

- **Frontend** : React + TypeScript, généré avec Vite.
- **Backend** : Spring Boot 4 (Java 21), Maven.
- **Communication temps réel** : STOMP over WebSocket (via SockJS), conformément au style événementiel retenu dans la proposition d'architecture.
- Le tchat simule une conversation à deux rôles fixes, **Client** et **Agence**, sur un salon unique (`/topic/chat`) — sans authentification ni persistance, hors périmètre du POC.

```
P7/
├── backend/    Spring Boot — API REST (/api/health) + WebSocket/STOMP (/ws, /app/chat.send, /topic/chat)
├── frontend/   React — statut backend + composant de tchat (src/Chat.tsx)
└── docs/       Livrables documentaires, en local uniquement (non versionné, voir .gitignore)
```

## Prérequis

- **Node.js** 20.19+ ou 22.12+ et npm (pour le frontend — version minimale exigée par Vite 8).
- **JDK 21** (pour le backend — Spring Boot 4 exige Java 17 minimum).
  > Si votre machine n'a qu'un JDK plus ancien installé par défaut (`java -version`), installez un JDK 21 (ex. [Eclipse Temurin](https://adoptium.net/)) et pointez `JAVA_HOME` dessus le temps de lancer le backend (voir ci-dessous).

## Installation

### Backend

```powershell
cd backend
copy .env.example .env
```

`.env` contient le port du serveur et l'origine autorisée en CORS/WebSocket (valeurs par défaut déjà correctes pour un usage local avec le frontend sur le port 5173) :

```
SERVER_PORT=8080
APP_CORS_ALLOWED_ORIGIN=http://localhost:5173
```

### Frontend

```powershell
cd frontend
copy .env.example .env
npm install
```

`.env` contient l'adresse du backend :

```
VITE_API_BASE_URL=http://localhost:8080
```

## Lancer le POC

Deux terminaux séparés, à garder ouverts en parallèle.

**Terminal 1 — Backend**
```powershell
cd backend
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"   # adapter le chemin si besoin
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
.\mvnw.cmd spring-boot:run
```
Attendre `Started YourCarYourWayBackendApplication`. Vérifier : `http://localhost:8080/api/health` doit répondre `{"status":"UP",...}`.

**Terminal 2 — Frontend**
```powershell
cd frontend
npm run dev
```
Ouvrir l'URL affichée (normalement `http://localhost:5173`).

## Utiliser le tchat

1. Ouvrir `http://localhost:5173` dans **deux onglets** (ou deux navigateurs).
2. Dans le premier onglet, sélectionner le rôle **Client** ; dans le second, **Agence** (menu déroulant sous le titre "Tchat — POC").
3. Envoyer un message depuis l'un : il doit apparaître en temps réel dans les deux onglets, aligné différemment selon qu'on est l'émetteur ou le destinataire.
4. Le statut "Connecté au serveur de tchat" doit être vert ; en rouge, vérifier que le backend tourne bien et que `VITE_API_BASE_URL` correspond à son adresse.

## Vérifications automatisées

```powershell
# Backend : compilation + tests
cd backend
.\mvnw.cmd test

# Frontend : typecheck + build de production, puis analyse statique
cd frontend
npm run build
npm run lint
```

## Notes techniques

- **Pas d'adresses/ports en dur** : le backend lit `SERVER_PORT` et `APP_CORS_ALLOWED_ORIGIN` depuis `.env` via un petit `EnvironmentPostProcessor` maison (`backend/src/main/java/.../config/DotenvEnvironmentPostProcessor.java`), le frontend lit `VITE_API_BASE_URL` via les variables d'environnement natives de Vite. Les `.env` réels sont ignorés par git ; seuls les `.env.example` sont versionnés.
- **`vite.config.ts`** définit `global: 'globalThis'` : `sockjs-client` référence l'objet Node `global`, absent du navigateur — sans ce polyfill, la page plante au chargement (`ReferenceError: global is not defined`).
- Si deux serveurs frontend tournent en même temps, Vite bascule automatiquement sur le port suivant libre (5174, 5175…) — dans ce cas le backend refusera la connexion CORS/WebSocket car seule l'origine `http://localhost:5173` est autorisée. Ne garder qu'une seule instance de `npm run dev` active.

## Hors périmètre (volontairement, pour ce POC)

- Authentification / comptes utilisateurs.
- Persistance des messages (tout est perdu au redémarrage du backend).
- Historique de conversation, plusieurs salons simultanés.
- Design final de l'interface (le composant de tchat est volontairement minimal).

Ces éléments relèvent du développement complet de la fonctionnalité, une fois la faisabilité de l'architecture validée par ce POC.
