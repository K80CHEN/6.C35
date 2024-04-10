<script>
  export let info = {};
  export let hLevel = 2;
  // let p = info;
</script>

<article>
  <svelte:element this={"h" + hLevel}>{info.title}</svelte:element>
  <!-- <h2>{p.title}</h2>  -->
  <!-- we no longer need the above -->
  <img class="projects" src={info.image} alt="" />
  <p>{info.description}</p>
  <p>{info.year}</p>
  <p>
    <a href={info.url} target="_blank">View Project</a>
  </p>
</article>

<style>
  /* use css grid to create 3 columns */
  /* article {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 20px;
    margin-bottom: 20px;
  } */

  /* style the image */
  /* .projects {
    width: 100%;
    height: auto;
  } */

  article {
    display: grid;
    grid-template-rows: subgrid;
    grid-row: span 3;
  }

  img.projects {
    width: 100%;
    height: 100%;
  }
  /*  each <p> should be on a different row */
  p {
    grid-row: span 1;
  }
</style>
