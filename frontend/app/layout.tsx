import type { Metadata } from 'next';
import {  Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'PicToTailwind | Transforme tes maquettes en code',
	description: "Générateur de code Tailwind CSS propulsé par l'IA à partir de captures d'écran.",
};

export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
	return (
		<html lang="fr">
			<body className={`${inter.className} min-h-screen flex flex-col`}>
				{/* Header global */}
				<header className="border-b bg-white sticky top-0 z-50">
					<div className="container mx-auto px-4 h-16 flex items-center justify-between">
						<h1 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-emerald-500 to-teal-600">PicToTailwind</h1>
						<nav>
							{/* Liens de navigation si besoin */}
							<a
								href="https://github.com/Ychnightder/PicToTailwind"
								target="_blank"
								rel="noreferrer"
								className="text-sm font-medium text-slate-600 hover:text-slate-900">
								GitHub
							</a>
						</nav>
					</div>
				</header>

				{/* Contenu principal injecté ici */}
				<main className="flex-1 container mx-auto  py-8">{children}</main>

				{/* Footer simple */}
				<footer className="border-t bg-slate-50 py-6 text-center text-sm text-slate-500">Propulsé par Fastify, Puppeteer & Groq.</footer>
			</body>
		</html>
	);
}
