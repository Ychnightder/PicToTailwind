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
	async generateTailwindFromImage(
		buffer: Buffer,
		mimeType: string
	): Promise<{ html: string; analysisReport: { dimensions: string; colorPalette: string[]; extractedTexts: string[] } }> {
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
			temperature: 0.10,
			stream: false,
		});

		
		const optimizedHtml = secondCompletion.choices[0]?.message?.content || '';
		

		// 5. Nettoyage final des guillemets et retours à la ligne
		return {
			html: this.cleanStringFormat(optimizedHtml),
			analysisReport: analysisReport, // On retourne aussi le rapport d'analyse pour la critique visuelle
		};
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
		const TARGET_SCORE = 97; // On vise 92% (100% est impossible à cause de l'anti-aliasing)

		// console.log('🚀 Étape 1 : Génération initiale par Groq...');
		// C'est ton code actuel qui génère le premier jet
		// Dans ton agentService, quand tu appelles le critique :
		let { html: currentHtml, analysisReport } = await this.generateTailwindFromImage(buffer, mimeType);

		const rawDimensions = analysisReport.dimensions || '1024x768'; // Fallback de sécurité
		const [w, h] = rawDimensions.split('x').map(n => parseInt(n.trim(), 10));

		// VÉRIFICATION CRITIQUE : Si le parsing a échoué, on force des valeurs par défaut
		const finalWidth = isNaN(w) ? 1440 : w;
		const finalHeight = isNaN(h) ? 1029 : h;

		console.log(`[Debug] Viewport calculé : ${finalWidth}x${finalHeight}`);

		let bestHtml = currentHtml;
		let bestScore = 0;
		// LA BOUCLE DE RÉTROACTION
		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			console.log(`\n🔍 Évaluation visuelle (Essai ${attempt}/${MAX_RETRIES})...`);

			const isLastAttempt = attempt === MAX_RETRIES;

			const evaluation = await visualCritic.evaluate(currentHtml, buffer, finalWidth, finalHeight, isLastAttempt);
			console.log(`📊 Score de ressemblance visuelle : ${evaluation.score}%`);

			// On sauvegarde toujours la meilleure version trouvée
			if (evaluation.score > bestScore) {
				bestScore = evaluation.score;
				bestHtml = currentHtml;
			}

			// Si on a atteint la limite d'essais, on arrête les frais
			if (evaluation.score >= TARGET_SCORE) {
				console.log(`🎉 Score cible atteint (${evaluation.score}%) !`);
				await visualCritic.evaluate(currentHtml, buffer, finalWidth, finalHeight, true); // Sauvegarde finale
				return currentHtml;
			}

			// 2. SI ON A ÉCHOUÉ MAIS PAS FINI : On demande la correction
			if (!isLastAttempt) {
				console.log("🛠️ Qualité insuffisante. Appel à l'IA pour correction...");
				currentHtml = await this.askGroqToFix(currentHtml, evaluation.diffBuffer);
			} else {
				console.log("⚠️ Limite d'essais atteinte. On retourne la meilleure version trouvée.");
			}
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
						"Tu es un expert développeur Tailwind CSS spécialisé dans le pixel-perfect. Ton rôle est de corriger le rendu visuel d'un composant en comparant une image 'Diff' (où les zones ROUGES indiquent des erreurs de style) avec le code HTML fourni.\n\nOBJECTIF : Ajuster les classes utilitaires Tailwind pour supprimer les zones rouges de l'image.\n\nCONTRAINTES STRICTES :\n1. PRÉSERVATION ABSOLUE : Ne modifie JAMAIS les classes de couleurs arbitraires (ex: bg-[#d2e6dc] ou color-[#...]). Elles sont critiques pour la charte graphique.\n2. STRUCTURE : Conserve strictement la structure HTML et les données (texte, attributs). Ne modifie que les classes de layout (flex, grid, gap, padding, margin, size).\n3. MÉTHODOLOGIE : Analyse la position des zones rouges par rapport aux éléments HTML pour identifier si le problème vient d'un manque de flex/grid, d'un mauvais padding, ou d'une mauvaise largeur/hauteur.\n4. FORMAT : Renvoie UNIQUEMENT le code HTML brut. AUCUN bloc markdown (pas de ```html), AUCUNE explication, AUCUN commentaire. Le code doit être prêt à être injecté directement.",
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
