// api/index.ts
import Fastify from 'fastify';
import app from "../app.js"

// 1. On crée l'instance Fastify
const fastify = Fastify({ logger: true });

// 2. On enregistre ton app (ton fichier app.ts)
await fastify.register(app);

// 3. On exporte la fonction que Vercel va appeler
export default async (req: any, res: any) => {
	await fastify.ready();
	fastify.server.emit('request', req, res);
};
