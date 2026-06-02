// routes/uploadRoutes.ts
import { FastifyPluginAsync } from 'fastify';
import { agentService } from '../services/agent.service.js';
import { buildImageContext } from '../services/context.service.js';

const uploadRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
	fastify.post('/upload', async (request, reply) => {
		// 1. Récupération du fichier
		const data = await (request as any).file();
		if (!data) return reply.status(400).send({ error: 'Aucune image fournie.' });

		try {
			// 2. Extraction du buffer
			const buffer = await data.toBuffer();

			// 3. Création du contexte dynamique (dimensions, type)
			const context = await buildImageContext(buffer);
			fastify.log.info(`📸 Image détectée : ${context.width}x${context.height} (${context.type})`);

			// 4. On passe le buffer ET LE CONTEXTE à l'agent !
			const result = await agentService.generatePerfectTailwind(
				buffer,
				data.mimetype,
				context // <-- NOUVEAU PARAMÈTRE !
			);

			return reply.status(201).send({
				success: true,
				result: result,
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.status(500).send({ error: 'Erreur lors du traitement.' });
		}
	});
};

export default uploadRoutes;
