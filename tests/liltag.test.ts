import { JSDOM } from 'jsdom';
import { lilTagInit } from '../src/liltag';

describe('LilTag', () => {
    let dom: JSDOM;

    beforeEach(() => {
        global.IntersectionObserver = class IntersectionObserver {
            constructor(private callback: IntersectionObserverCallback) {}
            observe = jest.fn();
            unobserve = jest.fn();
            disconnect = jest.fn();
            trigger(entries: IntersectionObserverEntry[]) {
                this.callback(entries, this);
            }
        } as any;

        dom = new JSDOM(`<!DOCTYPE html><html><head></head><body><div id="content"></div></body></html>`, {
            url: "http://localhost",
            runScripts: "dangerously",
            resources: "usable"
        });

        global.document = dom.window.document;
        global.window = dom.window as any;

        // Mocking script loading
        global.document.createElement = ((originalCreateElement) => {
            return function(tagName: string) {
                const element = originalCreateElement.call(this, tagName);
                if (tagName === 'script') {
                    element.setAttribute = ((originalSetAttribute) => {
                        return function(name: string, value: string) {
                            if (name === 'src' && value.includes('example.com')) {
                                setTimeout(() => {
                                    // Simulate successful script load
                                    const event = new Event('load');
                                    element.dispatchEvent(event);
                                }, 50);
                            } else {
                                originalSetAttribute.call(this, name, value);
                            }
                        };
                    })(element.setAttribute);
                }
                return element;
            };
        })(global.document.createElement);
    });

    afterEach(() => {
        global.document = undefined!;
        global.window = undefined!;
        delete global.IntersectionObserver;
    });

    test('should load script on pageLoad trigger', () => {
        const scriptUrl = "https://example.com/script.js";

        lilTagInit({
            tags: [
                {
                    id: "testTag",
                    trigger: "pageLoad",
                    script: scriptUrl,
                    location: "head",
                    loadingType: "standard"
                }
            ]
        });

        const scriptElement = global.document.querySelector(`script[src="${scriptUrl}"]`);
        expect(scriptElement).not.toBeNull();
    });

    test('should run code on pageLoad trigger', () => {
        lilTagInit({
            tags: [
                {
                    id: "testTag",
                    trigger: "pageLoad",
                    code: "console.log('Code executed!');",
                    location: "head",
                    loadingType: "standard"
                }
            ]
        });

        const scriptElement = global.document.querySelector(`script[data-tag-id="testTag"]`);
        expect(scriptElement).not.toBeNull();
    });

    test('should execute code on pageLoad trigger', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const code = "console.log('Code executed!');";

        lilTagInit({
            tags: [
                {
                    id: "testCode",
                    trigger: "pageLoad",
                    code: code,
                    location: "bodyBottom",
                    loadingType: "standard"
                }
            ]
        });

        expect(consoleSpy).toHaveBeenCalledWith('Code executed!');
        consoleSpy.mockRestore();
    });

    test('should execute script after timeDelay trigger', done => {
        lilTagInit({
            tags: [
                {
                    id: "delayedTag",
                    trigger: "timeDelay",
                    code: "console.log('Delayed script loaded!');",
                    location: "bodyBottom",
                    delay: 1000,  // 1 second delay
                    loadingType: "standard"
                }
            ]
        });

        setTimeout(() => {
            const scriptElement = global.document.querySelector(`script[data-tag-id="delayedTag"]`);
            expect(scriptElement).not.toBeNull();
            done();
        }, 1100);  // Allow some buffer time to ensure the delay has passed
    });

    test('should execute code on customEvent trigger', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const code = "console.log('Custom event triggered!');";
        const eventName = "customEvent";

        lilTagInit({
            tags: [
                {
                    id: "customEventTag",
                    trigger: "customEvent",
                    code: code,
                    location: "bodyBottom",
                    eventName: eventName,
                    loadingType: "standard"
                }
            ]
        });

        // Simulate the custom event
        const event = new global.window.Event(eventName);
        global.document.dispatchEvent(event);

        expect(consoleSpy).toHaveBeenCalledWith('Custom event triggered!');
        consoleSpy.mockRestore();
    });

    // test('should load script when element becomes visible', done => {
    //     const selector = "#content";
    //
    //     lilTagInit({
    //         tags: [
    //             {
    //                 id: "visibleTag",
    //                 trigger: "elementVisible",
    //                 code: "console.log('Element visible!');",
    //                 location: "bodyBottom",
    //                 selector: selector,
    //                 loadingType: "standard"
    //             }
    //         ]
    //     });
    //
    //     const contentDiv = global.document.querySelector(selector);
    //     // contentDiv!.style.display = "block";
    //
    //     // Trigger the observer with the mock data
    //     setTimeout(() => {
    //         const mockObserver = global.IntersectionObserver.mock.instances[0];
    //         mockObserver.trigger([{ isIntersecting: true, target: contentDiv! }]);
    //
    //         setTimeout(() => {
    //             const scriptElement = global.document.querySelector(`script[data-tag-id="visibleTag"]`);
    //             expect(scriptElement).not.toBeNull();
    //             done();
    //         }, 200);
    //     }, 200);
    // }, 10000); // Increase the test timeout to 10 seconds
});