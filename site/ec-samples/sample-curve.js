/**
 * Return the y-vals (if any) for an x-coordinate of curve y^2 = x^3 + ax + b
 * @param x {Number}
 * @param a {Number}
 * @param b {Number}
 * @return {Number[2] | undefined} the two y vals for the given point, if any
 */
function yValPos(x, a, b) {
    const y = Math.sqrt(x**3 + a*x + b);
    if (!isNaN(y)) {
        return y;
    }
}

export {
    yValPos
};
