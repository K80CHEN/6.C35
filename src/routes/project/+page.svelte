
<script>
    import projects from '$lib/projects.json';
    import Project from "$lib/Project.svelte";
</script>
<!-- <pre>{ JSON.stringify(projects, null, "\t") }</pre>  -->
<svelte:head>
    <title>Project</title>
</svelte:head>

<h1>{projects.length} projects</h1>
    <div class="projects">
        {#each projects as p}
            <Project info={p} />
        {/each}
    </div>
