<script lang="ts">
	import { db } from '$lib/db.js';
	import { liveQuery } from 'dexie';

	let isDragging = $state(false);
	let uploading = $state(false);
	let errorMsg = $state('');

	const uploads = $derived(
		liveQuery(() =>
			db.favorites
				.toArray()
				.then((all) =>
					all.filter((c) => c.isUploaded).sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
				)
		)
	);

	async function handleFiles(files: FileList | null) {
		if (!files || files.length === 0) return;
		uploading = true;
		errorMsg = '';
		try {
			for (const file of Array.from(files)) {
				if (!file.type.startsWith('image/')) continue;
				const dataUrl = await readAsDataURL(file);
				const name = file.name.replace(/\.[^.]+$/, '');
				await db.favorites.add({
					imageDataUrl: dataUrl,
					isUploaded: true,
					name,
					addedAt: new Date()
				});
			}
		} catch {
			errorMsg = 'Failed to upload image. Please try again.';
		} finally {
			uploading = false;
		}
	}

	function readAsDataURL(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(file);
		});
	}

	function onFileInput(e: Event) {
		handleFiles((e.target as HTMLInputElement).files);
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		handleFiles(e.dataTransfer?.files ?? null);
	}
</script>

<div class="max-w-3xl space-y-6">
	<h1 class="text-2xl font-bold">Upload Your Cats</h1>

	<!-- Drop zone -->
	<div
		class="cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors
			{isDragging ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-primary/50'}"
		role="region"
		aria-label="File upload area"
		ondragover={(e) => {
			e.preventDefault();
			isDragging = true;
		}}
		ondragleave={() => (isDragging = false)}
		ondrop={onDrop}
	>
		<div class="flex flex-col items-center gap-3">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-12 w-12 text-base-content/30"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
				/>
			</svg>
			<p class="text-base-content/60">Drag & drop cat photos here</p>
			<span class="text-sm text-base-content/40">or</span>
			<label class="btn btn-primary">
				{uploading ? 'Uploading…' : 'Choose Files'}
				<input
					type="file"
					accept="image/*"
					multiple
					class="hidden"
					onchange={onFileInput}
					disabled={uploading}
				/>
			</label>
			<p class="text-xs text-base-content/40">Supports JPG, PNG, GIF, WebP</p>
		</div>
	</div>

	{#if errorMsg}
		<div class="alert alert-error"><span>{errorMsg}</span></div>
	{/if}

	<!-- Uploaded photos -->
	{#if $uploads && $uploads.length > 0}
		<div>
			<h2 class="mb-3 text-lg font-semibold">Uploaded ({$uploads.length})</h2>
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
				{#each $uploads as cat (cat.id)}
					<div class="group card relative overflow-hidden bg-base-100 shadow">
						<figure class="aspect-square overflow-hidden bg-base-200">
							<img
								src={cat.imageDataUrl}
								alt={cat.name ?? 'cat'}
								class="h-full w-full object-cover"
							/>
						</figure>
						<button
							class="btn absolute top-2 right-2 btn-circle opacity-0 shadow transition-opacity btn-xs btn-error group-hover:opacity-100"
							onclick={() => cat.id != null && db.favorites.delete(cat.id)}
							aria-label="Remove">✕</button
						>
						{#if cat.name}
							<div class="truncate px-2 py-1 text-sm font-medium">{cat.name}</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
