const p = 23;

function reduce(x) {
    x %= p;
    if (x < 0) {
        x += p;
    }
    return x;
}

const inverses = [];
/**
 * Return the multiplicative inverse in Fp
 * (computed via brute force)
 * @param n {Number}
 * @return {Number} the inverse n_inv such that n*n_inv % p = 1
 */
function inverseOf(n) {
    if (inverses.length === 0) {
        inverses.push(Infinity);
        for (let i = 1; i < p; i++) {
            for (let j = 1; j < p; j++) {
                if (reduce(i*j) === 1) {
                    inverses.push(j);
                    break;
                }
            }
        }
        if (inverses.length !== p) {
            throw RangeError(`Couldn't compute inverses for ${p}`);
        }
    }
    return inverses[reduce(n)];
}

const sqrts = [];
/**
 * Return the square root (if any) in Fp
 * (computed via brute force)
 * @param n {Number}
 * @return {Number[2]|undefined} the pair of square roots [s1, s2] (if any) such that s*s = n
 */
function sqrt(n) {
    if (sqrts.length === 0) {
        sqrts.push([0, 0]);
        for (let i = 1; i < p; i++) {
            const solutions = [];
            for (let j = 1; j < p; j++) {
                if (reduce(j*j) === i) {
                    solutions.push(j);
                }
            }
            if (solutions.length === 2) {
                sqrts.push(solutions);
            } else {
                sqrts.push(undefined);
            }
        }
        if (sqrts.length !== p) {
            throw RangeError(`Couldn't compute inverses for ${p}`);
        }
    }
    return sqrts[reduce(n)];
}

export {
    p,
    reduce,
    inverseOf,
    sqrt,
};
