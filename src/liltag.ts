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
    private static readonly CACHE_KEY = "LILTAG_CACHE";
    private static readonly CACHE_DEFAULT_TTL = 3600;
    private cacheEnabled: boolean = false;
    private cacheTTL: number = LilTag.CACHE_DEFAULT_TTL;

    constructor(private config: Config | string) {}

    public enableCache(ttl: number = LilTag.CACHE_DEFAULT_TTL): void {
        if (ttl <= 0) {
            console.warn(`LilTag cache TTL must be a positive number (${ttl} provided). Disabling cache.`);
            this.cacheEnabled = false;
            return;
        }

        this.cacheEnabled = true;
        this.cacheTTL = ttl;
    }

    public init(): void {
        if (this.config === "") {
            console.warn("LilTag initialization skipped: empty string provided.");
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
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok (${response.statusText})`);
                }
                return response.json();
            })
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
        if (cacheData) {
            try {
                return JSON.parse(cacheData);
            } catch (error) {
                console.error("Error parsing cache data:", error);
                localStorage.removeItem(LilTag.CACHE_KEY);
                return {};
            }
        }
        return {};
    }

    private processConfig(config: Config): void {
        config.tags.forEach(tag => {
            switch (tag.trigger) {
                case Trigger.PageLoad:
                    if (document.readyState === "complete") {
                        this.executeTag(tag);
                    } else {
                        window.addEventListener("load", () => this.executeTag(tag));
                    }
                    break;
                case Trigger.DomReady:
                    if (document.readyState === "interactive" || document.readyState === "complete") {
                        this.executeTag(tag);
                    } else {
                        document.addEventListener("DOMContentLoaded", () => this.executeTag(tag));
                    }
                    break;
                case Trigger.TimeDelay:
                    if (tag.delay !== undefined) {
                        const delay = Number(tag.delay);
                        if (isNaN(delay) || delay < 0) {
                            console.warn(`Invalid delay value for tag "${tag.id}". Skipping execution.`);
                        } else {
                            setTimeout(() => this.executeTag(tag), delay);
                        }
                    } else {
                        console.warn(`No delay specified for TimeDelay trigger in tag "${tag.id}". Skipping execution.`);
                    }
                    break;
                case Trigger.ElementVisible:
                    if (tag.selector) {
                        const observer = new IntersectionObserver((entries, observer) => {
                            entries.forEach(entry => {
                                if (entry.isIntersecting) {
                                    this.executeTag(tag);
                                    observer.disconnect();
                                }
                            });
                        });
                        document.querySelectorAll(tag.selector).forEach(element => observer.observe(element));
                    } else {
                        console.warn(`No selector specified for ElementVisible trigger in tag "${tag.id}".`);
                    }
                    break;
                case Trigger.CustomEvent:
                    if (tag.eventName) {
                        const listener = () => {
                            this.executeTag(tag);
                            document.removeEventListener(tag.eventName!, listener);
                        };
                        document.addEventListener(tag.eventName, listener);
                    } else {
                        console.warn(`No eventName specified for CustomEvent trigger in tag "${tag.id}".`);
                    }
                    break;
                default:
                    console.warn(`Unknown trigger type: ${tag.trigger}`);
            }
        });
    }

    private executeTag(tag: TagConfig): void {
        try {
            this.injectContent(tag.content, tag.location, tag.id);
        } catch (error) {
            console.error(`Error executing tag "${tag.id}":`, error);
        }
    }

    private injectContent(content: string, location: ContentLocation, tagId: string): void {
        if (!content) {
            console.warn(`Tag with ID "${tagId}" has no content to inject.`);
            return;
        }

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content.trim();

        const fragment = document.createDocumentFragment();

        tempDiv.childNodes.forEach(node => {
            const clonedNode = node.cloneNode(true);

            if (clonedNode.nodeType === Node.ELEMENT_NODE) {
                const element = clonedNode as HTMLElement;
                element.setAttribute(LilTag.DATA_ATTRIBUTE, tagId);

                if (element.tagName.toLowerCase() === 'script') {
                    const script = document.createElement('script');

                    // Copy attributes
                    Array.from(element.attributes).forEach(attr => {
                        script.setAttribute(attr.name, attr.value);
                    });

                    // Copy inline script content
                    script.text = element.textContent || '';

                    fragment.appendChild(script);
                } else {
                    fragment.appendChild(element);
                }
            } else {
                fragment.appendChild(clonedNode);
            }
        });

        switch (location) {
            case ContentLocation.Head:
                document.head.appendChild(fragment);
                break;
            case ContentLocation.BodyTop:
                document.body.insertBefore(fragment, document.body.firstChild);
                break;
            case ContentLocation.BodyBottom:
                document.body.appendChild(fragment);
                break;
            default:
                console.warn(`Unknown location "${location}" - defaulting to body bottom.`);
                document.body.appendChild(fragment);
        }
    }
}