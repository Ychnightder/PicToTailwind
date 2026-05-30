import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {}


const options: AppOptions = {
	
};

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
	
	void fastify.register(AutoLoad, {
		dir: join(__dirname, 'plugins'),
		options: {
			prefix: '/api', 
			...opts,
		},
	});

	
	void fastify.register(AutoLoad, {
		dir: join(__dirname, 'routes'),
		options : {
			prefix: '/api', 
			...opts,
		},
	});
};

export default app;
export { app, options };
