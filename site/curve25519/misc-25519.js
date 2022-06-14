import * as common from '../common.js';
import * as curve from './curve-25519.js';
import * as field from './field-25519.js';

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
 * Return the two bounds of a line drawn through P and Q
 * @param P {BigPoint}
 * @param Q {BigPoint}
 * @return {BigPoint[2]} the left and right points to terminate a line through P and Q
 */
function primaryLineEdges(P, Q) {

    [P, Q] = common.orderPointsByX(convertToPoint(P), convertToPoint(Q));
    let left, right;
    const slope = getGraphSlope(P, Q);
    let leftY = P.y - P.x * slope;
    if (leftY >= 0 && leftY < slop_p) {
        left = pointAtY(P, slope, leftY);
    } else if (leftY < 0) {
        left = pointAtY(P, slope, 0);
    } else {
        left = pointAtY(P, slope, slop_p);
    }
    let rightY = P.y + (slop_p - P.x) * slope;
    if (rightY >= 0 && rightY < slop_p) {
        right = pointAtY(P, slope, rightY);
    } else if (rightY < 0) {
        right = pointAtY(P, slope, 0);
    } else {
        right = pointAtY(P, slope, slop_p);
    }
    return [left, right];
}

/**
 * Return the two bounds of a line drawn through R with the slope of a line through P and Q
 * @param P {BigPoint}
 * @param Q {BigPoint}
 * @param R {BigPoint}
 * @return {BigPoint[2]} the left and right points to terminate a line through P and Q
 */
function secondaryLineEdges(P, Q, R) {
    const slope = getGraphSlope(convertToPoint(P), convertToPoint(Q));
    R = convertToPoint(R);
    let left, right;
    let leftY = R.y - R.x * slope;
    if (leftY >= 0 && leftY < slop_p) {
        left = pointAtY(R, slope, leftY);
    } else if (leftY < 0) {
        left = pointAtY(R, slope, 0);
    } else {
        left = pointAtY(R, slope, slop_p);
    }
    let rightY = R.y + (slop_p - R.x) * slope;
    if (rightY >= 0 && rightY < slop_p) {
        right = pointAtY(R, slope, rightY);
    } else if (rightY < 0) {
        right = pointAtY(R, slope, 0);
    } else {
        right = pointAtY(R, slope, slop_p);
    }
    return [left, right];
}

export {
    convertToPoint,
    primaryLineEdges,
    secondaryLineEdges,
};
