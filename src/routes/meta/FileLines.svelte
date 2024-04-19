<script>
    import * as d3 from "d3";
    export let lines;
    import { scale } from "svelte/transition";
    import { flip as originalFlip } from "svelte/animate";

    let files = [];
    $: {
        files = d3
            .groups(lines, (d) => d.file)
            .map(([name, lines]) => {
                return {
                    name,
                    lines,
                };
            });
        files = d3.sort(files, (d) => -d.lines.length);
    }
    // let colors = d3.scaleOrdinal(d3.schemeTableau10);
    export let colors = d3.scaleOrdinal(d3.schemeTableau10);

    function getFlip() {
        return originalFlip;
    }
    $: flip = getFlip(files);
</script>

<dl class="files">
    {#each files as file (file.name)}
        <div animate:flip={{ duration: 3000 }}>
            <dt>
                <code>{file.name}</code>
            </dt>
            <!-- <dd>{file.lines.length} lines</dd> -->
            <dd>
                {#each file.lines as line (line.line)}
                    <div
                        class="line"
                        style="--color: {colors(line.type)}"
                        in:scale
                    ></div>
                {/each}
            </dd>
        </div>
    {/each}
</dl>

<style>
    dl {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 1em 2em;
        & > div {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: subgrid;
        }
    }

    .line {
        display: flex;
        width: 0.5em;
        aspect-ratio: 1;
        background: var(--color);
        /* background: steelblue; */
        border-radius: 50%;
        transition: 300ms background;
    }

    dd {
        grid-column: 2;
        display: flex;
        flex-wrap: wrap;
        align-items: start;
        padding-top: 0.6em;
        gap: 0.15em;
        margin-left: 0;
    }
</style>
