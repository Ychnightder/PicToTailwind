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
		// origin: [process.env.URL_FRONTEND || 'http://localhost:3000'],
		origin: true, 
		// credentials: true,
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
			// // prefix: '/api', 
			...opts,
		},
	});
	
};

export default app;
export { app, options };
