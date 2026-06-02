[Frontend Next.js] ──(1. Envoie l'image brute)──> [Backend Fastify]
                                                       │
                                            (2. Compresse avec Sharp)
                                                       │
                                                       ▼
[Groq API Vision] <──(4. Envoie le texte Base64)── [Fichier en mémoire]
        │                                              
(5. Analyse & renvoie                                  
    le code HTML)                           
        │                                              
        ▼                                              
[Frontend Next.js]
