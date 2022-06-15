/**
 * @alias document.getElementById
 */
const byId = (id) => { return document.getElementById(id) };

/**
 * Build a range of integers
 * @param first {Number?} first number (default 1)
 * @param last {Number} last number
 * @return {Number[]}
 */
function range(first, last) {
    if (last === undefined) {
        last = first;
        first = 1;
    }
    let result = [];
    for (let i = first; i <= last; i++) {
        result.push(i);
    }
    return result;
}

/**
 * Return a good font for displaying math equations.
 * @param size {Number|String} CSS-ready size such as '1em' or '14px'
 * @return {string}
 */
function mathFont(size) {
    size = size || '1em';
    return `${size} STIXGeneral, "DejaVu Serif", "DejaVu Sans", Times, ` +
        '"Lucida Sans Unicode", OpenSymbol, "Standard Symbols L", serif';
}

/**
 * @param P {Point}
 * @param Q {Point}
 * @return {Point[2]}
 */
function orderPointsByX(P, Q) {
    return P.x > Q.x ? [Q, P] : [P, Q];
}

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
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return ctx;
}

/**
 * Check whether the user can currently see the canvas (i.e. whether to continue an animation, or pause)
 * @param canvas {HTMLCanvasElement}
 */
function canvasIsScrolledIntoView(canvas) {
    if (canvas.dataset.visible === 'always') {
        return true;
    }
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
    if (t > 1.0) t = 1.0;
    let sq = t * t;
    return sq / (2 * (sq - t) + 1);
}

/**
 * Save off the state of the canvas image.
 * @param ctx {CanvasRenderingContext2D}
 * @return {HTMLCanvasElement} state of the canvas
 */
function getCanvasImageState(ctx) {
    let save = document.createElement('canvas');
    let mid = document.createElement('canvas');
    save.width = ctx.canvas.width;
    save.height = ctx.canvas.height;
    mid.width = save.width;
    mid.height = save.height;
    let saveCtx = save.getContext('2d');
    let midCtx = mid.getContext('2d');
    midCtx.drawImage(ctx.canvas, 0, 0);
    saveCtx.drawImage(midCtx.canvas, 0, 0);
    return save;
}

/**
 * Restore the state of the canvas image.
 * @param ctx {CanvasRenderingContext2D}
 * @param state {HTMLCanvasElement} returned from getCanvasImageState
 */
function putCanvasImageState(ctx, state) {
    const ratio = ctx.canvas['_ratio'];
    ctx.drawImage(state, 0, 0, state.width / ratio, state.height / ratio);
}

/**
 * Add a grey blur effect to the canvas.
 * @param ctx {CanvasRenderingContext2D}
 */
function addGreyMask(ctx) {
    const canvas = ctx.canvas;
    const brightness = 0.98;

    if (window['CanvasFilter'] === undefined) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let px = imageData.data, i = 0; i < px.length; i += 4) {
            // rgba order
            let lightness = (px[i] + px[i + 1] + px[i + 2]) / 3;
            lightness *= brightness;
            px[i] = lightness;
            px[i + 1] = lightness;
            px[i + 2] = lightness;
        }
        ctx.putImageData(imageData, 0, 0);
    } else {
        ctx.save();
        let saved = getCanvasImageState(ctx);
        ctx.filter = `blur(0.8px) contrast(${brightness}) grayscale(1)`;
        putCanvasImageState(ctx, saved);
        ctx.restore();
    }
}

/**
 * Add a "paused" graphic to the canvas.
 * @param ctx {CanvasRenderingContext2D}
 */
function addPausedMask(ctx) {
    const canvas = ctx.canvas;
    const ratio = canvas._ratio || 1;

    addGreyMask(ctx);

    ctx.save();
    ctx.beginPath();
    const w = canvas.width / ratio, h = canvas.height / ratio;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 15;
    ctx.moveTo(w/2 - 20, h/2 - 30);
    ctx.lineTo(w/2 - 20, h/2 + 30);
    ctx.lineTo(w/2 + 40, h/2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.stroke();
    ctx.restore();
}

/**
 * Add a click action that plays/pauses the animation.
 * @param ctx {CanvasRenderingContext2D}
 * @param playFunc {Function}
 * @param stopFunc {Function}
 */
async function addPlayPause(ctx, playFunc, stopFunc) {
    ctx.canvas.onclick = (e) => {
        if (e) {
            e.stopPropagation();
        }
        if (ctx.canvas.dataset.paused === 'true') {
            ctx.canvas.dataset.paused = 'false';
            playFunc(ctx);
        } else {
            ctx.canvas.dataset.paused = 'true';
            stopFunc(ctx);
            addPausedMask(ctx);
        }
    };
    ctx.canvas.dataset.paused = 'true';
    ctx.canvas.dataset.clickable = 'true';
    addPausedMask(ctx);
}

function cancelAnimation(ctx) {
    if (ctx['_timeout']) {
        clearTimeout(ctx['_timeout']);
        ctx['_timeout'] = null;
    }
    if (ctx['_frame']) {
        cancelAnimationFrame(ctx['_frame']);
        ctx['_frame'] = null;
    }
}

/**
 * Choose the best direction to write a label for a point (based on amount of clear (white) pixels).
 * @param ctx {CanvasRenderingContext2D}
 * @param x {Number} x-coordinate (in canvas context)
 * @param y {Number} y-coordinate (in canvas context)
 * @param sampleWidth {Number?} the sample box size (default 20)
 * @param sampleMargin {Number?} the number of pixels to skip before taking sample (default 2)
 * @return {Number[2]} -1/+1 for left-right, then -1/+1 for up-down
 */
function pickLabelDirection(ctx, x, y, sampleWidth, sampleMargin) {
    const ratio = ctx.canvas['_ratio'] || 1;
    let bestDirCount = 0;
    let bestDir = [1, 1];
    const margin = sampleMargin || 2;
    sampleWidth = sampleWidth || 20;
    [-1, 1].forEach(lr => {
        [-1, 1].forEach(ud => {
            let data = ctx.getImageData(ratio * (x + lr*margin), ratio * (y + ud*margin),
                ratio * (lr*sampleWidth), ratio * (ud*sampleWidth));
            const d = data.data;
            let whiteCount = 0;
            for (let i = 0; i < d.length; i += 4) {
                if (d[i] === 255 && d[i+1] === 255 && d[i+2] === 255) {
                    whiteCount++;
                }
            }
            if (whiteCount > bestDirCount) {
                bestDirCount = whiteCount;
                bestDir = [lr, ud];
            }
        });
    });
    return bestDir;
}

let clickableCanvases;
function startVisibleCanvases() {
    if (!clickableCanvases) {
        clickableCanvases = [].slice.call(document.querySelectorAll('canvas.animated'));
    }
    let dirty = false;
    for (let canvas of clickableCanvases) {
        if (!canvas.dataset.autostarted) {
            if (canvasIsScrolledIntoView(canvas)) {
                dirty = true;
                canvas.dataset.autostarted = 'true';
                canvas.click();
            }
        }
    }
    if (dirty) {
        clickableCanvases = clickableCanvases.filter(el => {
            return el.dataset.autostarted !== 'true';
        });
    }
}

/**
 * Sleep the given number of milliseconds.
 * @param ms {Number} milliseconds to sleep
 * @param ctx {CanvasRenderingContext2D?} optional canvas context to attach timeout handle
 * @return {Promise}
 */
function sleep(ms, ctx) {
    ctx = ctx || {};
    return new Promise(resolve => {
        ctx['_timeout'] = setTimeout(resolve, ms);
    });
}

export {
    byId,
    range,
    mathFont,
    orderPointsByX,
    convertCanvasHiDPI,
    canvasIsScrolledIntoView,
    easeInOut,
    getCanvasImageState,
    putCanvasImageState,
    addGreyMask,
    addPlayPause,
    cancelAnimation,
    pickLabelDirection,
    startVisibleCanvases,
    sleep,
};
