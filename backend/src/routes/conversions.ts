// // import { FastifyPluginAsync } from 'fastify';
// // import { agentService } from '../services/agent.service.js'; // Import direct de l'objet

// // const conversionRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {

// // 	// L'autoload ou le prefix gère déjà '/conversions'.
// // 	// En mettant '/', la route devient exactement : POST /conversions
// // 	fastify.post('/conversions', async (request, reply) => {

// // 		const data = await (request as any).file();

// // 		if (!data) return reply.status(400).send({ error: 'Aucune image fournie.' });

// // 		try {
// // 			const buffer = await data.toBuffer();

		
// // 			const perfectHtml = await agentService.generatePerfectTailwind(buffer, data.mimetype);
			

// // 			return reply.status(201).send({
// // 				success: true,
// // 				htmlCode: perfectHtml,
// // 				status: 'COMPLETED',
// // 				createdAt: new Date(),
// // 			});

// // 		} catch (error) {
// // 			fastify.log.error(error);
// // 			return reply.status(500).send({ error: 'Erreur lors du traitement.' });
// // 		}
// // 	});

	

// // };

// // export default conversionRoutes;
