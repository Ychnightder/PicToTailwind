
export default function Home() {
	return (
		<div className="max-w-5xl mx-auto space-y-12">
			{/* --- EN-TÊTE DE LA PAGE --- */}
			<section className="text-center space-y-4">
				<h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Glisse une image, récupère du Tailwind.</h2>
				<p className="text-lg text-slate-600 max-w-2xl mx-auto">
					L&apos;agent IA analyse ta maquette, rédige le code, et s&apos;auto-corrige visuellement pour un résultat au pixel près.
				</p>
			</section>

			{/* --- ZONE 1 : UPLOAD (Drag & Drop / Paste) --- */}
			<section className="border-2 border-dashed border-slate-300 rounded-2xl p-12 bg-white flex flex-col items-center justify-center text-center transition-colors hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer">
				<div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
					<svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
					</svg>
				</div>
				<h3 className="text-xl font-semibold mb-2">Clique ou glisse une capture ici</h3>
				<p className="text-slate-500 text-sm">Supporte le Presse-papier (Ctrl+V / Cmd+V).</p>
			</section>

			{/* --- ZONE 2 : PROGRESSION (À afficher pendant l'appel API) --- */}
			{/* Note: Cette section sera conditionnée par un état isLoading plus tard */}
			<section className="bg-white border rounded-xl p-6 shadow-sm hidden">
				<h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
					<span className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full"></span>
					L&apos;agent travaille...
				</h3>
				<ul className="space-y-3 text-sm text-slate-600">
					<li className="flex items-center gap-2 text-emerald-600 font-medium">✅ Analyse de l&apos;image (1440x1029)</li>
					<li className="flex items-center gap-2 text-emerald-600 font-medium">✅ Génération de la structure HTML</li>
					<li className="flex items-center gap-2">⏳ Évaluation visuelle (Essai 1/5 - Score: 68%)...</li>
				</ul>
			</section>

			{/* --- ZONE 3 : RÉSULTAT (Split Screen) --- */}
			{/* Note: Cette section sera affichée quand le code sera généré */}
      
			<section className="grid md:grid-cols-2 gap-6 hidden"> 
				{/* Colonne Gauche : Aperçu */}
				<div className="flex flex-col h-full">
					<h3 className="font-semibold text-lg mb-3">Rendu visuel</h3>
					<div className="flex-1 border rounded-xl bg-slate-100 overflow-hidden min-h-[400px]">
						{/* Un iframe sera parfait ici pour isoler le CSS généré */}
						<div className="w-full h-full flex items-center justify-center text-slate-400">Zone d&apos;aperçu Iframe</div>
					</div>
				</div>

				{/* Colonne Droite : Code */}
				<div className="flex flex-col h-full">
					<div className="flex justify-between items-center mb-3">
						<h3 className="font-semibold text-lg">Code Tailwind</h3>
						<button className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">Copier le code</button>
					</div>
					<div className="flex-1 border rounded-xl bg-slate-900 p-4 overflow-auto min-h-[400px]">
						<pre className="text-sm text-emerald-400 font-mono">
							<code>
								{`<div class="flex flex-col...">
  ...
</div>`}
							</code>
						</pre>
					</div>
				</div>
			</section>
		</div>
	);
}
