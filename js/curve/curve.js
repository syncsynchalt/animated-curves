/**
 * Operations of curve
 *
 * Curve85 is the Montgomery curve y^2 = x^3 + 76x^2 + x
 * in the field Fp where p = 2^8-5 (251).
 */

import * as field from './field.js';

// subgroup order of 36
let curveA = 38;
const basePointX = 7;

/**
 * @typedef Point {{x: Number, y: Number}}
 */

/**
 * Return the base point
 */
function P() {
    return {x: basePointX, y: Y(basePointX)[1]};
}

/**
 * Given intermediate ratio x/z for a point, compute X=(x/z)
 * @param {Number} x
 * @param {Number} z
 * @return {Number} X = x/z
 */
function X(x, z) {
    // if (z === 0) {
    //     return 0;
    // }
    return field.reduce(x * field.inverseOf(z));
}

const doubleA24 = Math.floor((curveA + 2) / 4);
/**
 * Double the point P at X=x/z
 *
 *     X_{2n} = (X_n+Z_n)^2(X_n-Z_n)^2
 *     Z_{2n} = (4X_nZ_n)((X_n-Z_n)^2+((A+2)/4)(4X_nZ_n))
 *
 * @param x {Number} from intermediate ratio form of X=x/z for point P
 * @param z {Number} from intermediate ratio form of X=x/z for point P
 * @return {{x: Number, z: Number}} x/z for point 2P
 */
function xDouble(x, z) {
    let x2_1 = (x + z) * (x + z);
    let x2_2 = (x - z) * (x - z);
    let x2 = field.reduce(x2_1 * x2_2);
    let z2_1 = field.reduce(4 * x * z);
    let z2_2 = field.reduce(x - z) * field.reduce(x - z);
    let z2_3 = doubleA24 * z2_1;
    let z2_23 = z2_2 + z2_3;
    let z2 = z2_1 * z2_23;
    return { x: field.reduce(x2), z: field.reduce(z2) };
}

/**
 * Given X coordinates for nP and (n-1)P, calculate for (n+1)P
 *
 *    X_{n+1} = Z_{n-1}((X_n-Z_n)(X_1+Z_1)+(X_n+Z_n)(X_1-Z_1))^2
 *    Z_{n+1} = X_{n-1}((X_n-Z_n)(X_1+Z_1)-(X_n+Z_n)(X_1-Z_1))^2
 *
 * @param x {Number} X coordinate of current point n, in intermediate x/z form.
 * @param z {Number} X coordinate of current point n, in intermediate x/z form.
 * @param prevX {Number} X coordinate of point n-1, in intermediate x/z form.
 * @param prevZ {Number} X coordinate of point n-1, in intermediate x/z form.
 * @returns {{x: Number, z: Number}} the X coordinate of point n+1, in intermediate x/z form.
 */
function xAdd1(x, z, prevX, prevZ) {
    let [ baseX, baseZ ] = [ basePointX, 1 ];
    let xa = (x - z) * (baseX + baseZ);
    let xb = (x + z) * (baseX - baseZ);
    let xc = field.square(xa + xb);
    let x_nplus1 = prevZ * xc;

    let zc = field.square(xa - xb);
    let z_nplus1 = prevX * zc;

    return { x: field.reduce(x_nplus1), z: field.reduce(z_nplus1) };
}


/**
 * Conditional swap of two values.
 *
 * @param swap {Boolean} whether to swap
 * @param a {Number}
 * @param b {Number}
 * @returns {[Number, Number]} the values a and b, swapped if needed.
 */
let cswap = (swap, a, b) => {
    return swap ? [b, a] : [a, b];
};

const multA24 = Math.floor((curveA - 2) / 4);
const multBits = Math.ceil(Math.log2(field.p));
/**
 * Scalar multiplication of a point
 *
 * Given an X-coordinate for point P, "point add" it to itself n times to yield x/z for nP.
 * Adapted from RFC7748.
 *
 * @param X_ {Number} X-coordinate for point P
 * @param n {Number} multiplicand
 * @return {Number} X-Coordinate for point nP
 */
function xLadderMult(X_, n) {
    let x_1 = X_;
    let x_2 = 1;
    let z_2 = 0;
    let x_3 = X_;
    let z_3 = 1;
    let swap = 0;

    for (let t = multBits-1; t >= 0; t--) {
        let k_t = (n >> t) & 1;
        swap ^= (k_t !== 0 ? 1 : 0);
        [x_2, x_3] = cswap(!!swap, x_2, x_3);
        [z_2, z_3] = cswap(!!swap, z_2, z_3);
        swap = k_t !== 0 ? 1 : 0;

        let A = field.reduce(x_2 + z_2);
        let AA = field.reduce(field.square(A));
        let B = field.reduce(x_2 - z_2);
        let BB = field.reduce(field.square(B));
        let E = field.reduce(AA - BB);
        let C = field.reduce(x_3 + z_3);
        let D = field.reduce(x_3 - z_3);
        let DA = field.reduce(D * A);
        let CB = field.reduce(C * B);
        x_3 = field.reduce((DA + CB) * (DA + CB));
        z_3 = field.reduce(x_1 * (DA - CB) * (DA - CB));
        x_2 = field.reduce(AA * BB);
        z_2 = field.reduce(E * (AA + multA24 * E));
    }
    let _rest;
    [x_2, ..._rest] = cswap(!!swap, x_2, x_3);
    [z_2, ..._rest] = cswap(!!swap, z_2, z_3);
    // return z_2 === 0 ? 0 : X(x_2, z_2);
    return field.reduce(x_2 * field.pow(z_2, field.p-2));
}


/**
 * For the given X coordinate, find Y on the curve.
 * @param X {Number} X coordinate in range 0...p
 * @return {Number[2] | undefined} the two Y coordinates for X, if defined for the curve
 */
function Y(X) {
    let YY = field.pow(X, 3) + curveA * field.pow(X, 2) + X;
    try {
        return field.sqrt(field.reduce(YY));
    } catch (e) {
        return undefined;
    }
}

/**
 * For the given point, double it on the curve.
 *
 * See https://en.wikipedia.org/wiki/Montgomery_curve#Doubling
 *
 * @param p {Point} the point to double
 * @return {Point} the result
 */
function pointDouble(p) {
    let slopeN = field.reduce(3 * field.pow(p.x, 2) + 2 * curveA * p.x + 1);
    let slopeD = 2 * p.y;
    let slope = field.reduce(slopeN * field.inverseOf(slopeD));

    let x = field.reduce(field.pow(slope, 2) - curveA - p.x - p.x);
    let ya = 2 * p.x + p.x + curveA;
    let yb = field.reduce(ya * slope);
    let yc = field.pow(slope, 3);
    let y = field.reduce(yb - yc - p.y);

    return {x, y};
}

/**
 * Add two points on the curve to get a third point.
 *
 * See https://en.wikipedia.org/wiki/Montgomery_curve#Doubling
 *
 * @param p1
 * @param p2
 * @return {Point} p3 = p1 + p2
 */
function pointAdd(p1, p2) {
    if (!p1) return p2;
    if (!p2) return p1;
    if (p1.x === p2.x && p1.y === p2.y) {
        return pointDouble(p1);
    }
    if (p1.x === p2.x) {
        return undefined;
    }

    let xa = field.pow(p2.y - p1.y, 2);
    let xb = field.pow(p2.x - p1.x, 2);
    let x = field.reduce(xa * field.inverseOf(xb) - curveA - p1.x - p2.x);
    let ya = field.reduce((2*p1.x + p2.x + curveA) * (p2.y - p1.y));
    let yb = field.reduce(p2.x - p1.x);
    let yc = field.reduce(ya * field.inverseOf(yb));
    let yd = field.reduce(field.pow(p2.y - p1.y, 3));
    let ye = field.reduce(field.pow(p2.x - p1.x, 3));
    let yf = yd * field.inverseOf(ye);
    let y = field.reduce(yc - yf - p1.y);

    return {x, y};
}

/**
 * Scalar multiplication of a point P on a curve via double-and-add method.
 *
 * @param p {Point} point
 * @param n {Number} scalar
 * @return {Point} result nP
 */
function pointMult(p, n) {
    const bits = Math.floor(Math.log2(n));
    const doubledPoints = {};
    doubledPoints[0] = p;
    for (let i = 1; i <= bits; i++) {
        p = pointDouble(p);
        doubledPoints[i] = p;
    }

    let result = undefined;
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
 * Calculate the slope tangent at point P.
 *
 * @param P {Point} point on the curve
 */
function tangent(P) {
    return field.reduce((3 * P.x * P.x + 2 * curveA * P.x + 1) * field.inverseOf(2 * P.y));
}

export {
    P,
    X,
    Y,
    xDouble,
    xAdd1,
    xLadderMult,
    pointDouble,
    pointAdd,
    pointMult,
    negate,
    tangent,
};
