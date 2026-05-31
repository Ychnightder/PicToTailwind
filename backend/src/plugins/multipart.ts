import fastifyPlugin from 'fastify-plugin';
import multipart from '@fastify/multipart';

export default fastifyPlugin(async fastify => {
	void fastify.register(multipart, {
		limits: {
			fileSize: 10 * 1024 * 1024,
		},
	});
});
