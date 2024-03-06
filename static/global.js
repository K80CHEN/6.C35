// Step 1
console.log("IT’S ALIVE!");

function $$ (selector, context = document) {
    let myArray = Array.from(context.querySelectorAll(selector));
    console.log(myArray);
    return myArray;
}


// function getBaseUrl() {
//     // Check if running on GitHub Pages and adjust the base URL accordingly
//     const host = window.location.hostname;
//     const path = window.location.pathname.split('/');
//     console.log(window.location.pathname);
//     // If the host contains 'github.io' and the path length is greater than 1, it's likely a project site
//     if (host.includes('github.io') && path.length > 1) {
//         // Construct the base URL using the first part of the path (repository name)
//         return `/${path[1]}/`; // Adjust this index if necessary based on URL structure
//     } else {
//         // Use the root for local development or other hosting environments
//         return '/';
//     }
// }


// const BASE_URL = getBaseUrl(); // Dynamically set the BASE_URL

// let pages = {
// 	"./": "Home",
// 	"project": "Projects",
//     "contact": "Contact",
//     "https://katiechen1001.github.io/6.C85_labs_playtest/": "Github"
// };

// let nav = document.createElement("nav");
// document.body.prepend(nav);

// const ARE_WE_HOME = document.documentElement.classList.contains("home");

// step 2 
// for (let url in pages) {
// 	let title = pages[url];
// 	// TODO create link and add it to nav
//     // Create link and add it to nav
//     console.log(ARE_WE_HOME);
//     if (!ARE_WE_HOME && !url.startsWith("http")) {
//         url = "../" + url;
//     }
//     let a = document.createElement("a");
//         a.href = url;
//         a.textContent = title;
//         nav.append(a);
//         // step 3.2 
//         a.classList.toggle("current", a.host === location.host && a.pathname === location.pathname);
//         // set a target attribute to open new window if the link is external
//         a.toggleAttribute("target_blank", a.host !== location.host);
// }


for (let url in pages) {
    let title = pages[url];
    let fullPath = url; // Initialize fullPath with url

    // Check if the link is not an external link
    // Check if the link is an external link by looking for 'http://' or 'https://'
    if (url.startsWith('http://') || url.startsWith('https://')) {
        // If it's an external link, use the URL as is
        fullPath = url;
    } else {
        // For internal links, prefix with the base URL
        fullPath = `${BASE_URL}${url}`;
    }

    let a = document.createElement("a");
    a.href = fullPath; // Use the full path as the href
    a.textContent = title;
    nav.append(a);

    // Toggle "current" class based on the active page
    a.classList.toggle("current", a.host === location.host && a.pathname === location.pathname);

    // Set a target attribute to open in a new window if the link is external
    if (a.host !== location.host) {
        a.setAttribute("target", "_blank");
    }
}





// step 4
// step 4.1 
document.body.insertAdjacentHTML("afterbegin", `
    <label class="color-scheme">Choose a theme:
        <select>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="light dark">Automatic</option>
        </select>
    </label>`
);

// step 4.3 - CSS
// step 4.4 - JS
const select = document.querySelector('select');

// select.addEventListener("input", function (event) {
// 	console.log("color scheme changed to", event.target.value);
//     document.documentElement.style.setProperty("color-scheme", event.target.value);
// });

// step 4.5 saving user preference
const storedColorScheme = localStorage.getItem('colorScheme');

const setColorScheme = (colorScheme) => {
    console.log('color scheme changed to', colorScheme);
    document.documentElement.style.setProperty('color-scheme', colorScheme);
    localStorage.setItem('colorScheme', colorScheme);
  };

if (storedColorScheme) {
setColorScheme(storedColorScheme);
select.value = storedColorScheme;
}


select.addEventListener('input', function (event) {
  setColorScheme(event.target.value);
});

// 
const form = document.querySelector('form');
form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  let url = 'mailto:example@example.com?';
  for (let [name, value] of data) {
    url = url + `${name}=${encodeURIComponent(value)}&`;
    console.log(name, value);
  }

  location.href = url; // it opens the email client with the email address and subject line filled in
  // location is a property of the global object, it is a reference to the current URL
});




// making sure things work when published
// Function to determine the base URL based on the current location
