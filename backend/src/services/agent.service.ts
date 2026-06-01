import { Groq } from 'groq-sdk';
import { GROQ_SYSTEM_PROMPT, TAILWIND_EXPERT_PROMPT, GROQ_USER_PROMPT_WITH_DATA, TAILWIND_CORRECTOR_PROMPT } from '../config/prompts.js';
import { imageAnalyzer } from './imageAnalyzer/analyzer.service.js';
import { visualCritic } from './imageAnalyzer/visualCritic.service.js';
import { ImageContext } from './context.service.js';


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const agentService = {
	/**
	 * Envoie l'image à Groq (Llama Vision) et extrait le code HTML/Tailwind épuré
	 * @param buffer Le buffer de l'image à convertir
	 * @param mimeType Le type MIME de l'image (ex: 'image/png')
	 * @returns Le code HTML/Tailwind généré par Groq, nettoyé de tout bloc Markdown ou texte superflu
	 */
	async generateTailwindFromImage(buffer: Buffer,mimeType: string): Promise<{ html: string; analysisReport: { dimensions: string; colorPalette: string[]; extractedTexts: string[] } }> {
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

	async generatePerfectTailwind(buffer: Buffer, mimeType: string, context: ImageContext): Promise<string> {
		const MAX_RETRIES = 5;
		const TARGET_SCORE = 92; // On vise 92% (100% est impossible à cause de l'anti-aliasing)

		// console.log('🚀 Étape 1 : Génération initiale par Groq...');
		// C'est ton code actuel qui génère le premier jet
		// Dans ton agentService, quand tu appelles le critique :
		let { html: currentHtml } = await this.generateTailwindFromImage(buffer, mimeType);


		let bestHtml = currentHtml;
		let bestScore = 0;
		// LA BOUCLE DE RÉTROACTION
		
		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			console.log(`\n🔍 Évaluation visuelle (Essai ${attempt}/${MAX_RETRIES})...`);

			const isLastAttempt = attempt === MAX_RETRIES;

			const evaluation = await visualCritic.evaluate(currentHtml, buffer, context.width, context.height, isLastAttempt);

			console.log(`📊 Score de ressemblance visuelle : ${evaluation.score}%`);

			// On sauvegarde toujours la meilleure version trouvée
			if (evaluation.score > bestScore) {
				bestScore = evaluation.score;
				bestHtml = currentHtml;
			} else if (evaluation.score < bestScore) {
				console.log(`📉 Régression détectée ! L'IA a dégradé le résultat. Annulation de la modif...`);
				// On écrase le mauvais code par le meilleur code connu avant de redemander à l'IA
				currentHtml = bestHtml;
			}

			// Si on a atteint la limite d'essais, on arrête les frais
			if (evaluation.score >= TARGET_SCORE) {
				console.log(`🎉 Score cible atteint (${evaluation.score}%) !`);
				await visualCritic.evaluate(currentHtml, buffer, context.width, context.height, true); // Sauvegarde finale
				return currentHtml;
			}

			// 2. SI ON A ÉCHOUÉ MAIS PAS FINI : On demande la correction
			if (!isLastAttempt) {
				console.log("🛠️ Qualité insuffisante. Appel à l'IA pour correction...");
				const isRollback = evaluation.score < bestScore;
				currentHtml = await this.askGroqToFix(currentHtml, evaluation.diffBuffer, isRollback);
			} else {
				console.log("⚠️ Limite d'essais atteinte. On retourne la meilleure version trouvée.");
			}
		}

		return bestHtml;
	},

	/**
	 * L'agent de correction : il regarde l'image Diff et corrige le code
	 */
	async askGroqToFix(currentHtml: string, diffImageBuffer: Buffer, isRollback: boolean): Promise<string> {


		let instructions = TAILWIND_CORRECTOR_PROMPT;

		if (isRollback) {
			instructions +=
				' ATTENTION : Ta précédente tentative a empiré le résultat (les marges ou les tailles ont explosé). Fais des micro-ajustements très subtils cette fois-ci (ex: p-2 au lieu de p-4, ou ajuste simplement les textes/couleurs) sans bouleverser la structure.';
		}
		const fixCompletion = await groq.chat.completions.create({
			messages: [
				{
					role: 'system',
					content: instructions,
				},
				{
					role: 'user',
					content: [
						{ type: 'text', text: `Voici le code actuel généré, corrige-le :\n${currentHtml}` },
						{ type: 'image_url', image_url: { url: `data:image/png;base64,${diffImageBuffer.toString('base64')}` } },
						{
							type: 'text',
							text: `L'image Diff montre en rouge les zones qui ne correspondent pas à la maquette originale. Analyse attentivement ces zones pour identifier les erreurs de layout (flex/grid), de spacing (padding/margin), ou de taille (width/height). Corrige uniquement les classes utilitaires Tailwind liées au layout, au spacing, et à la taille. NE TOUCHE PAS aux classes de couleurs arbitraires (ex: bg-[#d2e6dc]) qui sont critiques pour la charte graphique. Conserve strictement la structure HTML et le contenu textuel. Renvoie uniquement le code HTML corrigé, sans aucun bloc markdown ni explication.`,
						},
					],
				},
			],
			model: 'meta-llama/llama-4-scout-17b-16e-instruct',
			temperature: isRollback ? 0.3 : 0.1,
		});

		return this.cleanStringFormat(fixCompletion.choices[0]?.message?.content || currentHtml);
	},
};
