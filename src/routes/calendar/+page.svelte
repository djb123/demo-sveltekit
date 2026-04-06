<script lang="ts">
	import { db } from '$lib/db.js';
	import { liveQuery } from 'dexie';
	import { getDefaultYear, MONTH_NAMES } from '$lib/utils/calendar.js';
	import type { CalendarRecord, CalendarEvent, FavoriteCat } from '$lib/types.js';
	import PhotoPickerModal from '$lib/components/PhotoPickerModal.svelte';
	import EventForm from '$lib/components/EventForm.svelte';
	import CalendarMonth from '$lib/components/CalendarMonth.svelte';
	import { resolve } from '$app/paths';

	// ── Calendar list ─────────────────────────────────────────────────────────
	const allCalendars = $derived(
		liveQuery(() => db.calendars.orderBy('createdAt').reverse().toArray())
	);

	// ── New calendar form ─────────────────────────────────────────────────────
	let newName = $state('');
	let newYear = $state(getDefaultYear());
	let creating = $state(false);

	async function createCalendar() {
		if (!newName.trim()) return;
		creating = true;
		try {
			const id = (await db.calendars.add({
				name: newName.trim(),
				year: newYear,
				photoIds: Array(12).fill(null),
				createdAt: new Date()
			})) as number;
			activeCalendarId = id;
			newName = '';
		} finally {
			creating = false;
		}
	}

	async function deleteCalendar(cal: CalendarRecord) {
		if (!confirm(`Delete "${cal.name}"? This will also delete all its events.`)) return;
		await db.calendarEvents.where('calendarId').equals(cal.id!).delete();
		await db.calendars.delete(cal.id!);
		if (activeCalendarId === cal.id) activeCalendarId = null;
	}

	// ── Active calendar ───────────────────────────────────────────────────────
	let activeCalendarId = $state<number | null>(null);

	const activeCalendar = $derived(
		activeCalendarId != null ? liveQuery(() => db.calendars.get(activeCalendarId!)) : undefined
	);

	const activeEvents = $derived(
		liveQuery<CalendarEvent[]>(() =>
			activeCalendarId != null
				? db.calendarEvents.where('calendarId').equals(activeCalendarId).toArray()
				: Promise.resolve([])
		)
	);

	// Load photos for the 12 slots
	let slotPhotos = $state<(FavoriteCat | null | undefined)[]>(Array(12).fill(undefined));

	$effect(() => {
		const photoIds = $activeCalendar?.photoIds;
		if (!photoIds) {
			slotPhotos = Array(12).fill(undefined);
			return;
		}
		const nonNullIds = photoIds.filter((id): id is number => id != null);
		if (nonNullIds.length === 0) {
			slotPhotos = Array(12).fill(null);
			return;
		}
		db.favorites.bulkGet(nonNullIds).then((fetched) => {
			const map = new Map(fetched.filter(Boolean).map((p) => [p!.id, p!]));
			slotPhotos = photoIds.map((id) => (id != null ? (map.get(id) ?? null) : null));
		});
	});

	// ── Photo picker modal ────────────────────────────────────────────────────
	let photoPickerOpen = $state(false);
	let pickingMonthIndex = $state<number | null>(null);

	function openPhotoPicker(monthIndex: number) {
		pickingMonthIndex = monthIndex;
		photoPickerOpen = true;
	}

	async function handlePhotoPick(cat: FavoriteCat) {
		if (activeCalendarId == null || pickingMonthIndex == null || !$activeCalendar) return;
		const photoIds = [...($activeCalendar.photoIds ?? Array(12).fill(null))];
		photoIds[pickingMonthIndex] = cat.id ?? null;
		await db.calendars.update(activeCalendarId, { photoIds });
	}

	async function clearSlot(monthIndex: number) {
		if (activeCalendarId == null || !$activeCalendar) return;
		const photoIds = [...($activeCalendar.photoIds ?? Array(12).fill(null))];
		photoIds[monthIndex] = null;
		await db.calendars.update(activeCalendarId, { photoIds });
	}

	// ── Event management ──────────────────────────────────────────────────────
	let editingEvent = $state<CalendarEvent | null>(null);

	async function deleteEvent(ev: CalendarEvent) {
		if (ev.id != null) await db.calendarEvents.delete(ev.id);
	}

	function sortedEvents(events: CalendarEvent[]) {
		return [...events].sort((a, b) => a.date.localeCompare(b.date));
	}

	// ── Preview calendar shown below builder ──────────────────────────────────
	let showPreview = $state(false);

	const filledSlots = $derived(($activeCalendar?.photoIds ?? []).filter((id) => id != null).length);
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h1 class="text-2xl font-bold">My Calendars</h1>
	</div>

	<!-- Create new calendar -->
	<div class="card bg-base-200 p-4">
		<h2 class="mb-3 font-semibold">New Calendar</h2>
		<div class="flex flex-wrap items-end gap-2">
			<div class="form-control min-w-48 flex-1">
				<label for="cal-name" class="label pb-1"
					><span class="label-text text-xs">Calendar name</span></label
				>
				<input
					id="cal-name"
					type="text"
					class="input-bordered input input-sm"
					placeholder="e.g. Family Cats 2027"
					bind:value={newName}
					maxlength="60"
					onkeydown={(e) => e.key === 'Enter' && createCalendar()}
				/>
			</div>
			<div class="form-control">
				<label for="cal-year" class="label pb-1"><span class="label-text text-xs">Year</span></label
				>
				<input
					id="cal-year"
					type="number"
					class="input-bordered input input-sm w-24"
					bind:value={newYear}
					min="2024"
					max="2040"
				/>
			</div>
			<button
				class="btn self-end btn-sm btn-primary"
				onclick={createCalendar}
				disabled={creating || !newName.trim()}
			>
				{creating ? 'Creating…' : 'Create'}
			</button>
		</div>
	</div>

	<!-- Calendar list -->
	{#if $allCalendars === undefined}
		<div class="flex gap-3">
			{#each Array(3) as _, i (i)}
				<div class="h-20 w-48 skeleton rounded-xl"></div>
			{/each}
		</div>
	{:else if $allCalendars.length === 0}
		<div class="alert"><span>No calendars yet. Create one above to get started.</span></div>
	{:else}
		<div class="flex flex-wrap gap-3">
			{#each $allCalendars as cal (cal.id)}
				<div
					class="card cursor-pointer border-2 bg-base-100 shadow transition-colors
						{activeCalendarId === cal.id ? 'border-primary' : 'border-transparent hover:border-base-300'}"
					role="button"
					tabindex="0"
					onclick={() => (activeCalendarId = cal.id ?? null)}
					onkeydown={(e) => e.key === 'Enter' && (activeCalendarId = cal.id ?? null)}
				>
					<div class="card-body px-4 py-3">
						<div class="flex items-start justify-between gap-4">
							<div>
								<p class="font-semibold">{cal.name}</p>
								<p class="text-sm text-base-content/60">{cal.year}</p>
							</div>
							<button
								class="btn btn-circle text-error opacity-60 btn-ghost btn-xs hover:opacity-100"
								onclick={(e) => {
									e.stopPropagation();
									deleteCalendar(cal);
								}}
								aria-label="Delete calendar">✕</button
							>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Calendar editor -->
	{#if $activeCalendar}
		{@const cal = $activeCalendar}
		<div class="divider"></div>

		<div class="flex flex-wrap items-center justify-between gap-2">
			<h2 class="text-xl font-bold">{cal.name} — {cal.year}</h2>
			<div class="flex gap-2">
				<button class="btn btn-ghost btn-sm" onclick={() => (showPreview = !showPreview)}>
					{showPreview ? 'Hide preview' : 'Show preview'}
				</button>
				<a
					href="{resolve('/calendar/print')}?id={cal.id}"
					class="btn btn-sm btn-primary"
					target="_blank"
				>
					Preview & Print
				</a>
			</div>
		</div>

		<div class="flex items-center gap-2 text-sm text-base-content/60">
			<span>{filledSlots}/12 photos assigned</span>
			{#if filledSlots === 12}
				<span class="badge badge-sm badge-success">Ready to print!</span>
			{/if}
		</div>

		<!-- 12 month slots (3×4 grid) -->
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
			{#each MONTH_NAMES as monthName, i (monthName)}
				{@const photo = slotPhotos[i]}
				<div class="group relative">
					<button
						class="aspect-[3/4] w-full overflow-hidden rounded-xl border-2 border-dashed transition-colors
							{photo ? 'border-transparent' : 'border-base-300 bg-base-200 hover:border-primary/50'}"
						onclick={() => openPhotoPicker(i)}
						title="Pick photo for {monthName}"
					>
						{#if photo}
							<img
								src={photo.imageDataUrl ?? photo.imageUrl ?? ''}
								alt={monthName}
								class="h-full w-full object-cover"
							/>
							<div
								class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20"
							>
								<span
									class="rounded bg-black/50 px-2 py-1 text-xs font-semibold text-white opacity-0 group-hover:opacity-100"
									>Change</span
								>
							</div>
						{:else}
							<div class="flex h-full flex-col items-center justify-center gap-1">
								<span class="text-2xl opacity-30">🐱</span>
								<span class="text-xs text-base-content/40">{monthName}</span>
							</div>
						{/if}
					</button>
					{#if photo}
						<button
							class="btn absolute top-1 right-1 z-10 btn-circle opacity-0 shadow transition-opacity btn-xs btn-error group-hover:opacity-100"
							onclick={() => clearSlot(i)}
							aria-label="Remove photo">✕</button
						>
					{/if}
					<p class="mt-1 text-center text-xs font-medium text-base-content/60">{monthName}</p>
				</div>
			{/each}
		</div>

		<!-- Events section -->
		<div class="divider">Events</div>

		<EventForm
			calendarId={cal.id!}
			year={cal.year}
			{editingEvent}
			onDone={() => (editingEvent = null)}
		/>

		{#if ($activeEvents ?? []).length > 0}
			<div class="overflow-x-auto">
				<table class="table table-sm">
					<thead>
						<tr>
							<th>Date</th>
							<th>Event</th>
							<th>Style</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each sortedEvents($activeEvents ?? []) as ev (ev.id)}
							<tr>
								<td class="whitespace-nowrap">{ev.date}</td>
								<td>
									<span class="font-medium">{ev.emoji ?? ''} {ev.title}</span>
								</td>
								<td>
									<span
										class="badge badge-sm"
										style="background-color: {ev.color ?? '#3b82f6'}; color: {ev.textColor ??
											'#fff'}; border:none">{ev.title.slice(0, 12)}</span
									>
								</td>
								<td class="flex gap-1">
									<button class="btn btn-ghost btn-xs" onclick={() => (editingEvent = ev)}
										>Edit</button
									>
									<button class="btn text-error btn-ghost btn-xs" onclick={() => deleteEvent(ev)}
										>Delete</button
									>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="text-sm text-base-content/50">No events yet. Add important dates above.</p>
		{/if}

		<!-- Mini preview -->
		{#if showPreview}
			<div class="divider">Preview</div>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
				{#each MONTH_NAMES as _, i (i)}
					<div class="aspect-[3/4]">
						<CalendarMonth
							year={cal.year}
							month={i}
							photo={slotPhotos[i] ?? null}
							events={($activeEvents ?? []).filter((e) => {
								const d = new Date(e.date + 'T12:00:00');
								return d.getMonth() === i && d.getFullYear() === cal.year;
							})}
						/>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<!-- Photo picker modal -->
<PhotoPickerModal
	bind:open={photoPickerOpen}
	monthName={pickingMonthIndex != null ? MONTH_NAMES[pickingMonthIndex] : ''}
	onPick={handlePhotoPick}
	onClose={() => (photoPickerOpen = false)}
/>
