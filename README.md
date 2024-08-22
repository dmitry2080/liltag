# LilTag

LilTag is a lightweight JavaScript tag management system designed to dynamically load and execute scripts on your website based on specified triggers and conditions.

## Features

- **Dynamic Script Loading**: Load scripts asynchronously, with defer, or standard loading.
- **Multiple Triggers**: Execute scripts based on page load, DOM ready, custom events, element visibility, or after a delay.
- **Flexible Configuration**: Easily configure how and when scripts are loaded via a JSON file or an inline configuration object.
- **Script Location Control**: Inject scripts into the `<head>`, at the top of the `<body>`, or at the bottom of the `<body>`.


## Installation

Include LilTag in your project:

### Example of Including LilTag (Deferred Loading)

```html
<script src="//deeravenger.github.io/liltag/dist/liltag.min.js" defer></script>
<script>
    const lilTag = new LilTag("path_or_url/to/liltag_config.json");
    lilTag.init();
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
            const lilTag = new LilTag("path_or_url/to/liltag_config.json");
            lilTag.init();
        };
        document.head.appendChild(script);
    })();
</script>
```

## Usage

### Loading Configuration

#### 1. Loading Configuration from a URL
You can initialize LilTag by providing a URL to a JSON configuration file. The configuration file should contain the tags you want to inject into your web page.

```javascript
const lilTag = new LilTag("path_or_url/to/liltag_config.json");
lilTag.init();
```

##### JSON Configuration Example
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
            "delay": 5000,
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

#### 2. Providing the Configuration Directly
If you prefer to provide the configuration directly within your code, you can pass it as an object to the lilTagInit function.

```javascript
const lilTag = new LilTag({
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
      "delay": 5000,
      "script": "https://cdn.example.com/ads.js",
      "location": "bodyBottom",
      "loadingType": "async"
    }
  ]
});
lilTag.init();
```

### Enabling Caching

You can enable caching to avoid fetching the configuration on every page load. The enableCache() method allows you to specify a TTL (time-to-live) in seconds.
    
```javascript 
// Enable caching with a TTL of 2 hours (7200 seconds)
const lilTag = new LilTag('https://example.com/liltag-config.json');
lilTag.enableCache(7200);
lilTag.init();
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