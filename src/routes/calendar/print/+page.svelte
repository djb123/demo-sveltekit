<script lang="ts">
	import { page } from '$app/state';
	import { db } from '$lib/db.js';
	import { useLiveQuery } from '$lib/utils/useLiveQuery.svelte.js';
	import { MONTH_NAMES } from '$lib/utils/calendar.js';
	import type { FavoriteCat, CalendarEvent } from '$lib/types.js';
	import CalendarMonth from '$lib/components/CalendarMonth.svelte';

	const calendarId = $derived(Number(page.url.searchParams.get('id') ?? '0'));

	const calendarQuery = useLiveQuery(() => (calendarId ? db.calendars.get(calendarId) : undefined));

	const eventsQuery = useLiveQuery<CalendarEvent[]>(() =>
		calendarId
			? db.calendarEvents.where('calendarId').equals(calendarId).toArray()
			: Promise.resolve([])
	);

	let slotPhotos = $state<(FavoriteCat | null | undefined)[]>(Array(12).fill(undefined));

	$effect(() => {
		const photoIds = calendarQuery.value?.photoIds;
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

	function monthEvents(month: number): CalendarEvent[] {
		return (eventsQuery.value ?? []).filter((e) => {
			const d = new Date(e.date + 'T12:00:00');
			return d.getFullYear() === calendarQuery.value?.year && d.getMonth() === month;
		});
	}

	function print() {
		window.print();
	}
</script>

<svelte:head>
	<title>{calendarQuery.value?.name ?? 'Calendar'} {calendarQuery.value?.year ?? ''}</title>
	<style>
		@media print {
			.no-print {
				display: none !important;
			}
			body {
				margin: 0;
			}
			.month-page {
				page-break-after: always;
				break-after: page;
			}
			.month-page:last-child {
				page-break-after: avoid;
				break-after: avoid;
			}
		}
		@page {
			size: A4 portrait;
			margin: 1cm;
		}
	</style>
</svelte:head>

<!-- Print toolbar -->
<div class="no-print mb-6 flex items-center justify-between rounded-xl bg-base-200 p-4">
	<div>
		{#if calendarQuery.value}
			<h1 class="text-xl font-bold">{calendarQuery.value.name} — {calendarQuery.value.year}</h1>
			<p class="text-sm text-base-content/60">
				{(calendarQuery.value.photoIds ?? []).filter((id) => id != null).length}/12 photos assigned
			</p>
		{:else if calendarId === 0}
			<p class="text-error">No calendar ID provided in URL.</p>
		{:else}
			<div class="h-6 w-48 skeleton"></div>
		{/if}
	</div>
	<div class="flex gap-2">
		<a href="/calendar" class="btn btn-ghost btn-sm">← Back</a>
		<button class="btn btn-sm btn-primary" onclick={print}>🖨 Print</button>
	</div>
</div>

{#if !calendarId}
	<div class="no-print alert alert-error">
		<span>No calendar selected. Go back and choose a calendar to print.</span>
	</div>
{:else if calendarQuery.value === undefined}
	<!-- Loading -->
	<div class="no-print grid grid-cols-1 gap-0">
		{#each Array(12) as _, i (i)}
			<div class="mb-4 h-[297mm] w-full skeleton"></div>
		{/each}
	</div>
{:else if calendarQuery.value === null}
	<div class="no-print alert alert-error">
		<span>Calendar not found.</span>
	</div>
{:else}
	{@const cal = calendarQuery.value}
	{#each MONTH_NAMES as _, i (i)}
		<div
			class="month-page"
			style="width: 100%; aspect-ratio: 1 / 1.414; display: flex; flex-direction: column;"
		>
			<CalendarMonth
				year={cal.year}
				month={i}
				photo={slotPhotos[i] ?? null}
				events={monthEvents(i)}
				forPrint={true}
			/>
		</div>
	{/each}
{/if}
