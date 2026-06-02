import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import sharp from 'sharp';
import fs from 'fs'; 


const isVercel = process.env.VERCEL === 'true' || process.env.NODE_ENV === 'production';



// Dans ta fonction d'évaluation visuelle :
async function launchBrowser(width: number, height: number) {

	if (isVercel) {
    // Configuration obligatoire pour que ça tourne sur les serveurs de Vercel
		return await puppeteer.launch({
			args: chromium.args,
			defaultViewport: { width: width || 1280, height: height || 720 },
			executablePath: await chromium.executablePath(),
			// cast to any because the chromium package's typings may not expose `headless`
			headless: (chromium as any).headless,
		});
  } else {
    // En local (Windows), on utilise l'exécutable local classique
    // Ajuste le chemin si ton Chrome ou Edge est installé ailleurs, ou utilise puppeteer normal en local
    return await puppeteer.launch({
      headless: true,
      // Si tu as installé "puppeteer" globalement ou si tu veux que puppeteer-core trouve ton Chrome local :
      channel: 'chrome', 
    });
  }
}


export const visualCritic = {
	async evaluate(html: string, originalImageBuffer: Buffer, width = 1024, height = 768, isFinal = false) {
		const browser = await launchBrowser(width, height);
		const page = await browser.newPage();
		await page.setViewport({ width, height });

		// 1. On enveloppe le code de Groq dans un HTML propre (sans balise script pour l'instant)
		let htmlToRender = html.trim();
		if (!htmlToRender.toLowerCase().includes('<html')) {
			htmlToRender = `
                <!doctype html>
                <html lang="fr">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                </head>
                <body class="bg-white antialiased m-0 p-0 min-h-screen">
                    ${htmlToRender}
                </body>
                </html>
            `;
		} else {
			// Nettoyage au cas où Groq a mis des mauvais liens CSS/JS
			htmlToRender = htmlToRender.replace(/<script.*tailwindcss.*<\/script>/gi, '');
		}

		// 2. On injecte le HTML de base
		await page.setContent(htmlToRender, { waitUntil: 'load' });

		// 3. LA SOLUTION : On injecte Tailwind v4 nativement via Puppeteer
		await page.addScriptTag({
			url: 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4',
		});

		// 4. On force Puppeteer à attendre 1 seconde (1000ms)
		// C'est vital pour laisser à Tailwind le temps de générer et peindre le CSS !
		await new Promise(resolve => setTimeout(resolve, 1000));

		// 5. Prendre la capture d'écran (maintenant stylisée)
		const rawScreenshot = await page.screenshot({ type: 'png' });
		const screenshotBuffer = Buffer.from(rawScreenshot);
		await browser.close();

		// --- Le reste de ton code pour le Diff ---
		const sourceResizedBuffer = await sharp(originalImageBuffer).resize(width, height, { fit: 'fill' }).png().toBuffer();

		const imgTarget = PNG.sync.read(sourceResizedBuffer);
		const imgGenerated = PNG.sync.read(screenshotBuffer);

		const diff = new PNG({ width, height });

		const numDiffPixels = pixelmatch(imgTarget.data, imgGenerated.data, diff.data, width, height, { threshold: 0.1 });

		const totalPixels = width * height;
		const matchScore = ((totalPixels - numDiffPixels) / totalPixels) * 100;

		if (isVercel) {
			if (isFinal) {
				// S'assure que le dossier existe (optionnel mais recommandé)
				if (!fs.existsSync('./debug')) fs.mkdirSync('./debug');

				fs.writeFileSync('./debug/debug-generated.png', screenshotBuffer);
				fs.writeFileSync('./debug/debug-target.png', sourceResizedBuffer);
				fs.writeFileSync('./debug/debug-diff.png', PNG.sync.write(diff));
			}
		}

		return {
			score: Number(matchScore.toFixed(2)),
			diffBuffer: PNG.sync.write(diff),
			screenshotBuffer,
		};
	},
};
