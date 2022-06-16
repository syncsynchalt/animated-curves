/**
 * Operations of curve61
 *
 * Curve61 is the Weierstrass curve y^2 = x^3 + Ax + B in the field Fp where p = 61.
 */

import * as field from './field.js?bustin=1655408920';

let curveA = 9;
let curveB = 1;
let basePointX = 5;
let basePointOrder = 73;

/**
 * @typedef Point {{x: Number, y: Number}}
 */

// for testing
function setCurveParams(a, b, px) {
    curveA = a;
    curveB = b;
    basePointX = px;
    return !!Y(basePointX);
}

/**
 * Return the base point
 * @return {Point}
 */
function P() {
    return {x: basePointX, y: Math.min(...Y(basePointX))};
}

/**
 * For the given X coordinate, find Y values (if any) on the curve.
 * @param x {Number} X coordinate in range 0...p
 * @return {Number[2]|undefined} the two Y coordinates for X, if defined for the curve
 */
function Y(x) {
    let YY = field.pow(x, 3) + curveA * x + curveB;
    try {
        return field.sqrt(field.reduce(YY));
    } catch (e) {
        return undefined;
    }
}

/**
 * For the given point, double it on the curve.
 *
 * @param P {Point} the point to double
 * @return {Point} the result
 */
function pointDouble(P) {
    return pointAdd(P, P);
}

/**
 * Add two points on the curve to get a third point.
 *
 * @param P
 * @param Q
 * @return {Point} R = P + Q
 */
function pointAdd(P, Q) {
    if (!P) return Q;
    if (!Q) return P;
    if (P.x === Q.x && P.y !== Q.y) return null;
    const m = slope(P, Q);
    let x = field.reduce(field.pow(m, 2) - P.x - Q.x);
    let y = field.reduce(m * (P.x - x) - P.y);
    if (Object.is(x, -0)) x = 0;
    if (Object.is(y, -0)) y = 0;
    return {x, y};
}

/**
 * Scalar multiplication of a point P on a curve via double-and-add method.
 *
 * @param P {Point} point
 * @param n {Number} scalar
 * @return {Point|null} result nP
 */
function pointMult(P, n) {
    const bits = Math.floor(Math.log2(n));
    const doubledPoints = {};
    doubledPoints[0] = P;
    for (let i = 1; i <= bits; i++) {
        P = pointDouble(P);
        doubledPoints[i] = P;
    }

    let result = null;
    let bit = 0;
    while (n !== 0) {
        if ((n & 1) === 1) {
            result = pointAdd(result, doubledPoints[bit]);
        }
        n >>= 1;
        bit++;
    }

    return result;
}

/**
 * Negate the point P to -P
 * (really this is just mirroring it on y=field.p/2)
 *
 * @param P {Point}
 * @return {Point} -P
 */
function negate(P) {
    return { x: P.x, y: field.negate(P.y) };
}

/**
 * Compute the slope between two points (or the tangent if both points are same).
 * @param P {Point}
 * @param Q {Point}
 * @return {Number}
 */
function slope(P, Q) {
    if (P.x === Q.x && P.y === Q.y) {
        return field.reduce((3 * field.pow(P.x, 2) + curveA) * field.inverseOf(2 * P.y));
    } else {
        return field.reduce((Q.y - P.y) * field.inverseOf(Q.x - P.x));
    }
}

/**
 * Calculate the slope tangent at point P.
 *
 * @param P {Point} point on the curve
 */
function tangent(P) {
    return slope(P, P);
}

export {
    setCurveParams,
    basePointOrder,
    P,
    Y,
    pointDouble,
    pointAdd,
    pointMult,
    negate,
    tangent,
};
