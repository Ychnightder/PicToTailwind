"use client";
import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Loader2, CheckCircle2, Copy, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import prettier from 'prettier/standalone';
import htmlParser from 'prettier/plugins/html';

const NEXT_PUBLIC_URL_BACKEND = process.env.NEXT_PUBLIC_URL_BACKEND || 'http://localhost:5000';

export default function Home() {
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadStatus, setUploadStatus] = useState<string>('');

	const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
	const [isCopied, setIsCopied] = useState(false);

	// Référence pour le clic sur le bouton d'upload classique
	const fileInputRef = useRef<HTMLInputElement>(null);

	const processImage = async (file: File) => {
		if (!file.type.startsWith('image/')) {
			return;
		}

		setIsUploading(true);
		setUploadStatus('Processing...');

		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch(`${NEXT_PUBLIC_URL_BACKEND}/upload`, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) throw new Error('Erreur');

			const data = await response.json();

      // const data = {
			// 	success: true,
			// 	result:
			// 		"<div class='flex justify-center items-center h-screen bg-gray-200'> <div class='bg-white p-8 rounded-lg shadow-md w-full max-w-lg mx-auto'> <h2 class='text-3xl font-bold mb-4 text-dark-green'>Contact Us</h2> <form class='flex flex-col gap-6'> <div class='flex flex-col gap-2'> <label class='text-sm font-medium text-gray-600'>First Name Last Name *</label> <div class='flex gap-4 flex-wrap sm:flex-nowrap'> <input type='text' placeholder='First Name' class='w-full sm:w-1/2 p-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500'> <input type='text' placeholder='Last Name' class='w-full sm:w-1/2 p-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500'> </div> </div> <div class='flex flex-col gap-2'> <label class='text-sm font-medium text-gray-600'>Email Address</label> <input type='email' placeholder='Email Address' class='w-full p-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500'> </div> <div class='flex flex-col gap-2'> <label class='text-sm font-medium text-gray-600'>Query Type</label> <div class='flex gap-4 flex-wrap'> <div class='flex items-center gap-2'> <input type='radio' id='general-enquiry' name='query-type' class='form-radio'> <label for='general-enquiry' class='text-sm text-gray-600'>General Enquiry</label> </div> <div class='flex items-center gap-2'> <input type='radio' id='support-request' name='query-type' class='form-radio'> <label for='support-request' class='text-sm text-gray-600'>Support Request</label> </div> </div> </div> <div class='flex flex-col gap-2'> <label class='text-sm font-medium text-gray-600'>Message *</label> <textarea placeholder='Message' class='w-full p-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500'></textarea> </div> <div class='flex items-center gap-2'> <input type='checkbox' id='consent' class='form-checkbox'> <label for='consent' class='text-sm text-gray-600'>I consent to being contacted by the team *</label> </div> <button type='submit' class='bg-dark-green text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-300'>Submit</button> </form> </div> </div>",
			// };

      const formattedHtml = await prettier.format(data.result, {
				parser: 'html',
				plugins: [htmlParser],
        tabWidth: 2,
				printWidth: 100,
			});

			setGeneratedHtml(formattedHtml);


			setUploadStatus('Success Generation !');
		} catch (error) {
			console.error('Error uploading file:', error);
			setUploadStatus('Error uploading file');
		} finally {
			setIsUploading(false);
		}
	};

	// --- 2. GESTION DU DRAG & DROP ---
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => {
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			processImage(e.dataTransfer.files[0]);
		}
	};

	// --- 3. GESTION DU PRESSE-PAPIER (Ctrl+V) ---
	useEffect(() => {
		const handlePaste = (e: ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (!items) return;

			for (let i = 0; i < items.length; i++) {
				if (items[i].type.indexOf('image') !== -1) {
					const file = items[i].getAsFile();
					if (file) processImage(file);
					break; // On ne prend que la première image collée
				}
			}
		};

		window.addEventListener('paste', handlePaste);
		return () => window.removeEventListener('paste', handlePaste);
	}, []);

	// NOUVEAU : Fonction pour copier le code
	const copyToClipboard = () => {
		if (generatedHtml) {
			navigator.clipboard.writeText(generatedHtml);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000); // Remet l'icône normale après 2s
		}
	};

	return (
		<div className="max-w-8xl mx-auto space-y-12 py-8 ">
			{/* --- EN-TÊTE --- */}
			<section className="text-center space-y-4">
				<Badge variant="secondary" className="mb-4">
					Bêta Publique Propulsée par Fastify
				</Badge>
				<h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Glisse une image, récupère du Tailwind.</h2>
				<p className="text-lg text-slate-600 max-w-2xl mx-auto">
					L&apos;agent IA analyse ta maquette, rédige le code, et s&apos;auto-corrige visuellement pour un résultat au pixel près.
				</p>
			</section>

			{/* --- ZONE 1 : UPLOAD --- */}
			{!isUploading && (
				<Card
					className={`border-2 border-dashed transition-all cursor-pointer group ${
						isDragging ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
					}`}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					onClick={() => fileInputRef.current?.click()}>
					<CardContent className="flex flex-col items-center justify-center p-16 text-center space-y-4">
						<div
							className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
							<UploadCloud className="w-10 h-10" />
						</div>
						<div className="space-y-1">
							<h3 className="text-xl font-semibold">{isDragging ? "Lâche l'image ici !" : 'Clique ou glisse une capture ici'}</h3>
							<p className="text-slate-500 text-sm">Supporte le Presse-papier (Ctrl+V / Cmd+V)</p>
						</div>

						{/* Input fichier caché pour le clic classique */}
						<input
							type="file"
							className="hidden"
							ref={fileInputRef}
							accept="image/*"
							onChange={e => e.target.files && processImage(e.target.files[0])}
						/>

						<Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white pointer-events-none">Sélectionner un fichier</Button>
					</CardContent>
				</Card>
			)}

			{/* --- ZONE 2 : CHARGEMENT & STATUT --- */}
			{isUploading && (
				<Card className="border-emerald-200 bg-emerald-50/50">
					<CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-6">
						<Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
						<div className="space-y-2">
							<h3 className="text-xl font-semibold text-slate-900">L&apos;agent IA est au travail...</h3>
							<p className="text-slate-600 animate-pulse">{uploadStatus}</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* --- ZONE 3 : RÉSULTAT --- generatedHtml && !isUploading  */}
			{generatedHtml && !isUploading && (
				<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ">
					<div className="flex justify-between items-center">
						<h3 className="text-2xl font-bold flex items-center gap-2">
							<CheckCircle2 className="text-emerald-500" />
							Composant généré
						</h3>
						<Button variant="outline" onClick={() => setGeneratedHtml(null)}>
							<RefreshCcw className="w-4 h-4 mr-2" />
							Nouvelle image
						</Button>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
						{/* Colonne Gauche : Aperçu visuel (Inchangée) */}
						<Card className="flex flex-col overflow-hidden border-slate-200 shadow-sm p-0 gap-0">
							<CardHeader className="bg-slate-50 border-b px-4 py-4">
								<CardTitle className="text-sm font-medium text-slate-500 ">Aperçu visuel</CardTitle>
							</CardHeader>
							<div className="flex-1 min-h-[300px] lg:min-h-[500px] bg-white relative p-0 ">
								<iframe
									srcDoc={`<!DOCTYPE html>
                    <html>
                      <head>
                        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                        <meta charset="UTF-8" />
                      </head>
                      <body>
                      ${generatedHtml}
                      </body>
                    </html>`}
									title="Aperçu du composant"
									className="absolute  w-full h-full"
									sandbox="allow-scripts"
								/>
							</div>
						</Card>

						{/* Colonne Droite : Code Source avec Coloration Syntaxique */}
						<Card className="flex flex-col overflow-hidden border-slate-800 bg-[#1e1e1e] shadow-sm relative p-0 gap-0">
							<CardHeader className="border-b border-slate-800  flex flex-row items-center justify-between bg-slate-950 px-4 py-4">
								<CardTitle className="text-sm font-medium text-slate-400">Code HTML / Tailwind</CardTitle>
								<Button
									size="sm"
									variant={isCopied ? 'secondary' : 'ghost'}
									className={`text-xs h-8 ${isCopied ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
									onClick={copyToClipboard}>
									{isCopied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
									{isCopied ? 'Copié !' : 'Copier'}
								</Button>
							</CardHeader>

							{/* 2. LE NOUVEAU BLOC DE CODE */}
							<div className="flex-1 overflow-auto custom-scrollbar text-sm">
								<SyntaxHighlighter language="html" style={vscDarkPlus} wrapLines={true} wrapLongLines={true} showLineNumbers={true}>
									{generatedHtml}
								</SyntaxHighlighter>
							</div>
						</Card>
					</div>
				</div>
			)}
		</div>
	);
}