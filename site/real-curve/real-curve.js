let curveA = -11;
let curveB = 13;
let baseX = 0.6;

/** Used for curve-finding */
function setCurveParams(a, b, p) {
    curveA = a;
    curveB = b;
    baseX = p;
}

/**
 * @return {Point} base point
 */
function P() {
    return { x: baseX, y: y(baseX) };
}

/**
 * Compute the y-coordinate for the curve
 * @param x x-coordinate
 * @return {Number|NaN} y-coordinate (positive) if defined by curve
 */
function y(x) {
    return Math.sqrt(x**3 + curveA*x + curveB);
}

/**
 * Add two points on the curve. This function supports doubling.
 * @param P {Point}
 * @param Q {Point}
 * @return {Point} R such that P + Q = -R
 */
function add(P, Q) {
    if (!P) return Q;
    if (!Q) return P;
    if (P.x === Q.x && P.y !== Q.y) {
        return NaN;
    }
    const m = slope(P, Q);
    if (Number.isNaN(m)) {
        return NaN;
    }

    const x = m ** 2 - P.x - Q.x;
    const y = P.y + m * (x - P.x);
    return { x, y: -y };
}

/**
 * Negate the point (flip it across x-axis)
 * @param point {Point}
 * @return {Point} the negated point
 */
function negate(point) {
    return {x: point.x, y: -point.y};
}

/**
 * Find the slope between two points
 * @param P {Point}
 * @param Q {Point}
 * @return {Number}
 */
function slope(P, Q) {
    if (Q.x === P.x && Q.y !== P.y) {
        return Infinity;
    }
    if (P.x === Q.x) {
        // doubling: slope is a tangent
        return (3 * P.x * P.x + curveA) / (2 * P.y);
    } else {
        return (P.y - Q.y) / (P.x - Q.x);
    }
}

export {
    setCurveParams,
    y,
    P,
    add,
    negate,
    slope,
};
