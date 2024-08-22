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
var ScriptLocation;
(function (ScriptLocation) {
    ScriptLocation["Head"] = "head";
    ScriptLocation["BodyTop"] = "bodyTop";
    ScriptLocation["BodyBottom"] = "bodyBottom";
})(ScriptLocation || (ScriptLocation = {}));
var LoadingType;
(function (LoadingType) {
    LoadingType["Async"] = "async";
    LoadingType["Defer"] = "defer";
    LoadingType["Standard"] = "standard";
})(LoadingType || (LoadingType = {}));
class LilTag {
    constructor(config) {
        this.config = config;
        this.cacheEnabled = false;
        this.cacheTTL = LilTag.CACHE_DEFAULT_TTL;
    }
    /**
     * Enable caching with a specific TTL (time-to-live) in seconds.
     * @param ttl - Time in seconds for which the cache is valid.
     */
    enableCache(ttl = LilTag.CACHE_DEFAULT_TTL) {
        if (ttl <= 0) {
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
    getCacheData() {
        const cacheData = localStorage.getItem(LilTag.CACHE_KEY);
        return cacheData ? JSON.parse(cacheData) : {};
    }
    processConfig(config) {
        config.tags.forEach(tag => {
            switch (tag.trigger) {
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
        const loadingType = tag.loadingType || LoadingType.Async;
        if (tag.script) {
            this.injectScript(tag.script, tag.location, tag.id, loadingType);
        }
        else if (tag.code) {
            this.executeCode(tag.code, tag.location, tag.id);
        }
        else {
            console.warn(`Tag with ID "${tag.id}" has no script or code to execute.`);
        }
    }
    injectScript(url, location, tagId, loadingType = LoadingType.Async) {
        const script = document.createElement("script");
        script.src = url;
        script.setAttribute(LilTag.DATA_ATTRIBUTE, tagId);
        switch (loadingType) {
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
        switch (location) {
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
    executeCode(code, location, tagId) {
        const script = document.createElement("script");
        script.textContent = code;
        script.setAttribute(LilTag.DATA_ATTRIBUTE, tagId);
        switch (location) {
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
LilTag.DATA_ATTRIBUTE = "data-tag-id";
LilTag.CACHE_KEY = "LilTagConfigCache";
LilTag.CACHE_DEFAULT_TTL = 3600;
exports["default"] = LilTag;

})();

__webpack_exports__ = __webpack_exports__["default"];
/******/ 	return __webpack_exports__;
/******/ })()
;
});