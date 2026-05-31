// middlewares/imageContext.hook.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import sharp from 'sharp';

export async function detectImageContext(req: FastifyRequest, reply: FastifyReply) {
	// Vérifie si le fichier est dans le buffer (selon comment tu gères tes uploads)
	const buffer = (req as any).rawBuffer; // Adapte selon ton gestionnaire de multipart
	if (!buffer) return;

	const metadata = await sharp(buffer).metadata();
	const width = metadata.width || 1024;
	const height = metadata.height || 768;

	(req as any).imageContext = {
		width,
		height,
		type: width < 768 ? 'mobile' : 'desktop',
	};


	// Tu peux aussi ajouter d'autres infos pertinentes, comme la palette de couleurs ou les textes extraits
	return (req as any).imageContext;

}
