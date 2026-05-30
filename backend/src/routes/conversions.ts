import { FastifyPluginAsync } from 'fastify';
import { agentService } from '../services/agent.service.js'; // Import direct de l'objet

const conversionRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {

	// L'autoload ou le prefix gère déjà '/conversions'.
	// En mettant '/', la route devient exactement : POST /conversions
	fastify.post('/conversions', async (request, reply) => {

		const data = await (request as any).file();

		if (!data) return reply.status(400).send({ error: 'Aucune image fournie.' });

		try {
			const buffer = await data.toBuffer();

			// Appel direct de la méthode de l'objet service
			// const cleanHtml = await agentService.generateTailwindFromImage(buffer, data.mimetype);
			// fastify.log.info(`📸 Fichier reçu (${data.mimetype}). Lancement de l'orchestration PerfectTailwind...`);

			// 3. Appeler notre agent autonome et sa boucle de critique visuelle
			const perfectHtml = await agentService.generatePerfectTailwind(buffer, data.mimetype);

			// const conversion = await fastify.prisma.conversion.create({
			// 	data: { htmlCode: cleanHtml },
			// });

			return reply.status(201).send({
				success: true,
				htmlCode: perfectHtml,
				status: 'COMPLETED',
				createdAt: new Date(),
			});

		} catch (error) {
			fastify.log.error(error);
			return reply.status(500).send({ error: 'Erreur lors du traitement.' });
		}
	});

	

};

export default conversionRoutes;
