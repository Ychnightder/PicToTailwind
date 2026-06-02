import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {}


const options: AppOptions = {
	
};

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {


	void fastify.register(cors, {
		origin: [
			'https://pictotailwiind.vercel.app', // Ton frontend en prod
			'http://localhost:3000', // Ton frontend en local (pratique pour tester)
		],
		methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
	});

	
	void fastify.register(AutoLoad, {
		dir: join(__dirname, 'plugins'),
		options: {
			...opts,
		},
	});

	
	void fastify.register(AutoLoad, {
		dir: join(__dirname, 'routes'),
		options : {
			// prefix: '/api', 
			...opts,
		},
	});
	
};

export default app;
export { app, options };
