import { FastifyPluginAsync } from 'fastify';
import { agentService } from '../services/agent.service.js'; // Import direct de l'objet
import { detectImageContext } from '../middlewares/imageContext.hook.js';

const uploadRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {

    // L'autoload ou le prefix gère déjà '/conversions'.
    // En mettant '/', la route devient exactement : POST /conversions
    fastify.post('/upload', async (request, reply) => {

        const data = await (request as any).file();

        if (!data) return reply.status(400).send({ error: 'Aucune image fournie.' });

        try {
            const buffer = await data.toBuffer();
            (request as any).rawBuffer = buffer;
            await detectImageContext(request, reply);

            const result = await agentService.generatePerfectTailwind(buffer, data.mimetype);

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
