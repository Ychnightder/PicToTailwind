import { Groq } from 'groq-sdk';
import { GROQ_SYSTEM_PROMPT, TAILWIND_EXPERT_PROMPT, GROQ_USER_PROMPT_WITH_DATA } from '../config/prompts.js';
import { imageAnalyzer } from './imageAnalyzer/analyzer.service.js';
import { visualCritic } from './imageAnalyzer/visualCritic.service.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const agentService = {
	/**
	 * Envoie l'image à Groq (Llama Vision) et extrait le code HTML/Tailwind épuré
	 * @param buffer Le buffer de l'image à convertir
	 * @param mimeType Le type MIME de l'image (ex: 'image/png')
	 * @returns Le code HTML/Tailwind généré par Groq, nettoyé de tout bloc Markdown ou texte superflu
	 */
	async generateTailwindFromImage(buffer: Buffer, mimeType: string): Promise<string> {
		// 2. ÉTAPE D'ANALYSE LOCALE (Sharp + Tesseract)
		// On récupère l'image optimisée et le rapport (dimensions, couleurs, textes)
		const { processedBuffer, analysisReport } = await imageAnalyzer.analyze(buffer, mimeType);

		// 3. PREMIER APPEL GROQ : Génération de la structure HTML
		const firstCompletion = await groq.chat.completions.create({
			messages: [
				{ role: 'system', content: GROQ_SYSTEM_PROMPT },
				{
					role: 'user',
					content: [
						// On passe le rapport d'analyse textuel pour guider le LLM
						{ type: 'text', text: GROQ_USER_PROMPT_WITH_DATA(analysisReport) },
						// On envoie le buffer optimisé par Sharp en Base64
						{ type: 'image_url', image_url: { url: `data:${mimeType};base64,${processedBuffer.toString('base64')}` } },
					],
				},
			],
			model: 'meta-llama/llama-4-scout-17b-16e-instruct',
			temperature: 0.1,
			stream: false,
		});

		const rawHtml = firstCompletion.choices[0]?.message?.content || '';

		// 4. DEUXIÈME APPEL GROQ : Refactoring et embellissement Tailwind
		const secondCompletion = await groq.chat.completions.create({
			messages: [
				{ role: 'system', content: TAILWIND_EXPERT_PROMPT },
				{ role: 'user', content: `Optimise le design de ce code HTML en appliquant les consignes strictes :\n\n${rawHtml}` },
			],
			model: 'meta-llama/llama-4-scout-17b-16e-instruct',
			temperature: 0.5,
			stream: false,
		});

		const optimizedHtml = secondCompletion.choices[0]?.message?.content || '';

		// 5. Nettoyage final des guillemets et retours à la ligne
		return this.cleanStringFormat(optimizedHtml);
	},

	/**
	 * Nettoie les artefacts de formatage JSON/Markdown et force les guillemets simples
	 */
	cleanStringFormat(text: string): string {
		return (
			text
				// 1. Enlever les blocs markdown si le LLM a désobéi
				.replace(/^```html\s*/i, '')
				.replace(/```$/, '')

				// 2. Remplacer les doubles guillemets (et ceux échappés \") par des guillemets simples
				.replace(/\\"/g, "'")
				.replace(/"/g, "'")

				// 3. Nettoyer les vrais retours à la ligne textuels (\n) pour compresser proprement la chaîne en BDD
				.replace(/\\n/g, ' ')
				.replace(/\s+/g, ' ') // Remplace les espaces multiples par un seul espace

				.trim()
		);
	},

	async generatePerfectTailwind(buffer: Buffer, mimeType: string): Promise<string> {
		const MAX_RETRIES = 5;
		// const TARGET_SCORE = 92; // On vise 92% (100% est impossible à cause de l'anti-aliasing)

		console.log('🚀 Étape 1 : Génération initiale par Groq...');
		// C'est ton code actuel qui génère le premier jet
		let currentHtml = await this.generateTailwindFromImage(buffer, mimeType);

		let bestHtml = currentHtml;
		let bestScore = 0;
		let isFinal = false;
		// LA BOUCLE DE RÉTROACTION
		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			console.log(`\n🔍 Évaluation visuelle (Essai ${attempt}/${MAX_RETRIES})...`);

			if (attempt === MAX_RETRIES) {
				isFinal = true; // Dernier essai, on va forcer l'évaluation finale même si c'est pas parfait
			}

			const evaluation = await visualCritic.evaluate(currentHtml, buffer, 1024, 768, isFinal);
			console.log(`📊 Score de ressemblance visuelle : ${evaluation.score}%`);

			// On sauvegarde toujours la meilleure version trouvée
			if (evaluation.score > bestScore) {
				bestScore = evaluation.score;
				bestHtml = currentHtml;
			}

			// Si c'est assez bon, on casse la boucle et on renvoie le code
			// if (evaluation.score >= TARGET_SCORE) {
			// 	console.log('✅ Objectif visuel atteint !');
			// 	isFinal = true;
			// 	break;
			// }

			// Si on a atteint la limite d'essais, on arrête les frais
			if (attempt === MAX_RETRIES) {
				console.log("⚠️ Limite d'essais atteinte. On garde la meilleure version.");
				isFinal = true;
				break;
			}

			console.log("🛠️ Qualité insuffisante. Appel à l'IA pour correction...");
			currentHtml = await this.askGroqToFix(currentHtml, evaluation.diffBuffer);
		}

		return bestHtml;
	},

	/**
	 * L'agent de correction : il regarde l'image Diff et corrige le code
	 */
	async askGroqToFix(currentHtml: string, diffImageBuffer: Buffer): Promise<string> {
		const fixCompletion = await groq.chat.completions.create({
			messages: [
				{
					role: 'system',
					content:
						"Tu es un expert Tailwind. Ton objectif est de corriger le code HTML fourni. Je vais te donner une image 'Diff' : tout ce qui est en ROUGE sur cette image représente tes erreurs (mauvais espacement, mauvaise taille, mauvais alignement). Ajuste le code HTML pour corriger ces zones rouges.    RÈGLES STRICTES :  1. Ne change pas la structure globale du code, concentre-toi sur les détails de style.  2. Utilise les classes Tailwind pour faire les ajustements nécessaires.  3. Ne génère aucun texte explicatif, renvoie uniquement le code corrigé.  4. Ne mets pas ton code dans des blocs markdown.",
				},
				{
					role: 'user',
					content: [
						{ type: 'text', text: `Voici le code actuel généré, corrige-le :\n${currentHtml}` },
						{ type: 'image_url', image_url: { url: `data:image/png;base64,${diffImageBuffer.toString('base64')}` } },
					],
				},
			],
			model: 'meta-llama/llama-4-scout-17b-16e-instruct',
			temperature: 0.1, // Très faible pour éviter qu'il casse ce qui marche
		});

		return this.cleanStringFormat(fixCompletion.choices[0]?.message?.content || currentHtml);
	},
};
