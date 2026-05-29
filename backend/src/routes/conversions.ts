import { FastifyPluginAsync } from 'fastify';
import { agentService } from '../services/agent.serviece.js'; // Import direct de l'objet

const conversionRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {

	// L'autoload ou le prefix gère déjà '/conversions'.
	// En mettant '/', la route devient exactement : POST /conversions
	fastify.post('/conversions', async (request, reply) => {
		const data = await (request as any).file();
		if (!data) return reply.status(400).send({ error: 'Aucune image fournie.' });

		try {
			const buffer = await data.toBuffer();

			// Appel direct de la méthode de l'objet service
			const cleanHtml = await agentService.generateTailwindFromImage(buffer, data.mimetype);

			// const conversion = await fastify.prisma.conversion.create({
			// 	data: { htmlCode: cleanHtml },
			// });

			return reply.status(201).send({
				success: true,
				// conversionId: conversion.id,
				htmlCode: cleanHtml,
			});

		} catch (error) {
			fastify.log.error(error);
			return reply.status(500).send({ error: 'Erreur lors du traitement.' });
		}
	});

	// GET /conversions
	fastify.get('/conversions', async (request, reply) => {
		try {
			const history = await fastify.prisma.conversion.findMany({
				orderBy: { createdAt: 'desc' },
			});
			return history;
		} catch (error) {
			fastify.log.error(error);
			return reply.status(500).send({ error: 'Impossible de récupérer l’historique.' });
		}
	});
};

export default conversionRoutes;
