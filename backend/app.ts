import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import uploadRoutes from './src/routes/upload.js';

const app = express();

app.use(
	cors({
		origin: ['https://pictotailwiind.vercel.app', 'http://localhost:3000'],
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		credentials: true,
	})
);

app.use(express.json());


// --- TES ROUTES ---

app.get('/', (req: Request, res: Response) => {
	res.json({ message: 'API Express opérationnelle sur Vercel ! 🚀' });
});

app.use(uploadRoutes,);

if (!process.env.VERCEL) {
	const PORT = 5000;

	app.listen(PORT, () => {
		console.log(`🚀 Serveur Express local démarré sur http://localhost:${PORT}`);
	});
}
export default app;
