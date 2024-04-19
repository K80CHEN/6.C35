<script>
    import * as d3 from "d3";
    import { onMount } from "svelte";
    import Pie from "$lib/Pie.svelte";
    import FileLines from "./FileLines.svelte";
    import Scrolly from "svelte-scrolly";

    let data = [];
    let commits = [];

    let width = 1000,
        height = 600;
    let margin = { top: 10, right: 10, bottom: 30, left: 20 };
    let xScale, yScale;
    let yAxisGridlines;
    let cursor = { x: 0, y: 0 };
    let svg;
    // let brushSelection;
    let selectedCommits = [];
    let hasSelection;
    let selectedLines;
    let languageBreakdown;

    let pieData;

    let usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
    };
    usableArea.width = usableArea.right - usableArea.left;
    usableArea.height = usableArea.bottom - usableArea.top;

    let xAxis, yAxis;
    let hoveredIndex = -1;

    // lab 9 1.1
    let commitProgress = 100;
    //lab 9 5.1
    let raceProgress = 100;
    // map commit.datetime values to a range from 0 to 100
    let timeScale;
    $: timeScale = d3
        .scaleTime()
        .domain(d3.extent(commits.map((d) => d.datetime)))
        .range([0, 100]);
    $: commitMaxTime = timeScale.invert(commitProgress);

    // lab 9 1.2
    let filteredCommits;
    // filter commits by comparing commit.datetime and commitMaxTime
    $: filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
    let filteredLines;
    // filterLines filter the data by comparing the commit datetime with the commitMaxTime
    $: filteredLines = data.filter((d) => d.datetime <= commitMaxTime);

    // lab 9 2.6
    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    // optional lab 7 3.5
    function dotInteraction(index, evt) {
        if (evt.type === "mouseenter" || evt.type === "focus") {
            // dot hovered
            hoveredIndex = index;
            cursor = { x: evt.x, y: evt.y };
        } else if (evt.type === "mouseleave" || evt.type === "blur") {
            // dot unhovered
            hoveredIndex = -1;
        } else if (
            evt.type === "click" ||
            (evt.key === "Enter" && evt.type === "keyup")
        ) {
            // overwrite selectedCommiteds with the current commit
            selectedCommits = [commits[index]];
        }
    }
    onMount(async () => {
        data = await d3.csv("loc.csv", (row) => ({
            ...row,
            line: Number(row.line),
            depth: Number(row.depth),
            length: Number(row.length),
            date: new Date(row.date + "T00:00" + row.timezone),
            datetime: new Date(row.datetime),
        }));
        commits = d3.sort(commits, (d) => -d.totalLines);
    });

    $: commits = d3
        .groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];
            let ret = {
                id: commit,
                // Replace with your own username and repo
                url:
                    "https://github.com/gracefh/IDVS-portfolio-svelte/commit/" +
                    commit,
                author: first.author,
                date: first.date,
                time: first.time,
                timezone: first.timezone,
                datetime: first.datetime,
                totalLines: lines.length,
                hourFrac:
                    first.datetime.getHours() +
                    first.datetime.getMinutes() / 60,
            };

            // Like ret.lines = lines
            // but non-enumerable so it doesn’t show up in JSON.stringify
            Object.defineProperty(ret, "lines", {
                value: lines,
                configurable: true,
                writable: true,
                enumerable: false,
            });

            return ret;
        });

    // moving xScale and yScale here so that data is available when they are created
    $: xScale = d3
        .scaleTime()
        .domain(d3.extent(filteredCommits, (d) => d.datetime)) // lab 9 1.2
        .range([usableArea.left, usableArea.right])
        .nice();

    $: yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top]);

    $: {
        d3.select(xAxis).call(d3.axisBottom(xScale));
        d3.select(yAxis).call(d3.axisLeft(yScale));
        d3.select(yAxis).call(
            d3
                .axisLeft(yScale)
                .tickFormat((d) => String(d % 24).padStart(2, "0") + ":00"),
        );
    }

    $: d3.select(yAxisGridlines).call(
        d3.axisLeft(yScale).tickSize(-usableArea.width).tickFormat(""),
    );

    $: rScale = d3
        .scaleSqrt()
        .domain(d3.extent(commits.map((d) => d.totalLines)))
        .range([5, 20]);

    $: hoveredCommit = filteredCommits[hoveredIndex] ?? {};

    // brushing
    // $: brushSelection = undefined;

    function brushed(evt) {
        // brushSelection = evt.selection;
        let brushSelection = evt.selection;
        selectedCommits = !brushSelection
            ? []
            : filteredCommits.filter((commit) => {
                  // lab 9 1.2
                  let min = {
                      x: brushSelection[0][0],
                      y: brushSelection[0][1],
                  };
                  let max = {
                      x: brushSelection[1][0],
                      y: brushSelection[1][1],
                  };
                  let x = xScale(commit.date);
                  let y = yScale(commit.hourFrac);

                  return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
              });
    }
    // function isCommitSelected(commit) {
    //     if (!brushSelection) {
    //         return false;
    //     } else {
    //         let [[x0, y0], [x1, y1]] = brushSelection;
    //         return (
    //             x0 <= xScale(commit.datetime) &&
    //             xScale(commit.datetime) <= x1 &&
    //             y0 <= yScale(commit.hourFrac) &&
    //             yScale(commit.hourFrac) <= y1
    //         );
    //     }
    // }
    function isCommitSelected(commit) {
        return selectedCommits.includes(commit);
    }

    // $: selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];
    // $: hasSelection = brushSelection && selectedCommits.length > 0;
    $: hasSelection = selectedCommits.length > 0; // update in lab 9

    $: selectedLines = (hasSelection ? selectedCommits : commits).flatMap(
        (d) => d.lines,
    );

    $: languageBreakdown = d3.rollup(
        selectedLines,
        (d) => d.length,
        (d) => d.type,
    );

    $: {
        pieData = Array.from(languageBreakdown).map(([language, lines]) => ({
            label: language,
            value: lines,
        }));
    }

    $: {
        d3.select(svg).call(d3.brush());
        d3.select(svg).selectAll(".dots, .overlay ~ *").raise();
        d3.select(svg).call(d3.brush().on("start brush end", brushed));
    }

    $: fileLengths = d3.rollups(
        data,
        (v) => d3.max(v, (v) => v.line),
        (d) => d.file,
    );
    $: averageFileLength = d3.mean(fileLengths, (d) => d[1]);
</script>

<dl
    id="commit-tooltip"
    class="info tooltip"
    hidden={hoveredIndex === -1}
    style="top: {cursor.y}px; left: {cursor.x}px"
>
    <dt>Commit</dt>
    <dd><a href={hoveredCommit.url} target="_blank">{hoveredCommit.id}</a></dd>

    <dt>Date</dt>
    <dd>{hoveredCommit.datetime?.toLocaleString("en", { date: "full" })}</dd>

    <!-- Add: Time, author, lines edited -->
</dl>

<!-- lab 9 step 1.1  -->
<!-- Create a new <label> element with a slider input and a <time> element that will display the date and time corresponding to the slider value.
 -->
<!-- <label>
    <input
        type="range"
        min="0"
        max="100"
        step="1"
        bind:value={commitProgress}
    />
    <time
        >{commitMaxTime.toLocaleString("en", {
            date: "full",
            timeStyle: "short",
            dateStyle: "long",
        })}</time
    >
</label> -->

<Scrolly bind:progress={commitProgress}>
    <!-- story here -->
    {#each commits as commit, index}
        <p>
            On {commit.datetime.toLocaleString("en", {
                dateStyle: "full",
                timeStyle: "short",
            })}, I made
            <a href={commit.url} target="_blank"
                >{index > 0
                    ? "another glorious commit"
                    : "my first commit, and it was glorious"}</a
            >. I edited {commit.totalLines} lines across {d3.rollups(
                commit.lines,
                (D) => D.length,
                (d) => d.file,
            ).length} files. Then I looked over all I had made, and I saw that it
            was very good.
        </p>
    {/each}
    <svelte:fragment slot="viz">
        <!-- Visualizations here -->
        <svg viewBox="0 0 {width} {height}" bind:this={svg}>
            <g
                transform="translate(0, {usableArea.bottom})"
                bind:this={xAxis}
            />

            <g
                class="gridlines"
                transform="translate({usableArea.left}, 0)"
                bind:this={yAxisGridlines}
            />
            <g transform="translate({usableArea.left}, 0)" bind:this={yAxis} />

            <g class="dots">
                <!-- lab 9 1.2 -->
                {#each filteredCommits as commit, index (commit.id)}
                    <circle
                        on:mouseenter={(evt) => dotInteraction(index, evt)}
                        on:mouseleave={(evt) => dotInteraction(index, evt)}
                        on:click={(evt) => dotInteraction(index, evt)}
                        cx={xScale(commit.datetime)}
                        cy={yScale(commit.hourFrac)}
                        r={rScale(commit.totalLines)}
                        fill="steelblue"
                        class:selected={isCommitSelected(commit)}
                    />
                {/each}
            </g>
        </svg>
        <Pie data={pieData} {colors} />
    </svelte:fragment>
</Scrolly>

<Scrolly bind:progress={raceProgress} --scrolly-layout="viz-first">
    <svelte:fragment slot="viz">
        <FileLines lines={filteredLines} {colors} />
    </svelte:fragment>

    {#each commits as commit, index}
        <p>
            On {commit.datetime.toLocaleString("en", {
                dateStyle: "full",
                timeStyle: "short",
            })}, I made
            <a href={commit.url} target="_blank"
                >{index > 0
                    ? "another glorious commit"
                    : "my first commit, and it was glorious"}</a
            >. I edited {commit.totalLines} lines across {d3.rollups(
                commit.lines,
                (D) => D.length,
                (d) => d.file,
            ).length} files. Then I looked over all I had made, and I saw that it
            was very good.
        </p>
    {/each}
</Scrolly>

<p>{hasSelection ? selectedCommits.length : "No"} commits selected</p>

{#each languageBreakdown as [language, lines]}
    <div>
        <dt>{language}</dt>
        <dd>
            {lines} lines ({d3.format(".1~%")(lines / selectedLines.length)})
        </dd>
    </div>
{/each}

<dl class="stats">
    <dt>Total <abbr title="Lines of code">LOC</abbr></dt>
    <dd>{data.length}</dd>
    <dt>Number of Files</dt>
    <dd>
        {d3.rollup(
            data,
            (v) => v.length,
            (d) => d.file,
        ).size}
    </dd>
    <dt>Max File Length</dt>
    <dd>{d3.max(data, (d) => d.length)}</dd>
    <dt>Longest File</dt>
    <dd>{d3.max(data, (d) => d.file)}</dd>
    <dt>Avg File Lengths in lines (rounded to integer)</dt>
    <dd>{Math.round(d3.mean(data, (d) => d.length))}</dd>
    <dd>{averageFileLength}</dd>
    <dt>Avg Line Length in Characters</dt>
    <dd>{Math.round(d3.mean(data, (d) => d.line))}</dd>
    <dt>Longest Line Length</dt>
    <dd>{d3.max(data, (d) => d.line)}</dd>
    <dt>Max depth</dt>
    <dd>{d3.max(data, (d) => d.depth)}</dd>
    <dt>time of day that most work is done</dt>
    <dd>{Math.round(d3.max(commits, (d) => d.hourFrac))}</dd>
</dl>

<style>
    svg {
        overflow: visible;
    }
    .gridlines {
        stroke-opacity: 0.2;
    }
    dl.info {
        position: fixed;
        top: 1em;
        left: 1em;
        border-radius: 1em;

        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 1em;

        width: 100px;
        padding: 1em;

        transition-duration: 500ms;
        transition-property: opacity, visibility;

        &[hidden]:not(:hover, :focus-within) {
            opacity: 0;
            visibility: hidden;
        }
    }
    .info dt {
        font-weight: 500;
    }
    circle {
        &:hover {
            transform: scale(1.5);
            transform-origin: center;
            transform-box: fill-box;
        }
        @starting-style {
            transition:
                all 200ms,
                r calc(var(--r) * 100ms);
        }
    }
    .selected {
        fill: var(--color-accent);
    }
    :global(body) {
        max-width: min(120ch, 80vw);
    }
</style>
