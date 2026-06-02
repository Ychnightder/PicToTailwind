// api/index.ts
import Fastify from 'fastify';
import app from '../src/app.js';


const fastify = Fastify({ logger: true });

// Initialisation globale
const start = fastify.register(app).then(() => fastify.ready());

const PORT = process.env.PORT ;
console.log(`🚀 Backend prêt sur le port ${PORT} !`)


export default async (req: any, res: any) => {
	await start;
	fastify.server.emit('request', req, res);
};