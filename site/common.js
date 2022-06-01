/**
 * Get element by ID.
 * @param id {String}
 * @return {HTMLElement | null}
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

function mathFont(size) {
    if (!size) {
        size = '1em';
    }
    return `oblique ${size} STIXGeneral, "DejaVu Serif", "DejaVu Sans", Times, ` +
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

/**
 * Mask the canvas with a "Play" button, and attach a clickable play function.
 * @param ctx {CanvasRenderingContext2D}
 * @param playFunc {Function}
 */
async function addPlayMask(ctx, playFunc) {
    const canvas = ctx.canvas;
    if (canvas._hasPlayMask) {
        return;
    }
    canvas._hasPlayMask = true;
    const origOnClick = canvas.onclick;
    const ratio = canvas._ratio || 1;
    const brightness = 0.96;

    // noinspection JSUnresolvedVariable
    if (window.CanvasFilter === undefined) {
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
        let p = new Promise(success => {
            ctx.save();
            let img = new Image();
            img.src = canvas.toDataURL('image/png');
            ctx.filter = `blur(1px) brightness(${brightness}) grayscale(1)`;
            img.addEventListener('load', () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height,
                    0, 0, canvas.width / ratio, canvas.height / ratio);
                ctx.restore();
                success();
            });
        });
        await p;
    }

    canvas.onclick = (e) => {
        canvas._hasPlayMask = false;
        e.stopPropagation();
        canvas.onclick = origOnClick;
        playFunc(canvas);
    };

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
 * Choose the best direction to write a label for a point (based on amount of clear (white) pixels).
 * @param ctx {CanvasRenderingContext2D}
 * @param x {Number} x-coordinate (in canvas context)
 * @param y {Number} y-coordinate (in canvas context)
 * @param sampleWidth {Number?} the sample box size (default 20)
 * @param sampleMargin {Number?} the number of pixels to skip before taking sample (default 2)
 * @return {Number[2]} -1/+1 for left-right, then -1/+1 for up-down
 */
function pickLabelDirection(ctx, x, y, sampleWidth, sampleMargin) {
    // noinspection JSUnresolvedVariable
    const ratio = ctx.canvas._ratio || 1;
    let bestDirCount = 0;
    let bestDir = [0, 0];
    const margin = sampleMargin || 2;
    sampleWidth = sampleWidth || 20;
    [1, -1].forEach(lr => {
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

export {
    byId,
    range,
    mathFont,
    orderPointsByX,
    convertCanvasHiDPI,
    canvasIsScrolledIntoView,
    easeInOut,
    addPlayMask,
    pickLabelDirection,
};
