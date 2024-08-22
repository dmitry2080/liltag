enum Trigger {
    PageLoad = "pageLoad",
    DomReady = "domReady",
    TimeDelay = "timeDelay",
    ElementVisible = "elementVisible",
    CustomEvent = "customEvent"
}

enum ScriptLocation {
    Head = "head",
    BodyTop = "bodyTop",
    BodyBottom = "bodyBottom"
}

enum LoadingType {
    Async = "async",
    Defer = "defer",
    Standard = "standard"
}

interface TagConfig {
    id: string;
    trigger: Trigger;
    script?: string;  // URL of the script to load
    code?: string;    // Inline JavaScript code to execute
    location: ScriptLocation;
    delay?: number;   // Used with "timeDelay" trigger
    selector?: string;  // Used with "elementVisible" trigger
    eventName?: string;  // Used with "customEvent" trigger
    loadingType?: LoadingType; // Script loading type
}

interface Config {
    tags: TagConfig[];
}

export default class LilTag {
    private static readonly DATA_ATTRIBUTE = "data-tag-id";

    constructor(private config: Config | string) {}

    public init(): void {
        if (this.config === "") {
            console.log("LilTag initialization skipped: empty string provided.");
            return;
        }

        if (typeof this.config === "string") {
            fetch(this.config)
                .then(response => response.json())
                .then((config: Config) => this.processConfig(config))
                .catch(error => console.error("Error loading configuration:", error));
        } else {
            this.processConfig(this.config);
        }
    }

    private processConfig(config: Config): void {
        config.tags.forEach(tag => {
            switch(tag.trigger) {
                case Trigger.PageLoad:
                    this.executeTag(tag);
                    break;
                case Trigger.DomReady:
                    document.addEventListener("DOMContentLoaded", () => this.executeTag(tag));
                    break;
                case Trigger.TimeDelay:
                    if (tag.delay !== undefined) {
                        setTimeout(() => this.executeTag(tag), tag.delay);
                    }
                    break;
                case Trigger.ElementVisible:
                    if (tag.selector) {
                        const observer = new IntersectionObserver(entries => {
                            entries.forEach(entry => {
                                if (entry.isIntersecting) {
                                    this.executeTag(tag);
                                    observer.disconnect();  // Stop observing after first trigger
                                }
                            });
                        });
                        document.querySelectorAll(tag.selector).forEach(element => observer.observe(element));
                    }
                    break;
                case Trigger.CustomEvent:
                    if (tag.eventName) {
                        document.addEventListener(tag.eventName, () => this.executeTag(tag));
                    }
                    break;
                default:
                    console.warn(`Unknown trigger type: ${tag.trigger}`);
            }
        });
    }

    private executeTag(tag: TagConfig): void {
        const loadingType = tag.loadingType || LoadingType.Async; // Default to "async" if not specified
        if (tag.script) {
            this.injectScript(tag.script, tag.location, tag.id, loadingType);
        } else if (tag.code) {
            this.executeCode(tag.code, tag.location, tag.id);
        } else {
            console.warn(`Tag with ID "${tag.id}" has no script or code to execute.`);
        }
    }

    private injectScript(url: string, location: ScriptLocation, tagId: string, loadingType: LoadingType = LoadingType.Async): void {
        const script = document.createElement("script");
        script.src = url;
        script.setAttribute(LilTag.DATA_ATTRIBUTE, tagId);

        switch(loadingType) {
            case LoadingType.Async:
                script.async = true;
                break;
            case LoadingType.Defer:
                script.defer = true;
                break;
            case LoadingType.Standard:
                // No need to set async or defer for standard loading
                break;
            default:
                console.warn(`Unknown loading type "${loadingType}" - defaulting to "async".`);
                script.async = true;
        }

        switch(location) {
            case ScriptLocation.Head:
                document.head.appendChild(script);
                break;
            case ScriptLocation.BodyTop:
                document.body.insertBefore(script, document.body.firstChild);
                break;
            case ScriptLocation.BodyBottom:
                document.body.appendChild(script);
                break;
            default:
                console.warn(`Unknown location "${location}" - defaulting to body bottom.`);
                document.body.appendChild(script);
        }
    }

    private executeCode(code: string, location: ScriptLocation, tagId: string): void {
        const script = document.createElement("script");
        script.textContent = code;
        script.setAttribute(LilTag.DATA_ATTRIBUTE, tagId);

        switch(location) {
            case ScriptLocation.Head:
                document.head.appendChild(script);
                break;
            case ScriptLocation.BodyTop:
                document.body.insertBefore(script, document.body.firstChild);
                break;
            case ScriptLocation.BodyBottom:
                document.body.appendChild(script);
                break;
            default:
                console.warn(`Unknown location "${location}" - defaulting to body bottom.`);
                document.body.appendChild(script);
        }
    }
}