<script lang="ts">
	import type { FavoriteCat, CalendarEvent } from '$lib/types.js';
	import { MONTH_NAMES, DAY_NAMES, getMonthGrid } from '$lib/utils/calendar.js';

	interface Props {
		year: number;
		month: number;
		photo: FavoriteCat | null | undefined;
		events: CalendarEvent[];
		forPrint?: boolean;
	}

	let { year, month, photo, events, forPrint: _forPrint = false }: Props = $props();

	const grid = $derived(getMonthGrid(year, month));
	const photoSrc = $derived(photo?.imageDataUrl ?? photo?.imageUrl ?? '');

	const eventsByDay = $derived(
		events.reduce<Record<number, CalendarEvent[]>>((acc, ev) => {
			const d = new Date(ev.date + 'T12:00:00');
			if (d.getFullYear() === year && d.getMonth() === month) {
				const day = d.getDate();
				if (!acc[day]) acc[day] = [];
				acc[day].push(ev);
			}
			return acc;
		}, {})
	);
</script>

<div class="flex h-full flex-col overflow-hidden rounded-lg border border-base-300 bg-base-100">
	<!-- Photo: top ~50% -->
	<div class="relative overflow-hidden bg-base-200" style="flex: 0 0 50%;">
		{#if photoSrc}
			<img src={photoSrc} alt="{MONTH_NAMES[month]} {year}" class="h-full w-full object-cover" />
		{:else}
			<div class="flex h-full items-center justify-center text-base-content/20">
				<span class="text-6xl">🐱</span>
			</div>
		{/if}
	</div>

	<!-- Calendar grid: bottom ~50% -->
	<div class="flex min-h-0 flex-1 flex-col p-2">
		<h2 class="mb-1 shrink-0 text-center text-sm font-bold">
			{MONTH_NAMES[month]}
			{year}
		</h2>

		<!-- Day-of-week headers -->
		<div class="grid shrink-0 grid-cols-7">
			{#each DAY_NAMES as day (day)}
				<div class="py-0.5 text-center text-[9px] font-semibold text-base-content/50">{day}</div>
			{/each}
		</div>

		<!-- Day cells -->
		<div class="grid flex-1 grid-cols-7">
			{#each grid as cell, i (i)}
				<div
					class="overflow-hidden border border-base-200 p-0.5
						{!cell ? 'bg-base-200/50' : ''}"
					style="min-height: 0;"
				>
					{#if cell}
						<span class="block text-[9px] leading-none font-semibold">{cell}</span>
						{#if eventsByDay[cell]}
							<div class="mt-px flex flex-col gap-px">
								{#each eventsByDay[cell] as ev, evI (ev.id ?? evI)}
									<span
										class="block truncate rounded px-0.5 text-[7px] leading-tight"
										style="background-color: {ev.color ?? '#3b82f6'}; color: {ev.textColor ??
											'#fff'}">{ev.emoji ?? ''}{ev.title}</span
									>
								{/each}
							</div>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
