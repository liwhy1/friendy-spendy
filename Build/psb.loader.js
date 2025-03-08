function createUnityInstance(t, n, d) {
    function c(e, t) {
        if (!c.aborted && n.showBanner) {
            if (t === "error") c.aborted = true;
            n.showBanner(e, t);
        }
        switch (t) {
            case "error":
                console.error(e);
                break;
            case "warning":
                console.warn(e);
                break;
            default:
                console.log(e);
        }
    }

    function r(e) {
        var t = e.reason || e.error;
        var n = t ? t.toString() : e.message || e.reason || "";
        var r = t && t.stack ? t.stack.toString() : "";
        n += "\n" + (r.startsWith(n) ? r.substring(n.length) : r).trim();
        if (n && m.stackTraceRegExp && m.stackTraceRegExp.test(n)) {
            P(n, e.filename || (t && (t.fileName || t.sourceURL)) || "", e.lineno || (t && (t.lineNumber || t.line)) || 0);
        }
    }

    function e(e, t, n) {
        var r = e[t];
        if (r === undefined || r === null) {
            console.warn(`Config option "${t}" is missing or empty. Falling back to default value: "${n}".`);
            e[t] = n;
        }
    }

    d = d || function () {};
    var o, m = {
        canvas: t,
        webglContextAttributes: {
            preserveDrawingBuffer: false,
            powerPreference: 2
        },
        wasmFileSize: 57214263,
        cacheControl: function (e) {
            return e == m.dataUrl || e.match(/\.bundle/) ? "must-revalidate" : "no-store";
        },
        streamingAssetsUrl: "StreamingAssets",
        downloadProgress: {},
        deinitializers: [],
        intervals: {},
        setInterval: function (e, t) {
            e = window.setInterval(e, t);
            this.intervals[e] = true;
            return e;
        },
        clearInterval: function (e) {
            delete this.intervals[e];
            window.clearInterval(e);
        },
        preRun: [],
        postRun: [],
        print: function (e) {
            console.log(e);
        },
        printErr: function (e) {
            console.error(e);
        },
        locateFile: function (e) {
            return e === "build.wasm" ? this.codeUrl : e;
        },
        disabledCanvasEvents: ["contextmenu", "dragstart"]
    };

    for (o in e(n, "companyName", "Unity"), e(n, "productName", "WebGL Player"), e(n, "productVersion", "1.0"), n) {
        m[o] = n[o];
    }

    m.streamingAssetsUrl = new URL(m.streamingAssetsUrl, document.URL).href;
    var a = m.disabledCanvasEvents.slice();

    function i(e) {
        e.preventDefault();
    }

    a.forEach(function (e) {
        t.addEventListener(e, i);
    });
    window.addEventListener("error", r);
    window.addEventListener("unhandledrejection", r);

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
}