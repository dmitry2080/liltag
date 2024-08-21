# LilTag

LilTag is a simple and flexible JavaScript tag management system designed for developers. It allows you to manage and inject JavaScript tags into your web pages with ease, supporting dynamic loading of scripts based on specific triggers without needing to commit them to your repository.

## Features

- **Flexible Triggers**: Supports a variety of triggers, including page load, DOM ready, time delay, element visibility, and custom events.
- **Dynamic Script Loading**: Load external scripts dynamically without committing them to your repository.
- **Custom Code Execution**: Execute inline JavaScript code based on triggers.
- **Placement Control**: Specify where to inject scripts or execute code (head, top of the body, or bottom of the body).

## Installation

To get started with LilTag, you can include it in your project by linking to the compiled JavaScript file hosted on GitHub Pages or hosting it yourself.

### Example of Including LilTag (Deferred Loading)

```html
<script src="//deeravenger.github.io/liltag/dist/liltag.min.js" defer></script>
<script>
    window.lilTagInit("path_or_url/to/liltag_config.json");
</script>
```

### Example of Including LilTag (Asynchronous Loading)
If you want to load LilTag asynchronously and initialize it only after the script has fully loaded, you can use the following approach:

```html
<script>
    (function() {
        const script = document.createElement("script");
        script.src = "//deeravenger.github.io/liltag/dist/liltag.min.js";
        script.async = true;
        script.onload = function() {
            window.lilTagInit("path_or_url/to/liltag_config.json"); // Update with the correct configuration file path
        };
        document.head.appendChild(script);
    })();
</script>
```

## Usage

### 1. Loading Configuration from a URL
You can initialize LilTag by providing a URL to a JSON configuration file. The configuration file should contain the tags you want to inject into your web page.

```javascript
window.lilTagInit("path_or_url/to/liltag_config.json");
```

#### JSON Configuration Example
```json
{
    "tags": [
        {
            "id": "analytics",
            "trigger": "pageLoad",
            "script": "https://cdn.example.com/analytics.js",
            "location": "head",
            "loadingType": "async"
        },
        {
            "id": "ads",
            "trigger": "timeDelay",
            "delay": 5000,  // 5 seconds after page load
            "script": "https://cdn.example.com/ads.js",
            "location": "bodyBottom",
            "loadingType": "async"
        },
        {
            "id": "lazyLoadImages",
            "trigger": "elementVisible",
            "selector": ".lazy-load",
            "script": "https://cdn.example.com/lazyload.js",
            "location": "bodyBottom",
            "loadingType": "standard"
        },
        {
            "id": "customLogger",
            "trigger": "customEvent",
            "eventName": "userLoggedIn",
            "code": "console.log('User logged in event detected.');",
            "location": "bodyBottom",
            "loadingType": "defer"
        }
    ]
}
```

### 2. Providing the Configuration Directly
If you prefer to provide the configuration directly within your code, you can pass it as an object to the lilTagInit function.

```javascript
window.lilTagInit({
  tags: [
    {
      id: "analytics",
      trigger: "pageLoad",
      script: "https://example.com/analytics.js",
      location: "head",
      loadingType: "defer"
    },
    {
      id: "ads",
      trigger: "timeDelay",
      script: "https://example.com/ads.js",
      location: "bodyBottom",
      delay: 3000,
      loadingType: "async"
    }
  ]
});
```

## Configuration Options
Each tag in the configuration file or object should have the following properties:

- **id**: A unique identifier for the tag.
- **trigger**: The event that triggers the tag. Options are:
  - "pageLoad": Triggered when the page loads.
  - "domReady": Triggered when the DOM is fully loaded and parsed.
  - "timeDelay": Triggered after a specified delay once the page has loaded.
  - "elementVisible": Triggered when a specified element becomes visible in the viewport.
  - "customEvent": Triggered when a custom event is fired.
- **script**: (Optional) The URL of the script to be injected.
- **code**: (Optional) Inline JavaScript code to be executed.
- **location**: Where to inject the script or execute the code. Options are:
  - "head": Injects the script or code into the <head> of the document.
  - "bodyTop": Injects the script or code at the top of the <body>.
  - "bodyBottom": Injects the script or code at the bottom of the <body>.
- **delay**: (Optional) Used with the "timeDelay" trigger to specify the delay in milliseconds before the script or code is executed.
- **selector**: (Optional) A CSS selector for the element to observe. Required for the "elementVisible" trigger.
- **eventName**: (Optional) The name of the custom event to listen for. Required for the "customEvent" trigger.
- **loadingType**: (Optional) Specifies how the script should be loaded. Options are:
  - "async": The script is loaded asynchronously and does not block page rendering. This is the default behavior.
  - "defer": The script is loaded in parallel with other resources but is executed only after the HTML document is fully parsed.
  - "standard": The script is loaded and executed immediately as it is encountered, blocking the parsing of the rest of the page.

Each tag must specify at least one of the following: script (URL) or code (inline JavaScript). The location determines where the script or code is inserted into the document.