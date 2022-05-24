/**
 * Operations of curve25519
 *
 * Curve25519 is the Montgomery curve y^2 = x^3 + 486662x^2 + x
 * in the field Fp where p = 2^255-19.
 *
 * All points are in the "compressed" form where only the x-value
 * is given (notated "X"), and often in the intermediate ratio form
 * (notated "x" and "z" such that X := x/z).
 *
 * Base point of this curve has X = 9.
 */

/**
 * @typedef BigPoint {{x: BigInt, y: BigInt}}
 */

import { inverseOf, pow, reduce, sqrt } from './field.js';

const curveB = 1n;
const curveA = 486662n;
const basePointX = 9n;

/**
 * Add point P to point Q to yield next point R.
 * @param P {BigPoint}
 * @param Q {BigPoint}
 * @return {BigPoint} R such that P + Q = -R
 */
function add(P, Q) {
    let slope;
    if (P.x === Q.x && P.y === Q.y) {
        slope = reduce(3n * pow(P.x, 2n) + 2n * curveA * P.x + 1n) *
            inverseOf(reduce(2n * curveB * P.y));
    } else {
        slope = reduce(reduce(Q.y + (-P.y)) * inverseOf(reduce(Q.x + (-P.x))));
    }
    const x = reduce(curveB * pow(slope, 2n) - curveA - P.x - Q.x);
    const ya = reduce(2n * P.x + Q.x + curveA);
    const y = reduce(ya * slope - curveB * pow(slope, 3n) - P.y);
    return {x, y};
}

/**
 * For the given X coordinate, find Y on the curve.
 * @param X {BigInt} X coordinate in range 0..2**255-19-1
 * @return {BigInt[2]} the two Y coordinates for X
 * @throw {RangeError} X is not a valid coordinate on the curve (true for half of all inputs)
 */
function Y(X) {
    let YY = pow(X, 3n) + curveA * pow(X, 2n) + X;
    return sqrt(reduce(YY));
}

/**
 * Return the base point.
 * @return {BigPoint}
 */
function P() {
    const y = Y(basePointX);
    return { x: basePointX, y: y[1] };
}

export {
    P,
    add,
};
