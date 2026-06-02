import sharp from 'sharp';
// @ts-ignore - On ignore l'absence de types TypeScript pour ce paquet natif
import quantize from 'quantize';
import Tesseract from "tesseract.js";


let cachedWorker: any = null;


async function getTesseractWorker() {
	if (!cachedWorker) {
		// Initialisation unique avec les chemins CDN pour éviter l'erreur WASM sur Vercel
		cachedWorker = await Tesseract.createWorker('fra');
		console.log('🤖 Tesseract Worker initialisé et mis en cache');
	}
	return cachedWorker;
}


export const imageAnalyzer = {
	async analyze(buffer: Buffer, mimeType: string) {
		// 1. SHARP : Normalisation de l'image de base
		const image = sharp(buffer);
		
		// console.log('🔍 Analyse de l’image en cours...' , image);

		const metadata = await image.metadata();

		// // console.log('📐 Dimensions originales :', metadata.width, 'x', metadata.height);

		const width = metadata.width || 1024;
		const height = metadata.height || 768;

		const processedBuffer = await image.resize({ width: 1400, withoutEnlargement: true }).normalize().toBuffer();

		// 2. EXTRACTION DE LA PALETTE (Median Cut Quantization)
		let colorPalette: string[] = [];
		
		try {
			// On réduit l'image à 100x100 pixels pour accélérer la lecture
			// et on force le retrait de la transparence (Alpha) pour n'avoir que du RGB pur
			const { data } = await sharp(processedBuffer).resize(100, 100, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });

			// On formate les données de Sharp en un tableau de pixels [[R, G, B], [R, G, B]...]
			const arrayOfPixels: number[][] = [];

			for (let i = 0; i < data.length; i += 3) {
				arrayOfPixels.push([data[i], data[i + 1], data[i + 2]]);
			}

			// L'algorithme Quantize regroupe les couleurs intelligemment et extrait les 6 dominantes
			const colorMap = quantize(arrayOfPixels, 6);

			const paletteRgb = colorMap
				? colorMap.palette()
				: [
						[255, 255, 255],
						[0, 0, 0],
					];

			// Conversion RGB vers HEX
			colorPalette = paletteRgb.map((rgb: number[]) => {
				const r = rgb[0].toString(16).padStart(2, '0');
				const g = rgb[1].toString(16).padStart(2, '0');
				const b = rgb[2].toString(16).padStart(2, '0');
				return `#${r}${g}${b}`.toLowerCase();
			});
			
		} catch (colorError) {
			console.error('Erreur de palette :', colorError);
			colorPalette = ['#ffffff', '#000000']; // Fallback de sécurité
		}

		// 3. TESSERACT.JS : Extraction OCR optimisée
		const ocrBuffer = await sharp(processedBuffer)
			.grayscale()
			.linear(1.5, -0.1) // Boost le contraste pour aider la lecture
			.toBuffer();

		const worker = await getTesseractWorker();

		const {
			data: { text },
		} = await worker.recognize(ocrBuffer);
		
		await worker.terminate();

		const cleanTexts = text
			.replace(/[“©|\[\]]/g, '') // Nettoyage des parasites visuels
			.split('\n')
			.map((t : string) => t.trim())
			.filter((t : string) => t.length > 1);

		// 4. Logs
		console.log('🖼️--- ANALYSE D’IMAGE ---🖼️');
		console.log(`Dimensions : ${metadata.width}x${metadata.height}px`);
		console.log(`Palette de couleurs détectée :`, colorPalette);
		console.log('Texte extrait :', cleanTexts);

		return {
			processedBuffer,
			analysisReport: {
				dimensions: `${width}x${height}`,
				colorPalette,
				extractedTexts: cleanTexts,
			},
		};
	},
};
