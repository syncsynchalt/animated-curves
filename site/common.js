/**
 * Get element by ID.
 * @param id {String}
 * @return {HTMLElement | null}
 */
const byId = (id) => { return document.getElementById(id) };

/**
 * Convert a canvas element to high-DPI mode (if supported by device).
 *
 * @param canvas {HTMLCanvasElement} canvas element to convert
 * @return {CanvasRenderingContext2D}
 */
function convertCanvasHiDPI(canvas) {
    const ctx = canvas.getContext('2d', { alpha: false });
    const ratio = window.devicePixelRatio || 1;
    // noinspection JSUndefinedPropertyAssignment
    canvas._ratio = ratio;
    const w = canvas.width;
    const h = canvas.height;
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(ratio, ratio);
    return ctx;
}

function canvasIsScrolledIntoView(canvas) {
    const rect = canvas.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return (rect.top >= 0 && rect.top <= vh) ||
        (rect.bottom >= 0 && rect.bottom <= vh) ||
        (rect.top < 0 && rect.bottom > 0);
}

/**
 * Create an ease-in / ease-out effect.
 * @param t {Number} number between 0 and 1
 * @return the eased result, eased at the ends
 */
function easeInOut(t) {
    let sq = t * t;
    return sq / (2 * (sq - t) + 1);
}

export {
    byId,
    convertCanvasHiDPI,
    canvasIsScrolledIntoView,
    easeInOut,
};
