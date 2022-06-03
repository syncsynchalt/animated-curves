import * as field from './field.js';
import * as curve from './curve.js';
import * as common from '../common.js';

let xAtY = (P, m, y) => {
    let c = P.y - m * P.x;
    return (y - c) / m;
};

/**
 * Return the x bounds of a line drawn through P and Q, in Fp
 * @param P {Point}
 * @param Q {Point}
 * @return {Number[2]} x values of start and end of a line between P and Q
 */
function lineBoxBounds(P, Q) {
    [P, Q] = common.orderPointsByX(P, Q);
    let lbound, hbound;
    const slope = getSlope(P, Q);
    let left = P.y - P.x * slope;
    if (left >= 0 && left < field.p) {
        lbound = 0;
    } else if (left < 0) {
        lbound = xAtY(P, slope, 0);
    } else {
        lbound = xAtY(P, slope, field.p);
    }
    let right = P.y + (field.p - P.x) * slope;
    if (right >= 0 && right < field.p) {
        hbound = field.p;
    } else if (right < 0) {
        hbound = xAtY(P, slope, 0);
    } else {
        hbound = xAtY(P, slope, field.p);
    }
    return [lbound, hbound];
}

/**
 * Calculate the slope between two points.  If they're the same point, return the curve tangent.
 *
 * @param P {Point} point on the line
 * @param Q {Point} point on the line
 */
function getSlope(P, Q) {
    if (P.x === Q.x && P.y === Q.y) {
        return curve.tangent(P);
    } else if (P.x === Q.x) {
        return +Infinity;
    } else {
        return (Q.y - P.y) / (Q.x - P.x);
    }
}

/**
 * Find the total X distance (including modular wraparound) which a line
 * will travel from P through Q to R.
 * @param P {Point} input point
 * @param Q {Point} input point
 * @param negR {Point} resulting point where line through P,Q intersects curve
 * @return {Number} distance in x coordinates which the line will travel after wraparounds in Fp.
 */
function findTotalXLength(P, Q, negR) {
    [P, Q] = common.orderPointsByX(P, Q);
    const slope = getSlope(P, Q);
    for (let xp = 1; xp < 100000; xp++) {
        if (field.reduce(P.x + xp) === negR.x && field.reduce(P.y + (xp*slope)) === negR.y) {
            return xp;
        }
    }
    const str = JSON.stringify;
    console.log(`Couldn't get length for P:${str(P)} Q:${str(Q)} R:${str(negR)}`);
    return 1000;
}

/**
 * Draw a line segment with slope through point P, ending at the bounds of Fp ([0..p-1])
 * @param P {Point} point to start the line segment at
 * @param slope {Number} slope of the line to draw
 * @param xUnits {Number} max number of x units to draw line for
 * @param allowedLen {Number} return a segment at most this long
 * @return {Point} point of the end of segment, either stopping at xUnits or at the bounds of Fp
 */
function findWrapSegment(P, slope, xUnits, allowedLen) {
    let xPlus = Math.min(xUnits, field.p - P.x);
    let yCandidate = P.y + (slope * xPlus);
    if (yCandidate < 0) {
        xPlus = xAtY(P, slope, 0) - P.x;
    } else if (yCandidate > field.p) {
        xPlus = xAtY(P, slope, field.p) - P.x;
    }
    let Q = {x: P.x + xPlus, y: P.y + (slope * xPlus) };
    const sLen = segmentLen(P, Q);
    if (sLen > allowedLen) {
        xPlus *= allowedLen / sLen;
        Q = {x: P.x + xPlus, y: P.y + (slope * xPlus) };
    }
    return Q;
}

/**
 * Calc the length of a line segment from P to Q.
 * @param P {Point}
 * @param Q {Point}
 * @return {Number} length of the line segment
 */
function segmentLen(P, Q) {
    return Math.sqrt((P.x - Q.x)**2 + (P.y - Q.y)**2);
}

export {
    lineBoxBounds,
    getSlope,
    findTotalXLength,
    findWrapSegment,
    segmentLen,
};
