enum Trigger {
    PageLoad = "pageLoad",
    DomReady = "domReady",
    TimeDelay = "timeDelay",
    ElementVisible = "elementVisible",
    CustomEvent = "customEvent"
}

enum ContentLocation {
    Head = "head",
    BodyTop = "bodyTop",
    BodyBottom = "bodyBottom"
}

interface TagConfig {
    id: string;
    trigger: Trigger;
    content: string;  // Full HTML content, including <script>, <noscript>, etc.
    location: ContentLocation;
    delay?: number;   // Used with "timeDelay" trigger
    selector?: string;  // Used with "elementVisible" trigger
    eventName?: string;  // Used with "customEvent" trigger
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

    public enableCache(ttl: number = LilTag.CACHE_DEFAULT_TTL): void {
        if (ttl === 0) {
            this.cacheEnabled = false;
            return;
        }

        if (ttl < 0) {
            console.log(`LilTag cache TTL must be a positive number (${ttl} provided). Disabling cache.`);
            this.cacheEnabled = false;
            return;
        }

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

        const ttlInMilliseconds = this.cacheTTL * 1000;

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
                    if (document.readyState === "complete") {
                        // Page has already loaded, execute immediately
                        this.executeTag(tag);
                    } else {
                        // Attach event listener for page load
                        window.addEventListener("load", () => this.executeTag(tag));
                    }
                    break;
                case Trigger.DomReady:
                    if (document.readyState === "interactive" || document.readyState === "complete") {
                        // DOM is already ready, execute immediately
                        this.executeTag(tag);
                    } else {
                        // Attach event listener for DOMContentLoaded
                        document.addEventListener("DOMContentLoaded", () => this.executeTag(tag));
                    }
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
        this.injectContent(tag.content, tag.location, tag.id);
    }

    private injectContent(content: string | undefined, location: ContentLocation, tagId: string): void {
        if (!content) {
            console.warn(`Tag with ID "${tagId}" has no content to inject.`);
            return;
        }

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content.trim();

        while (tempDiv.firstChild) {
            const node = tempDiv.firstChild;

            if (node instanceof HTMLElement) {
                node.setAttribute(LilTag.DATA_ATTRIBUTE, tagId);

                switch (location) {
                    case ContentLocation.Head:
                        if (node.nodeName === "SCRIPT" || node.nodeName === "NOSCRIPT") {
                            document.head.appendChild(node);
                        } else {
                            console.warn("Injecting non-script content into <head> is not recommended.");
                            document.body.appendChild(node);
                        }
                        break;
                    case ContentLocation.BodyTop:
                        document.body.insertBefore(node, document.body.firstChild);
                        break;
                    case ContentLocation.BodyBottom:
                        document.body.appendChild(node);
                        break;
                    default:
                        console.warn(`Unknown location "${location}" - defaulting to body bottom.`);
                        document.body.appendChild(node);
                }
            } else {
                // If the node is not an HTMLElement, just append it to the correct location
                switch (location) {
                    case ContentLocation.Head:
                        document.head.appendChild(node);
                        break;
                    case ContentLocation.BodyTop:
                        document.body.insertBefore(node, document.body.firstChild);
                        break;
                    case ContentLocation.BodyBottom:
                        document.body.appendChild(node);
                        break;
                    default:
                        document.body.appendChild(node);
                }
            }
        }
    }
}