import * as common from '../common.js?bustin=1655260032';
import * as field from './field-25519.js?bustin=1655260032';

const slop_p = Number(field.p);

/**
 * @param P {Point}
 * @param Q {Point}
 * @return {Number} the slope from P to Q, disregarding finite math (no wrapping)
 */
function getGraphSlope(P, Q) {
    if (P.x === Q.x && P.y === Q.y) {
        // xxx fake, make this look better
        return 1;
    }
    return (Q.y - P.y) / (Q.x - P.x);
}

/**
 * Convert from a BigPoint to Point
 * @param P {BigPoint}
 * @return {Point} with inexact x and y vals
 */
function convertToPoint(P) {
    return {x: Number(P.x), y: Number(P.y) };
}

/**
 * @param P {Point}
 * @param m {Number} slope
 * @param y {Number} desired result
 * @return {Point} the point with the needed x
 */
let pointAtY = (P, m, y) => {
    let c = P.y - m * P.x;
    return {
        x: (y - c) / m,
        y
    };
};

/**
 * Return the endpoint of a line segment through P and Q that wraps the axes five times
 * @param P {BigPoint}
 * @param Q {BigPoint}
 * @return {Point} the end of the line through P and Q that wraps around the field.p five times
 */
function primaryLineEnd(P, Q) {

    [P, Q] = common.orderPointsByX(convertToPoint(P), convertToPoint(Q));
    const slope = getGraphSlope(P, Q);
    if (slope > 1) {
        const targetY = 5 * slop_p;
        return pointAtY(P, slope, targetY);
    } else if (slope < -1) {
        const targetY = -5 * slop_p;
        return pointAtY(P, slope, targetY);
    } else {
        const targetX = 5 * slop_p;
        return {x: targetX, y: P.y + (targetX - P.x) * slope};
    }
}

/**
 * Return the left endpoint of a line segment drawn through R with the slope of a line through P and Q
 * @param P {BigPoint}
 * @param Q {BigPoint}
 * @param R {BigPoint}
 * @return {BigPoint} the left endpoint of the line segment through point R
 */
function lastLineStart(P, Q, R) {
    const slope = getGraphSlope(convertToPoint(P), convertToPoint(Q));
    R = convertToPoint(R);
    let leftY = R.y - R.x * slope;
    if (leftY >= 0 && leftY < slop_p) {
        return pointAtY(R, slope, leftY);
    } else if (leftY < 0) {
        return pointAtY(R, slope, 0);
    } else {
        return pointAtY(R, slope, slop_p);
    }
}

export {
    convertToPoint,
    primaryLineEnd,
    lastLineStart,
};
