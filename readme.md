# 🛠️ PicToTailwind

PicToTailwind est un Micro-SaaS ultra-performant qui convertit instantanément vos maquettes d'interface et captures d'écran en code HTML propre et moderne, stylisé exclusivement avec **Tailwind CSS**.  

Propulsé par une architecture découplée robuste et l'API de vision ultra-rapide de **Groq**, le projet intègre une gestion asynchrone des tâches pour supporter de fortes montées en charge sans compromettre l'expérience utilisateur.

---

## 🏗️ Architecture du Système

Le projet est divisé en deux entités indépendantes pour garantir une scalabilité maximale :

* **`/frontend` :** Application cliente construite avec **Next.js** (App Router) offrant un espace de travail interactif (Éditeur de code synchronisé + rendu live en Sandbox).
* **`/backend` :** Serveur API haute performance développé en **Node.js & TypeScript** qui orchestre le traitement d'image, la file d'attente distribuée et l'interconnexion avec les modèles de vision.

```text
 [Client Next.js] ──(Upload Image)──> [API Node.js/TS] ──(Push Job)──> [BullMQ / Redis]
        ▲                                                                       │ (Worker)
        │                                                                       ▼
 [Rendu Live HTML] <──(Retourne Code JSON)── [Supabase DB] <──(Fini)── [Groq Vision API]
