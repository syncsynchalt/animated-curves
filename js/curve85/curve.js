/**
 * Operations of curve85
 *
 * Curve85 is the Montgomery curve y^2 = x^3 + 76x^2 + x
 * in the field Fp where p = 2^8-5 (251).
 */

import * as field from './field.js';

let curveA = 14;
const basePointX = 7;

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
function pointDouble(x, z) {
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
function pointAdd1(x, z, prevX, prevZ) {
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
function pointMult(X_, n) {
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
        return field.sqrt(YY % field.p);
    } catch (e) {
        return undefined;
    }
}

function setCurveA(A) {
    curveA = A;
}

export {
    curveA,
    setCurveA,
    basePointX,
    X,
    Y,
    pointDouble,
    pointAdd1,
    pointMult
};
