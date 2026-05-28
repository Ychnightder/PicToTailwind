import 'dotenv/config'; // <-- Charge manuellement le fichier .env (requis en v7)
import fp from 'fastify-plugin';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

declare module 'fastify' {
	interface FastifyInstance {
		prisma: PrismaClient;
	}
}

export default fp(async fastify => {
	// 1. On crée un pool de connexion PostgreSQL natif Node.js
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });

	// 2. On l'associe à l'adaptateur Prisma 7
	const adapter = new PrismaPg(pool);

	// 3. On instancie le client avec cet adaptateur
	const prisma = new PrismaClient({ adapter });

	// Connexion à la base de données
	await prisma.$connect();

	// On attache l'instance Prisma à Fastify
	fastify.decorate('prisma', prisma);

	// On ferme proprement le client ET le pool à l'arrêt du serveur
	fastify.addHook('onClose', async server => {
		await server.prisma.$disconnect();
		await pool.end();
		console.log('🚨 Prisma client disconnected 🚨');
		
	});
});
