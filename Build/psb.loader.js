function createUnityInstance(canvas, config, onProgress) {
    function showBanner(message, type) {
        if (showBanner.aborted) return;
        if (config.showBanner) {
            if (type === "error") showBanner.aborted = true;
            config.showBanner(message, type);
        }
        switch (type) {
            case "error": console.error(message); break;
            case "warning": console.warn(message); break;
            default: console.log(message);
        }
    }

    function handleError(event) {
        let error = event.reason || event.error;
        let message = error ? error.toString() : event.message || event.reason || "";
        let stackTrace = error && error.stack ? error.stack.toString() : "";
        if (message) {
            message += "\n" + (stackTrace.startsWith(message) ? stackTrace.substring(message.length) : stackTrace).trim();
        }
        if (instance.stackTraceRegExp && instance.stackTraceRegExp.test(message)) {
            showError(message, event.filename || error?.fileName || error?.sourceURL || "", event.lineno || error?.lineNumber || error?.line || 0);
        }
    }

    function setDefault(config, key, defaultValue) {
        if (!config[key]) {
            console.warn(`Config option "${key}" is missing or empty. Falling back to default value: "${defaultValue}".`);
            config[key] = defaultValue;
        }
    }

    onProgress = onProgress || function() {};
    let instance = {
        canvas: canvas,
        webglContextAttributes: { preserveDrawingBuffer: false, powerPreference: "high-performance" },
        wasmFileSize: 57214263,
        cacheControl: (url) => url === instance.dataUrl || url.match(/\.bundle/) ? "must-revalidate" : "no-store",
        streamingAssetsUrl: "StreamingAssets",
        downloadProgress: {},
        deinitializers: [],
        intervals: {},
        setInterval: function(callback, time) {
            let id = window.setInterval(callback, time);
            this.intervals[id] = true;
            return id;
        },
        clearInterval: function(id) {
            delete this.intervals[id];
            window.clearInterval(id);
        },
        preRun: [],
        postRun: [],
        print: console.log,
        printErr: function(message) {
            console.error(message);
            if (typeof message === "string" && message.includes("wasm streaming compile failed")) {
                if (message.toLowerCase().includes("mime")) {
                    showBanner(`HTTP Response Header "Content-Type" configured incorrectly for file ${instance.codeUrl}. Should be "application/wasm".`, "warning");
                } else {
                    showBanner("WebAssembly streaming compilation failed! Check the server configuration.", "warning");
                }
            }
        },
        locateFile: function(filename) {
            return filename === "build.wasm" ? this.codeUrl : filename;
        },
        disabledCanvasEvents: ["contextmenu", "dragstart"]
    };

    setDefault(config, "companyName", "Unity");
    setDefault(config, "productName", "WebGL Player");
    setDefault(config, "productVersion", "1.0");

    Object.assign(instance, config);
    instance.streamingAssetsUrl = new URL(instance.streamingAssetsUrl, document.URL).href;

    // Disable unwanted canvas events
    instance.disabledCanvasEvents.forEach(event => canvas.addEventListener(event, e => e.preventDefault()));

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleError);

    function toggleFullScreen(event) {
        if (document.webkitCurrentFullScreenElement === canvas) {
            canvas.style.width = "100%";
            canvas.style.height = "100%";
        } else {
            canvas.style.width = "";
            canvas.style.height = "";
        }
    }

    document.addEventListener("webkitfullscreenchange", toggleFullScreen);
    instance.deinitializers.push(() => {
        instance.disabledCanvasEvents.forEach(event => canvas.removeEventListener(event, e => e.preventDefault()));
        window.removeEventListener("error", handleError);
        window.removeEventListener("unhandledrejection", handleError);
        document.removeEventListener("webkitfullscreenchange", toggleFullScreen);
        Object.keys(instance.intervals).forEach(id => window.clearInterval(id));
        instance.intervals = {};
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js').then((registration) => {
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        newWorker.postMessage('SKIP_WAITING');
                        window.location.reload();
                    }
                });
            });
        });
    }

    return new Promise((resolve, reject) => {
        if (!instance.SystemInfo.hasWebGL) {
            reject("Your browser does not support WebGL.");
        } else if (!instance.SystemInfo.hasWasm) {
            reject("Your browser does not support WebAssembly.");
        } else {
            resolve({ Module: instance });
        }
    });
}