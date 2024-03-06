<script>
    import { page } from "$app/stores";
    import "../style.css";

    let pages = [
        { url: "./", title: "Home" },
        { url: "./project", title: "Projects" },
        { url: "https://github.com/KatieChen1001", title: "About" },
        { url: "./contact", title: "Contact" },
    ];
</script>

<nav>
    {#each pages as p}
        <a
            href={p.url}
            class:current={"." + $page.route.id === p.url}
            target={p.url.startsWith("http") ? "_blank" : null}>{p.title}</a
        >
    {/each}
</nav>

<!-- { JSON.stringify($page) } -->

<slot />

<style>
    nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom-width: 1px;
        border-bottom-style: solid;
        border-bottom-color: oklch(80% 3% 200);
    }

    nav a {
        flex: 1;
        text-decoration: none;
        color: inherit;
        text-align: center;
        padding: 0.5em;
    }

    a.current {
        border-bottom-width: 0.4em;
        border-bottom-style: solid;
        color: inherit;
        padding-bottom: 0.4em;
    }

    a:hover {
        color: var(--color-accent);
        border-bottom: 0.4em solid var(--color-accent);
    }
    .current {
        border-bottom: 0.4em solid var(--color-accent);
        color: var(--color-accent);
    }
</style>
