# Plan: Cat Calendar Application (SvelteKit)

A SvelteKit app with 4 routes — Browse, Favorites, Upload, Calendar — backed by server-side TheCatAPI proxy routes, TanStack Query for fetching, and Dexie IndexedDB for local storage.

---

## Phase 1 — Core Infrastructure _(no dependencies)_

1. Create `src/lib/types.ts` — shared TS interfaces: `CatImage`, `FavoriteCat`, `CalendarRecord`, `CalendarEvent`
2. Create `src/lib/db.ts` — Dexie instance with 3 tables:
   - `favorites` (`++id, catApiId, isUploaded, addedAt`) — stores both API-sourced and uploaded cats
   - `calendars` (`++id, name, year, createdAt`) — each stores a `photoIds: number[]` (12 `FavoriteCat` IDs)
   - `calendarEvents` (`++id, calendarId, date`) — per-day events linked to a calendar
3. Create `src/lib/utils/useLiveQuery.svelte.ts` — Svelte 5 `$state`/`$effect` wrapper around `Dexie.liveQuery()` returning a reactive getter
4. Create `src/lib/utils/calendar.ts` — month grid generator (6×7 cells, Sunday-start) + `getDefaultYear()` logic (`>= March 1` → next year; current date March 30, 2026 → default **2027**)

---

## Phase 2 — API Proxy Routes _(parallel, no dependencies)_

5. `src/routes/api/cats/images/+server.ts` — reads `CATAPIKEY` from `$env/static/private`, initializes TheCatAPI SDK, proxies `searchImages()` calls. Query params: `page`, `limit`, `order` (ASC/DESC/RAND), `hasBreeds`, `breedId`, `categoryId`, `mimeTypes`, `size`
6. `src/routes/api/cats/breeds/+server.ts` — returns full breed list from TheCatAPI SDK
7. `src/routes/api/cats/categories/+server.ts` — returns categories list (HATS, SPACE, SUNGLASSES, BOXES, TIES, SINKS, CLOTHES)

---

## Phase 3 — Layout & Global Components _(parallel, depends on Phase 1)_

8. Modify `src/routes/+layout.svelte` — wrap `{@render children()}` in `QueryClientProvider`, import and render `Navbar`
9. Create `src/lib/components/Navbar.svelte` — DaisyUI `navbar` with links: Browse, Favorites, Upload, Calendar; highlight active link
10. Create `src/lib/components/CatCard.svelte` — DaisyUI `card` with cat image, heart-toggle favorite button using `useLiveQuery` to reflect current local state; calls `db.favorites.add/delete`

---

## Phase 4 — Browse Page _(depends on Phases 2 + 3)_

11. Create `src/routes/browse/+page.svelte`:
    - Breed filter (dropdown via `createQuery(['breeds'])`)
    - Category filter (`createQuery(['categories'])`)
    - Order, size, mimeType, `hasBreeds` toggle filters
    - `createInfiniteQuery` against `/api/cats/images`, `initialPageParam: 0`, `getNextPageParam` returns `undefined` when page is empty
    - Renders a responsive grid of `CatCard` components; "Load More" button

---

## Phase 5 — Favorites & Upload _(depends on Phase 3, parallel with each other)_

12. Create `src/lib/components/FavoriteCard.svelte` — card with remove (×) button and optional name label
13. Create `src/routes/favorites/+page.svelte` — two DaisyUI tabs ("Cat API" / "My Uploads"), renders `FavoriteCard` from `useLiveQuery(() => db.favorites.toArray())`
14. Create `src/routes/upload/+page.svelte` — file `<input accept="image/*">`, reads as `FileReader.readAsDataURL`, stores `imageDataUrl` in `db.favorites`, shows instant preview via `useLiveQuery`

---

## Phase 6 — Calendar Builder & Print _(depends on Phase 5)_

15. Create `src/lib/components/PhotoPickerModal.svelte` — DaisyUI modal displaying all favorites; user clicks a photo to select for a month slot
16. Create `src/lib/components/EventForm.svelte` — form row: date picker, title input, color swatch, emoji picker (simple input), add/save to `db.calendarEvents`
17. Create `src/lib/components/CalendarMonth.svelte` — portrait layout: **photo fills top ~50%**, 7-column grid fills bottom; event titles appear on their date cells with styled chips
18. Create `src/routes/calendar/+page.svelte` — list of saved calendars (`useLiveQuery`); create new: name input, year selector (default 2027); 12 month slots each opening `PhotoPickerModal`; event list with `EventForm`; "Preview & Print" link to `/calendar/print?id=X`
19. Create `src/routes/calendar/print/+page.svelte` — reads calendar ID from `?id`, loads from Dexie, renders 12 × `CalendarMonth`; CSS `@media print` hides UI chrome; `@page { size: A4 portrait; margin: 1cm; }` with `page-break-after: always` between months; "Print" button → `window.print()`

---

## Phase 7 — Final Polish _(depends on all above)_

20. `src/routes/+page.svelte` — redirect to `/browse`
21. Loading skeletons (DaisyUI `skeleton` class) and empty states throughout

---

## Decisions

- `CATAPIKEY` kept server-side; all TheCatAPI calls go through `/api/cats/*` routes
- Multiple calendars supported (Dexie `calendars` table); default year is **2027** (current date > March 1)
- Dexie liveQuery wrapped in a reusable `useLiveQuery.svelte.ts` utility using Svelte 5 runes
- Portrait orientation: photo top half, calendar grid bottom half

---

## Technology Notes

### TheCatAPI SDK

```typescript
import { TheCatAPI } from '@thatapicompany/thecatapi';
const client = new TheCatAPI(apiKey);
// client.images.searchImages({ limit, page, order, hasBreeds, breeds, categories, mimeTypes, size })
// Breed enum: ABYSSINIAN, BENGAL, SIAMESE, ... (60+ breeds)
// Category enum: HATS (1), SPACE (2), SUNGLASSES (4), BOXES (5), TIES (7), SINKS (14), CLOTHES (15)
```

### TanStack Query (Svelte 5)

```typescript
// Options must be wrapped in an Accessor (function) for reactivity
createInfiniteQuery(() => ({
  queryKey: ['cats', filters],
  queryFn: ({ pageParam }) => fetch(`/api/cats/images?page=${pageParam}&...`).then(r => r.json()),
  initialPageParam: 0,
  getNextPageParam: (lastPage, _, lastPageParam) =>
    lastPage.length < limit ? undefined : lastPageParam + 1
}))
```

### Dexie liveQuery (Svelte 5 wrapper)

```typescript
// useLiveQuery.svelte.ts
export function useLiveQuery<T>(querier: () => T | Promise<T>) {
  let result = $state<T | undefined>(undefined);
  $effect(() => {
    const sub = liveQuery(querier).subscribe(v => { result = v; });
    return () => sub.unsubscribe();
  });
  return { get value() { return result; } };
}
```

### Calendar Utilities

```typescript
// getDefaultYear: >= March 1 → next year
function getDefaultYear(): number {
  const now = new Date();
  return now >= new Date(now.getFullYear(), 2, 1)
    ? now.getFullYear() + 1
    : now.getFullYear();
}
// March 30, 2026 → returns 2027

// getMonthGrid: returns 6×7 array of day numbers (0 = padding)
function getMonthGrid(year: number, month: number): (number | null)[]
```

---

## Dexie Schema

```typescript
class CatCalendarDB extends Dexie {
  favorites!: Table<FavoriteCat, number>;
  calendars!: Table<CalendarRecord, number>;
  calendarEvents!: Table<CalendarEvent, number>;
  constructor() {
    super('CatCalendarDB');
    this.version(1).stores({
      favorites: '++id, catApiId, isUploaded, addedAt',
      calendars: '++id, name, year, createdAt',
      calendarEvents: '++id, calendarId, date'
    });
  }
}
```

---

## Types

```typescript
interface CatImage {
  id: string;
  url: string;
  width?: number;
  height?: number;
  breeds?: { name: string; id: string }[];
}

interface FavoriteCat {
  id?: number;         // Dexie auto-increment
  catApiId?: string;   // undefined for uploads
  imageUrl?: string;   // URL for API cats
  imageDataUrl?: string; // base64 for uploads
  isUploaded: boolean;
  name?: string;
  addedAt: Date;
}

interface CalendarRecord {
  id?: number;
  name: string;
  year: number;
  photoIds: (number | null)[];  // length 12, FavoriteCat IDs (null = unset)
  createdAt: Date;
}

interface CalendarEvent {
  id?: number;
  calendarId: number;
  date: string;        // YYYY-MM-DD
  title: string;
  color?: string;      // background hex
  textColor?: string;  // text hex
  emoji?: string;
}
```

---

## Verification Checklist

- [ ] `npm run dev` — no console errors, all 4 nav routes accessible
- [ ] Browse: cats appear, filters narrow results, "Load More" fetches next page, heart saves to Dexie
- [ ] Favorites: favorited cats visible, tabs work, removing a cat removes it instantly
- [ ] Upload: upload a JPG, appears in Favorites > My Uploads immediately
- [ ] Calendar: create a calendar, assign 12 photos, add events, navigate to print page
- [ ] Print: `window.print()` opens dialog, each month on its own page
- [ ] `npm run check` — zero TypeScript errors
