<script lang="ts">
	import type { CalendarEvent } from '$lib/types.js';
	import { db } from '$lib/db.js';

	interface Props {
		calendarId: number;
		year: number;
		editingEvent?: CalendarEvent | null;
		onDone?: () => void;
	}

	let { calendarId, year, editingEvent = null, onDone }: Props = $props();

	let date = $state('');
	let title = $state('');
	let emoji = $state('');
	let color = $state('#3b82f6');
	let textColor = $state('#ffffff');
	let saving = $state(false);
	let errorMsg = $state('');

	// Sync fields when editingEvent changes
	$effect(() => {
		if (editingEvent) {
			date = editingEvent.date;
			title = editingEvent.title;
			emoji = editingEvent.emoji ?? '';
			color = editingEvent.color ?? '#3b82f6';
			textColor = editingEvent.textColor ?? '#ffffff';
		} else {
			date = '';
			title = '';
			emoji = '';
			color = '#3b82f6';
			textColor = '#ffffff';
		}
	});

	async function save() {
		if (!date || !title.trim()) {
			errorMsg = 'Date and title are required.';
			return;
		}
		saving = true;
		errorMsg = '';
		try {
			if (editingEvent?.id != null) {
				await db.calendarEvents.update(editingEvent.id, {
					date,
					title: title.trim(),
					emoji,
					color,
					textColor
				});
			} else {
				await db.calendarEvents.add({
					calendarId,
					date,
					title: title.trim(),
					emoji,
					color,
					textColor
				});
			}
			onDone?.();
		} catch {
			errorMsg = 'Failed to save event.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="card bg-base-200 p-4">
	<h3 class="mb-3 font-semibold">{editingEvent ? 'Edit Event' : 'Add Event'}</h3>
	<div class="flex flex-wrap items-end gap-2">
		<div class="form-control">
			<label for="ev-date" class="label pb-1"><span class="label-text text-xs">Date</span></label>
			<input
				id="ev-date"
				type="date"
				class="input-bordered input input-sm"
				bind:value={date}
				min="{year}-01-01"
				max="{year}-12-31"
			/>
		</div>

		<div class="form-control min-w-40 flex-1">
			<label for="ev-title" class="label pb-1"
				><span class="label-text text-xs">Event title</span></label
			>
			<input
				id="ev-title"
				type="text"
				class="input-bordered input input-sm"
				placeholder="e.g. Alex's Birthday!"
				bind:value={title}
				maxlength="60"
			/>
		</div>

		<div class="form-control w-20">
			<label for="ev-emoji" class="label pb-1"><span class="label-text text-xs">Emoji</span></label>
			<input
				id="ev-emoji"
				type="text"
				class="input-bordered input input-sm text-center"
				placeholder="🎂"
				bind:value={emoji}
				maxlength="4"
			/>
		</div>

		<div class="form-control">
			<label for="ev-color" class="label pb-1"
				><span class="label-text text-xs">BG color</span></label
			>
			<input
				id="ev-color"
				type="color"
				class="input-bordered input input-sm h-9 w-12 p-1"
				bind:value={color}
			/>
		</div>

		<div class="form-control">
			<label for="ev-textcolor" class="label pb-1"
				><span class="label-text text-xs">Text color</span></label
			>
			<input
				id="ev-textcolor"
				type="color"
				class="input-bordered input input-sm h-9 w-12 p-1"
				bind:value={textColor}
			/>
		</div>

		<button class="btn self-end btn-sm btn-primary" onclick={save} disabled={saving}>
			{saving ? 'Saving…' : editingEvent ? 'Update' : 'Add'}
		</button>

		{#if editingEvent}
			<button class="btn self-end btn-ghost btn-sm" onclick={() => onDone?.()}>Cancel</button>
		{/if}
	</div>
	{#if errorMsg}
		<p class="mt-2 text-sm text-error">{errorMsg}</p>
	{/if}
</div>
