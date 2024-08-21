interface TagConfig {
    id: string;
    trigger: "pageLoad" | "domReady" | "timeDelay" | "elementVisible" | "customEvent";
    script?: string;  // URL of the script to load
    code?: string;    // Inline JavaScript code to execute
    location: "head" | "bodyTop" | "bodyBottom";
    delay?: number;   // Used with "timeDelay" trigger
    selector?: string;  // Used with "elementVisible" trigger
    eventName?: string;  // Used with "customEvent" trigger
    loadingType?: "async" | "defer" | "standard"; // Script loading type
}

interface Config {
    tags: TagConfig[];
}

export function lilTagInit(configOrUrl: Config | string) {
    // Check if the input is an empty string, and skip initialization if true
    if (configOrUrl === "") {
        console.log("LilTag initialization skipped: empty string provided.");
        return;
    }

    // Check if the input is a string (URL) or an object (config)
    if (typeof configOrUrl === "string") {
        // Treat as URL, load the configuration file
        fetch(configOrUrl)
            .then(response => response.json())
            .then((config: Config) => {
                processConfig(config);
            })
            .catch(error => console.error("Error loading configuration:", error));
    } else {
        // Treat as a configuration object
        processConfig(configOrUrl);
    }
}

function processConfig(config: Config): void {
    config.tags.forEach(tag => {
        switch(tag.trigger) {
            case "pageLoad":
                executeTag(tag);
                break;
            case "domReady":
                document.addEventListener("DOMContentLoaded", () => executeTag(tag));
                break;
            case "timeDelay":
                if (tag.delay !== undefined) {
                    setTimeout(() => executeTag(tag), tag.delay);
                }
                break;
            case "elementVisible":
                if (tag.selector) {
                    const observer = new IntersectionObserver(entries => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                executeTag(tag);
                                observer.disconnect();  // Stop observing after first trigger
                            }
                        });
                    });
                    document.querySelectorAll(tag.selector).forEach(element => observer.observe(element));
                }
                break;
            case "customEvent":
                if (tag.eventName) {
                    document.addEventListener(tag.eventName, () => executeTag(tag));
                }
                break;
            default:
                console.warn(`Unknown trigger type: ${tag.trigger}`);
        }
    });
}

function executeTag(tag: TagConfig): void {
    const loadingType = tag.loadingType || "async"; // Default to "async" if not specified
    if (tag.script) {
        injectScript(tag.script, tag.location, tag.id, loadingType);
    } else if (tag.code) {
        executeCode(tag.code, tag.location, tag.id);
    } else {
        console.warn(`Tag with ID "${tag.id}" has no script or code to execute.`);
    }
}

// Function to inject a script dynamically based on the specified location
function injectScript(url: string, location: "head" | "bodyTop" | "bodyBottom", tagId: string, loadingType: "async" | "defer" | "standard" = "async"): void {
    const script = document.createElement("script");
    script.src = url;
    script.setAttribute("data-tag-id", tagId); // Add the data-tag-id attribute

    switch(loadingType) {
        case "async":
            script.async = true;
            break;
        case "defer":
            script.defer = true;
            break;
        case "standard":
            // No need to set async or defer for standard loading
            break;
        default:
            console.warn(`Unknown loading type "${loadingType}" - defaulting to "async".`);
            script.async = true;
    }

    switch(location) {
        case "head":
            document.head.appendChild(script);
            break;
        case "bodyTop":
            document.body.insertBefore(script, document.body.firstChild);
            break;
        case "bodyBottom":
            document.body.appendChild(script);
            break;
        default:
            console.warn(`Unknown location "${location}" - defaulting to body bottom.`);
            document.body.appendChild(script);
    }
}

// Function to execute inline JavaScript code based on the specified location
function executeCode(code: string, location: "head" | "bodyTop" | "bodyBottom", tagId: string): void {
    const script = document.createElement("script");
    script.textContent = code;
    script.setAttribute("data-tag-id", tagId); // Add the data-tag-id attribute

    switch(location) {
        case "head":
            document.head.appendChild(script);
            break;
        case "bodyTop":
            document.body.insertBefore(script, document.body.firstChild);
            break;
        case "bodyBottom":
            document.body.appendChild(script);
            break;
        default:
            console.warn(`Unknown location "${location}" - defaulting to body bottom.`);
            document.body.appendChild(script);
    }
}