import { agentService } from '../services/agent.service.js';
import { buildImageContext } from '../services/context.service.js';
import { request, Router } from 'express';
import multer from 'multer';

const uploadRoutes = Router();

const upload = multer({ storage: multer.memoryStorage() });


uploadRoutes.post('/api/upload', upload.single('image'), async (req, res) => {
	
	const data  = await req.file;

	if (!data) return res.status(400).send({ error: 'Aucune image fournie.' });

	try {
		// 2. Extraction du buffer
		const buffer: Buffer = data.buffer;

		// 3. Création du contexte dynamique (dimensions, type)
		const context = await buildImageContext(buffer);

		// 4. On passe le buffer ET LE CONTEXTE à l'agent !
		const result = await agentService.generatePerfectTailwind(buffer, data.mimetype, context);

		return res.status(201).send({
			success: true,
			result: result,
		});

	} catch (error) {
		return res.status(500).send({ error: 'Erreur lors du traitement.' });
	}
});



export default uploadRoutes;
