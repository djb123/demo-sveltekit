<script>
	import welcomepic from '$lib/assets/CatSplash.png';
	import { resolve } from '$app/paths';
</script>

<h1 class="text-center text-3xl">Welcome to the Cat Calendar Creator!</h1>
<figure class="my-3 text-center">
	<img src={welcomepic} alt="cat holding a calendar" class="mx-auto max-h-[70vh]" />
</figure>
<p class="text-center">
	<a href={resolve('/browse')} class="underline underline-offset-4">Browse</a> cat pictures or
	<a href={resolve('/upload')} class="underline underline-offset-4">upload</a> your own and create a calendar
	with them.
</p>
