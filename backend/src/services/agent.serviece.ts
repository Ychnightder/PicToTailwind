import { Groq } from 'groq-sdk';
import { GROQ_SYSTEM_PROMPT, GROQ_USER_PROMPT } from '../config/prompts.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const agentService = {
	/**
	 * Envoie l'image à Groq (Llama Vision) et extrait le code HTML/Tailwind épuré
     * @param buffer Le buffer de l'image à convertir
     * @param mimeType Le type MIME de l'image (ex: 'image/png')
     * @returns Le code HTML/Tailwind généré par Groq, nettoyé de tout bloc Markdown ou texte superflu
	 */
	async generateTailwindFromImage(buffer: Buffer, mimeType: string): Promise<string> {
		const base64Image = buffer.toString('base64');

		// On appelle directement `groq` sans utiliser `this`
		const chatCompletion = await groq.chat.completions.create({
			messages: [
				{
					role: 'system',
					content: GROQ_SYSTEM_PROMPT,
				},
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: GROQ_USER_PROMPT,
						},
						{
							type: 'image_url',
							image_url: { url: `data:${mimeType};base64,${base64Image}` },
						},
					],
				},
			],
			model: 'llama-3.2-11b-vision-preview',
			temperature: 0.1,
		});

		const rawHtml = chatCompletion.choices[0]?.message?.content || '';

		// Nettoyage des balises de code Markdown résiduelles (ex: ```html)
		return rawHtml;
	},
  
};