"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lilTagInit = lilTagInit;
var Trigger;
(function (Trigger) {
    Trigger["PageLoad"] = "pageLoad";
    Trigger["DomReady"] = "domReady";
    Trigger["TimeDelay"] = "timeDelay";
    Trigger["ElementVisible"] = "elementVisible";
    Trigger["CustomEvent"] = "customEvent";
})(Trigger || (Trigger = {}));
var Location;
(function (Location) {
    Location["Head"] = "head";
    Location["BodyTop"] = "bodyTop";
    Location["BodyBottom"] = "bodyBottom";
})(Location || (Location = {}));
var LoadingType;
(function (LoadingType) {
    LoadingType["Async"] = "async";
    LoadingType["Defer"] = "defer";
    LoadingType["Standard"] = "standard";
})(LoadingType || (LoadingType = {}));
const DATA_TAG_ID_ATTRIBUTE = "data-tag-id";
function lilTagInit(configOrUrl) {
    if (configOrUrl === "") {
        console.log("LilTag initialization skipped: empty string provided.");
        return;
    }
    if (typeof configOrUrl === "string") {
        fetch(configOrUrl)
            .then(response => response.json())
            .then((config) => {
            processConfig(config);
        })
            .catch(error => console.error("Error loading configuration:", error));
    }
    else {
        processConfig(configOrUrl);
    }
}
function processConfig(config) {
    config.tags.forEach(tag => {
        switch (tag.trigger) {
            case Trigger.PageLoad:
                executeTag(tag);
                break;
            case Trigger.DomReady:
                document.addEventListener("DOMContentLoaded", () => executeTag(tag));
                break;
            case Trigger.TimeDelay:
                if (tag.delay !== undefined) {
                    setTimeout(() => executeTag(tag), tag.delay);
                }
                break;
            case Trigger.ElementVisible:
                if (tag.selector) {
                    const observer = new IntersectionObserver(entries => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                executeTag(tag);
                                observer.disconnect(); // Stop observing after first trigger
                            }
                        });
                    });
                    document.querySelectorAll(tag.selector).forEach(element => observer.observe(element));
                }
                break;
            case Trigger.CustomEvent:
                if (tag.eventName) {
                    document.addEventListener(tag.eventName, () => executeTag(tag));
                }
                break;
            default:
                console.warn(`Unknown trigger type: ${tag.trigger}`);
        }
    });
}
function executeTag(tag) {
    const loadingType = tag.loadingType || LoadingType.Async; // Default to "async" if not specified
    if (tag.script) {
        injectScript(tag.script, tag.location, tag.id, loadingType);
    }
    else if (tag.code) {
        executeCode(tag.code, tag.location, tag.id);
    }
    else {
        console.warn(`Tag with ID "${tag.id}" has no script or code to execute.`);
    }
}
function injectScript(url, location, tagId, loadingType = LoadingType.Async) {
    const script = document.createElement("script");
    script.src = url;
    script.setAttribute(DATA_TAG_ID_ATTRIBUTE, tagId);
    switch (loadingType) {
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
    appendScript(location, script);
}
function executeCode(code, location, tagId) {
    const script = document.createElement("script");
    script.textContent = code;
    script.setAttribute(DATA_TAG_ID_ATTRIBUTE, tagId);
    appendScript(location, script);
}
function appendScript(location, script) {
    switch (location) {
        case Location.Head:
            document.head.appendChild(script);
            break;
        case Location.BodyTop:
            document.body.insertBefore(script, document.body.firstChild);
            break;
        case Location.BodyBottom:
            document.body.appendChild(script);
            break;
        default:
            console.warn(`Unknown location "${location}" - defaulting to body bottom.`);
            document.body.appendChild(script);
    }
}
