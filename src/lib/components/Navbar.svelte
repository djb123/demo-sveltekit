<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	const links = [
		{ href: '/browse', label: 'Browse' },
		{ href: '/upload', label: 'Upload' },
		{ href: '/favorites', label: 'Favorites' },
		{ href: '/calendar', label: 'Calendar' }
	] as const;
</script>

<div class="navbar sticky top-0 z-50 bg-base-200 shadow-sm">
	<div class="navbar-start">
		<a href={resolve('/browse')} class="fancy-font btn text-xl font-bold btn-ghost"
			>🐱 Cat Calendar Creator</a
		>
	</div>
	<div class="navbar-center hidden md:flex">
		<ul class="menu menu-horizontal gap-1 px-1">
			{#each links as link (link.href)}
				<li>
					<a href={resolve(link.href)} class:active={page.url.pathname.startsWith(link.href)}
						>{link.label}</a
					>
				</li>
			{/each}
		</ul>
	</div>
	<div class="navbar-end md:hidden">
		<div class="dropdown dropdown-end">
			<div tabindex="0" role="button" class="btn btn-circle btn-ghost">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h7"
					/>
				</svg>
			</div>
			<ul class="dropdown-content menu z-10 mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow">
				{#each links as link (link.href)}
					<li>
						<a href={resolve(link.href)} class:active={page.url.pathname.startsWith(link.href)}
							>{link.label}</a
						>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>
