<svelte:head>
	<title>About</title>
</svelte:head>
<script>
	let FEE = 0;
</script>
<div class="content">
	<h1>About this app</h1>


	<!-- TODO lose the @next! -->
	<pre>npm init svelte@next</pre>
<input type="range" bind:value={FEE} min="0" max="10000" step="1"> {FEE/10000}% <br />
Value: {(FEE/1000000).toFixed(20)}%
</div>

<style>
	.content {
		width: 100%;
		max-width: var(--column-width);
		margin: var(--column-margin-top) auto 0 auto;
	}
</style>
