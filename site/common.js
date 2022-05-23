let PIXEL_RATIO = (ctx) => {
    // noinspection JSUnresolvedVariable
    const dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;
    return dpr / bsr;
};

function createHiDPICanvas(parent, w, h) {
    const can = parent.appendChild(document.createElement('canvas'));
    const ctx = can.getContext('2d', {alpha: false});
    const ratio = PIXEL_RATIO(ctx);
    can._ratio = ratio;
    can.width = w * ratio;
    can.height = h * ratio;
    can.style.width = w + 'px';
    can.style.height = h + 'px';
    ctx.scale(ratio, ratio);
    return [can, ctx];
}

export {
    createHiDPICanvas
};
