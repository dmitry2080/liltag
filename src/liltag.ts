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
    private static readonly CACHE_KEY = "LilTagConfigCache";
    private static readonly CACHE_DEFAULT_TTL = 3600;
    private cacheEnabled: boolean = false;
    private cacheTTL: number = LilTag.CACHE_DEFAULT_TTL;

    constructor(private config: Config | string) {}

    /**
     * Enable caching with a specific TTL (time-to-live) in seconds.
     * @param ttl - Time in seconds for which the cache is valid.
     */
    public enableCache(ttl: number = LilTag.CACHE_DEFAULT_TTL): void {
        this.cacheEnabled = true;
        this.cacheTTL = ttl;
    }

    public init(): void {
        if (this.config === "") {
            console.log("LilTag initialization skipped: empty string provided.");
            return;
        }

        if (typeof this.config === "string") {
            if (this.cacheEnabled) {
                const cachedConfig = this.getCachedConfig(this.config);
                if (cachedConfig) {
                    console.log("Using cached configuration.");
                    this.processConfig(cachedConfig);
                    return;
                }
            }
            this.fetchAndCacheConfig(this.config);
        } else {
            this.processConfig(this.config);
        }
    }

    private fetchAndCacheConfig(url: string): void {
        fetch(url)
            .then(response => response.json())
            .then((config: Config) => {
                if (this.cacheEnabled) {
                    this.cacheConfig(url, config);
                }
                this.processConfig(config);
            })
            .catch(error => console.error("Error loading configuration:", error));
    }

    private cacheConfig(url: string, config: Config): void {
        const cacheData = this.getCacheData();
        cacheData[url] = {
            config: config,
            timestamp: Date.now()
        };
        localStorage.setItem(LilTag.CACHE_KEY, JSON.stringify(cacheData));
    }

    private getCachedConfig(url: string): Config | null {
        const cacheData = this.getCacheData();
        const cachedEntry = cacheData[url];
        if (!cachedEntry) return null;

        // Calculate TTL in milliseconds
        const ttlInMilliseconds = this.cacheTTL * 1000;

        // Check if the cache has expired
        if (Date.now() - cachedEntry.timestamp > ttlInMilliseconds) {
            delete cacheData[url];
            localStorage.setItem(LilTag.CACHE_KEY, JSON.stringify(cacheData));
            return null;
        }

        return cachedEntry.config;
    }

    private getCacheData(): { [key: string]: { config: Config, timestamp: number } } {
        const cacheData = localStorage.getItem(LilTag.CACHE_KEY);
        return cacheData ? JSON.parse(cacheData) : {};
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
        const loadingType = tag.loadingType || LoadingType.Async;
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