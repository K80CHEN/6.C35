<script>
    import * as d3 from "d3";
    import { onMount } from "svelte";
    import Pie from "$lib/Pie.svelte";

    let data = [];
    let commits = [];

    let width = 1000,
        height = 600;
    let margin = { top: 10, right: 10, bottom: 30, left: 20 };
    let xScale, yScale;
    let yAxisGridlines;
    let cursor = { x: 0, y: 0 };
    let svg;
    let brushSelection;
    let selectedCommits;
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
        .domain(d3.extent(commits, (d) => d.datetime))
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

    $: hoveredCommit = commits[hoveredIndex] ?? {};

    // brushing
    $: brushSelection = undefined;
    function brushed(evt) {
        brushSelection = evt.selection;
    }
    function isCommitSelected(commit) {
        if (!brushSelection) {
            return false;
        } else {
            let [[x0, y0], [x1, y1]] = brushSelection;
            return (
                x0 <= xScale(commit.datetime) &&
                xScale(commit.datetime) <= x1 &&
                y0 <= yScale(commit.hourFrac) &&
                yScale(commit.hourFrac) <= y1
            );
        }
    }

    $: selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];
    $: hasSelection = brushSelection && selectedCommits.length > 0;

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
        console.log(pieData);
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

<svg viewBox="0 0 {width} {height}" bind:this={svg}>
    <g transform="translate(0, {usableArea.bottom})" bind:this={xAxis} />

    <g
        class="gridlines"
        transform="translate({usableArea.left}, 0)"
        bind:this={yAxisGridlines}
    />
    <g transform="translate({usableArea.left}, 0)" bind:this={yAxis} />

    <g class="dots">
        {#each commits as commit, index}
            <circle
                on:mouseenter={(evt) => {
                    hoveredIndex = index;
                    cursor = { x: evt.x, y: evt.y };
                }}
                on:mouseleave={() => (hoveredIndex = -1)}
                cx={xScale(commit.datetime)}
                cy={yScale(commit.hourFrac)}
                r={rScale(commit.totalLines)}
                fill="steelblue"
                class:selected={isCommitSelected(commit)}
            />
        {/each}
    </g>
</svg>
<p>{hasSelection ? selectedCommits.length : "No"} commits selected</p>

{#each languageBreakdown as [language, lines]}
    <div>
        <dt>{language}</dt>
        <dd>
            {lines} lines ({d3.format(".1~%")(lines / selectedLines.length)})
        </dd>
    </div>
{/each}

<Pie dataProp={pieData} />

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
    }
    .selected {
        fill: var(--color-accent);
    }
</style>
