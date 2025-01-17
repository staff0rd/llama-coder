
// Remove all newlines, double spaces, etc
function normalizeText(src: string) {
    src = src.split('\n').join(' ');
    src = src.replace(/\s+/gm, ' ');
    return src;
}

function extractPromptCacheKey(args: { prefix: string, suffix: string }) {
    let key = normalizeText(args.prefix + ' ##CURSOR## ' + args.suffix);

    return key;
}

// TODO: make it LRU
let cache: { [key: string]: string | null } = {};

export function getFromPromptCache(args: { prefix: string, suffix: string }): string | undefined | null {
    const key = extractPromptCacheKey(args);
    return cache[key];
}

export function setPromptToCache(args: { prefix: string, suffix: string, value: string | null }) {
    const key = extractPromptCacheKey(args);
    cache[key] = args.value;
}