<script>
    import projects from "$lib/projects.json";
    import Project from "$lib/Project.svelte";
    import Pie from "$lib/Pie.svelte";
    import * as d3 from "d3";

    // let filteredProjects = projects.filter((p) => p.year > 2018);
    let filteredProjects;
    let query = "";
    $: filteredProjects = projects.filter(project => {
        let values = Object.values(project).join("\n").toLowerCase();
        // console.log(values);
        return values.includes(query.toLowerCase());
    });

    let pieData;

    $: {
        pieData = {};
        console.log("filteredProjects", filteredProjects);
        let rolledData = d3.rollups(
            filteredProjects,
            (v) => v.length,
            (d) => d.year,
        );
        pieData = rolledData.map(([year, count]) => {
            return { value: count, label: year };
        });
    }

    // let rolledData = d3.rollups(
    //     projects,
    //     (v) => v.length,
    //     (d) => d.year,
    // );
    // pieData = rolledData.map(([year, count]) => {
    //     return { value: count, label: year };
    // });
</script>

<!-- <pre>{ JSON.stringify(projects, null, "\t") }</pre>  -->
<svelte:head>
    <title>Project</title>
</svelte:head>

<h1>{projects.length} projects</h1>
<input
    type="search"
    bind:value={query}
    aria-label="Search projects"
    placeholder="🔍 Search projects…"
/>

<Pie dataProp={pieData} />

<div class="projects">
    {#each filteredProjects as p}
        <Project info={p} />
    {/each}
</div>
