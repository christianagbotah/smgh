(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/router.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Link",
    ()=>Link,
    "RouterProvider",
    ()=>RouterProvider,
    "useRouter",
    ()=>useRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
'use client';
;
const RouterContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])({
    path: '/',
    params: {},
    navigate: ()=>{},
    back: ()=>{}
});
function useRouter() {
    _s();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(RouterContext);
}
_s(useRouter, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
function parseHash(hash) {
    const raw = hash.replace(/^#\/?/, '') || '/';
    // Strip query parameters from the path segment
    const cleanRaw = raw.split('?')[0];
    const segments = cleanRaw.split('/').filter(Boolean);
    let path = '/';
    const params = {};
    if (segments.length === 0) {
        path = '/';
    } else if (segments[0] === 'events' && segments.length === 2) {
        path = '/events/:slug';
        params.slug = segments[1];
    } else if (segments[0] === 'events' && segments.length === 1) {
        path = '/events';
    } else if (segments[0] === 'track-order' && segments.length === 1) {
        path = '/track-order';
    } else {
        path = '/' + segments[0];
    }
    return {
        path,
        params
    };
}
const initialState = {
    path: '/',
    params: {}
};
function Link({ to, children, className, onClick }) {
    _s1();
    const handleClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Link.useCallback[handleClick]": (e)=>{
            e.preventDefault();
            window.location.hash = to;
            onClick?.(e);
        }
    }["Link.useCallback[handleClick]"], [
        to,
        onClick
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
        href: `#${to}`,
        onClick: handleClick,
        className: className,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/lib/router.tsx",
        lineNumber: 66,
        columnNumber: 5
    }, this);
}
_s1(Link, "PRIOWs9bezaAbp8UlGmbaZMoYYA=");
_c = Link;
function RouterProvider({ children }) {
    _s2();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialState);
    const initializedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const handleHashChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "RouterProvider.useCallback[handleHashChange]": ()=>{
            const newState = parseHash(window.location.hash);
            setState(newState);
            window.scrollTo({
                top: 0,
                behavior: 'instant'
            });
        }
    }["RouterProvider.useCallback[handleHashChange]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RouterProvider.useEffect": ()=>{
            if (initializedRef.current) return;
            initializedRef.current = true;
            // Set initial state from current hash using rAF to avoid synchronous setState in effect
            const hash = window.location.hash;
            if (hash && hash !== '#') {
                requestAnimationFrame({
                    "RouterProvider.useEffect": ()=>{
                        setState(parseHash(hash));
                    }
                }["RouterProvider.useEffect"]);
            } else {
                window.location.hash = '#/';
            }
            window.addEventListener('hashchange', handleHashChange);
            return ({
                "RouterProvider.useEffect": ()=>window.removeEventListener('hashchange', handleHashChange)
            })["RouterProvider.useEffect"];
        }
    }["RouterProvider.useEffect"], [
        handleHashChange
    ]);
    const navigate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "RouterProvider.useCallback[navigate]": (path)=>{
            window.location.hash = path;
        }
    }["RouterProvider.useCallback[navigate]"], []);
    const back = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "RouterProvider.useCallback[back]": ()=>{
            window.history.back();
        }
    }["RouterProvider.useCallback[back]"], []);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "RouterProvider.useMemo[value]": ()=>({
                ...state,
                navigate,
                back
            })
    }["RouterProvider.useMemo[value]"], [
        state,
        navigate,
        back
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RouterContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/lib/router.tsx",
        lineNumber: 115,
        columnNumber: 5
    }, this);
}
_s2(RouterProvider, "iQVLm3FN8vbtWdJPJ5UvzPCIkNM=");
_c1 = RouterProvider;
var _c, _c1;
__turbopack_context__.k.register(_c, "Link");
__turbopack_context__.k.register(_c1, "RouterProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$router$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/router.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$pages$2f$PageShell$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/pages/PageShell.tsx [app-client] (ecmascript)");
'use client';
;
;
;
function Home() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$router$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RouterProvider"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$pages$2f$PageShell$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PageShell"], {}, void 0, false, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 9,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 8,
        columnNumber: 5
    }, this);
}
_c = Home;
var _c;
__turbopack_context__.k.register(_c, "Home");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_51122798._.js.map