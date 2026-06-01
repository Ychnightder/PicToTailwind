// middlewares/imageContext.hook.ts
import sharp from 'sharp';

export interface ImageContext {
	width: number;
	height: number;
	type: 'mobile' | 'desktop';
}

export async function buildImageContext(buffer: Buffer): Promise<ImageContext> {
	try {
		const metadata = await sharp(buffer).metadata();
		const width = metadata.width || 1024;
		const height = metadata.height || 768;

		return {
			width,
			height,
			type: width < 768 ? 'mobile' : 'desktop',
		};
	} catch (error) {
		console.error('Erreur lors de la lecture des métadonnées Sharp :', error);
		// Fallback sécurisé en cas d'image corrompue
		return { width: 1024, height: 768, type: 'desktop' };
	}
}