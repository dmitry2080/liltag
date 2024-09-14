(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["LilTag"] = factory();
	else
		root["LilTag"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;
/*!***********************!*\
  !*** ./src/liltag.ts ***!
  \***********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
var Trigger;
(function (Trigger) {
    Trigger["PageLoad"] = "pageLoad";
    Trigger["DomReady"] = "domReady";
    Trigger["TimeDelay"] = "timeDelay";
    Trigger["ElementVisible"] = "elementVisible";
    Trigger["CustomEvent"] = "customEvent";
})(Trigger || (Trigger = {}));
var ContentLocation;
(function (ContentLocation) {
    ContentLocation["Head"] = "head";
    ContentLocation["BodyTop"] = "bodyTop";
    ContentLocation["BodyBottom"] = "bodyBottom";
})(ContentLocation || (ContentLocation = {}));
class LilTag {
    constructor(config) {
        this.config = config;
        this.cacheEnabled = false;
        this.cacheTTL = LilTag.CACHE_DEFAULT_TTL;
    }
    enableCache(ttl = LilTag.CACHE_DEFAULT_TTL) {
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
    init() {
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
        }
        else {
            this.processConfig(this.config);
        }
    }
    fetchAndCacheConfig(url) {
        fetch(url)
            .then(response => response.json())
            .then((config) => {
            if (this.cacheEnabled) {
                this.cacheConfig(url, config);
            }
            this.processConfig(config);
        })
            .catch(error => console.error("Error loading configuration:", error));
    }
    cacheConfig(url, config) {
        const cacheData = this.getCacheData();
        cacheData[url] = {
            config: config,
            timestamp: Date.now()
        };
        localStorage.setItem(LilTag.CACHE_KEY, JSON.stringify(cacheData));
    }
    getCachedConfig(url) {
        const cacheData = this.getCacheData();
        const cachedEntry = cacheData[url];
        if (!cachedEntry)
            return null;
        const ttlInMilliseconds = this.cacheTTL * 1000;
        if (Date.now() - cachedEntry.timestamp > ttlInMilliseconds) {
            delete cacheData[url];
            localStorage.setItem(LilTag.CACHE_KEY, JSON.stringify(cacheData));
            return null;
        }
        return cachedEntry.config;
    }
    getCacheData() {
        const cacheData = localStorage.getItem(LilTag.CACHE_KEY);
        return cacheData ? JSON.parse(cacheData) : {};
    }
    processConfig(config) {
        config.tags.forEach(tag => {
            switch (tag.trigger) {
                case Trigger.PageLoad:
                    if (document.readyState === "complete") {
                        // Page has already loaded, execute immediately
                        this.executeTag(tag);
                    }
                    else {
                        // Attach event listener for page load
                        window.addEventListener("load", () => this.executeTag(tag));
                    }
                    break;
                case Trigger.DomReady:
                    if (document.readyState === "interactive" || document.readyState === "complete") {
                        // DOM is already ready, execute immediately
                        this.executeTag(tag);
                    }
                    else {
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
                                    observer.disconnect(); // Stop observing after first trigger
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
    executeTag(tag) {
        this.injectContent(tag.content, tag.location, tag.id);
    }
    injectContent(content, location, tagId) {
        if (!content) {
            console.warn(`Tag with ID "${tagId}" has no content to inject.`);
            return;
        }
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content.trim();
        while (tempDiv.firstChild) {
            const node = tempDiv.firstChild;
            // Check if the node is a script element and create it programmatically
            if (node instanceof HTMLScriptElement) {
                const script = document.createElement("script");
                script.src = node.src;
                script.defer = node.defer;
                script.setAttribute("data-domain", node.getAttribute("data-domain") || "");
                script.setAttribute(LilTag.DATA_ATTRIBUTE, tagId); // Add tag ID attribute
                // Append the script to the specified location
                switch (location) {
                    case ContentLocation.Head:
                        document.head.appendChild(script);
                        break;
                    case ContentLocation.BodyTop:
                        document.body.insertBefore(script, document.body.firstChild);
                        break;
                    case ContentLocation.BodyBottom:
                        document.body.appendChild(script);
                        break;
                    default:
                        console.warn(`Unknown location "${location}" - defaulting to body bottom.`);
                        document.body.appendChild(script);
                }
            }
            else if (node instanceof HTMLElement) {
                // For other HTML elements, append them as is
                node.setAttribute(LilTag.DATA_ATTRIBUTE, tagId);
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
            tempDiv.removeChild(node);
        }
    }
}
LilTag.DATA_ATTRIBUTE = "data-tag-id";
LilTag.CACHE_KEY = "LILTAG_CACHE";
LilTag.CACHE_DEFAULT_TTL = 3600;
exports["default"] = LilTag;

})();

__webpack_exports__ = __webpack_exports__["default"];
/******/ 	return __webpack_exports__;
/******/ })()
;
});