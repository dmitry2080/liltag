"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsdom_1 = require("jsdom");
const liltag_1 = require("./liltag");
describe('LilTag', () => {
    let dom;
    beforeEach(() => {
        // Create a new JSDOM instance before each test to simulate a browser environment
        dom = new jsdom_1.JSDOM(`<!DOCTYPE html><html><head></head><body><div id="content"></div></body></html>`, {
            url: "http://localhost",
            runScripts: "dangerously",
            resources: "usable"
        });
        global.document = dom.window.document;
        global.window = dom.window;
    });
    afterEach(() => {
        // Clean up the global document and window after each test
        global.document = undefined;
        global.window = undefined;
    });
    test('should load script on pageLoad trigger', () => {
        const scriptUrl = "https://example.com/script.js";
        (0, liltag_1.lilTagInit)({
            tags: [
                {
                    id: "testTag",
                    trigger: "pageLoad",
                    script: scriptUrl,
                    location: "head"
                }
            ]
        });
        const scriptElement = global.document.querySelector(`script[src="${scriptUrl}"]`);
        expect(scriptElement).not.toBeNull();
    });
    test('should execute code on pageLoad trigger', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const code = "console.log('Code executed!');";
        (0, liltag_1.lilTagInit)({
            tags: [
                {
                    id: "testCode",
                    trigger: "pageLoad",
                    code: code,
                    location: "bodyBottom"
                }
            ]
        });
        expect(consoleSpy).toHaveBeenCalledWith('Code executed!');
        consoleSpy.mockRestore();
    });
    test('should execute script after timeDelay trigger', done => {
        const scriptUrl = "https://example.com/delayedScript.js";
        (0, liltag_1.lilTagInit)({
            tags: [
                {
                    id: "delayedTag",
                    trigger: "timeDelay",
                    script: scriptUrl,
                    location: "bodyBottom",
                    delay: 1000 // 1 second delay
                }
            ]
        });
        setTimeout(() => {
            const scriptElement = global.document.querySelector(`script[src="${scriptUrl}"]`);
            expect(scriptElement).not.toBeNull();
            done();
        }, 1100); // Allow some buffer time to ensure the delay has passed
    });
    test('should load script when element becomes visible', done => {
        const scriptUrl = "https://example.com/visibleScript.js";
        const selector = "#content";
        (0, liltag_1.lilTagInit)({
            tags: [
                {
                    id: "visibleTag",
                    trigger: "elementVisible",
                    script: scriptUrl,
                    location: "bodyBottom",
                    selector: selector
                }
            ]
        });
        const contentDiv = global.document.querySelector(selector);
        contentDiv.style.display = "block";
        // Simulate the element becoming visible
        setTimeout(() => {
            const scriptElement = global.document.querySelector(`script[src="${scriptUrl}"]`);
            expect(scriptElement).not.toBeNull();
            done();
        }, 100);
    });
    test('should execute code on customEvent trigger', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const code = "console.log('Custom event triggered!');";
        const eventName = "customEvent";
        (0, liltag_1.lilTagInit)({
            tags: [
                {
                    id: "customEventTag",
                    trigger: "customEvent",
                    code: code,
                    location: "bodyBottom",
                    eventName: eventName
                }
            ]
        });
        // Simulate the custom event
        const event = new global.window.Event(eventName);
        global.document.dispatchEvent(event);
        expect(consoleSpy).toHaveBeenCalledWith('Custom event triggered!');
        consoleSpy.mockRestore();
    });
});
