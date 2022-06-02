/**
 * Math library over the field Fp where p = 251
 */

let p = 61;

/**
 * Returns a three-tuple (gcd, x, y) such that
 * a * x + b * y == gcd, where gcd is the greatest
 * common divisor of a and b.
 *
 * This function implements the extended Euclidean
 * algorithm and runs in O(log b) in the worst case.
 *
 * @param {Number} a
 * @param {Number} b
 * @returns {{gcd: Number, x: Number, y: Number}} containing GCD and x,y such that a*x + b*y == gcd
 */
function extended_euclidean_algorithm(a, b) {
    let s = 0, old_s = 1;
    let t = 1, old_t = 0;
    let r = b, old_r = a;
    let tmp = undefined;

    while (r !== 0) {
        let quotient = Math.floor(old_r / r);

        tmp = old_r - (quotient * r);
        old_r = r;
        r = tmp;
        tmp = old_s - (quotient * s);
        old_s = s;
        s = tmp;
        tmp = old_t - (quotient * t);
        old_t = t;
        t = tmp;
    }
    return {
        gcd: old_r,
        x: old_s,
        y: old_t
    };
}


/**
 * @param {Number} n
 * @return {Number}
 */
function square(n) {
    return n * n;
}


/**
 * Reduce a number to modulo p (into the positive range of this field).
 * @param {Number} n
 * @return {Number} result
 */
function reduce(n) {
    n %= p;
    if (n < 0) {
        n += p;
    }
    return n;
}

/**
 * Returns the multiplicative inverse of n modulo p.
 *
 * @param {Number} n
 * @returns {Number} m such that (n * m) % p == 1.
 */
function inverseOf(n) {
    if (n === 0) {
        throw Error('Illegal argument zero');
    }
    // noinspection JSUnusedLocalSymbols
    let { _gcd, x, _y } = extended_euclidean_algorithm(n, p);
    return reduce(x);
}


/**
 * Negate the number such that n + -n = 0
 * @param n {Number}
 * @return {Number} -n in field
 */
function negate(n) {
    return reduce(p - n);
}

/**
 * "By factoring out powers of 2, find Q and S such that p−1 = Q*2^S with Q odd"
 * @returns {Number[2]} array of [Q, S]
 */
let shanksPartitions = (prime) => {
    let Q = prime - 1;
    let S = 0;

    while (Q !== 0 && Q % 2 === 0) {
        Q >>= 1;
        S += 1;
    }
    if (!Q) {
        throw Error('Unexpected failure to factor out Shanks partitions');
    }
    return [Q, S];
};

/**
 * Modular exponentiation - find n^e mod p efficiently.
 * @param n {Number} number
 * @param e {Number} exponent
 * @return {Number} n**e mod p
 */
function pow(n, e) {
    if (e === 0) {
        return 1;
    }
    // result = x * y**e, keep this true while reducing y and e
    let x = 1;
    let y = n;
    for (;;) {
        if (e === 1) {
            return x * y % p;
        } else if (e % 2 === 1) {
            e -= 1;
            x = x * y % p;
        } else {
            e >>= 1;
            y = y**2 % p;
        }
    }
}

/**
 * Use Euler's Criterion to test whether n has valid roots in Fp.
 * @param n {Number} number to be tested
 * @returns {boolean} true if n is a square in Fp
 */
const pHalf = Math.floor((p-1)/2);
let eulersCriterion = (n) => {
    return pow(n, pHalf) === 1;
};

/**
 * Given one root in Fp, derive and return the pair.
 * @param r {Number} one root in Fp
 * @returns {Number[2]} pair of roots [r,-r] mod p
 */
let rootsFor = (r) => {
    let rt = [r, p-r];
    return rt.sort((a, b) => { return a - b });
};

/**
 * Find the square roots of n in Fp, if any.
 *
 * @param n {Number}
 * @throws {RangeError} if n has no roots in Fp
 * @return {Number[2] | undefined} the two square roots of n, if they exist
 */
function sqrt(n) {
    if (n === 0) {
        return [0, 0];
    }
    if (!eulersCriterion(n)) {
        return undefined;
    }

    // Tonelli–Shanks algorithm
    let [Q, S] = shanksPartitions(p);

    // find a z which is not a square
    let z;
    for (z = 2; z < p; z++) {
        if (!eulersCriterion(z)) {
            break;
        }
    }

    let M = S;
    let c = pow(z, Q);
    let t = pow(n, Q);
    let R = pow(n, Math.floor((Q+1)/2));
    for (;;) {
        if (t === 0) {
            return rootsFor(0);
        }
        if (t === 1) {
            return rootsFor(R);
        }
        // use repeated squaring to find the least i, 0 < i < M, such that t^{2^i} = 1 mod p
        let i = 1;
        for (; i < M; i++) {
            let chk = pow(t, (2**i));
            if (chk === 1) {
                break;
            }
        }
        // let b = c**(2**(M-i-1));
        let b = pow(c, pow(2, M-i-1));
        M = i;
        let bb = b * b;
        c = bb % p;
        t = t * bb % p;
        R = R * b % p;
    }
}

/**
 * Return the bignum as a hex string, padded with zeros.
 * @param {Number} a
 * @param {Number=} bits number of bits output to zero-pad to (rounded up to next 8-bit val)
 * @return {string}
 */
function toHex(a, bits) {
    bits = Number(bits || 0);
    let nibbles = 2 * Math.floor((bits+7)/8);
    let result = a.toString(16);
    if (result.length < nibbles) {
        result = '0'.repeat(nibbles-result.length) + result;
    }
    return result;
}

function setP(p_) {
    p = p_;
}

export {
    setP,
    square,
    reduce,
    inverseOf,
    negate,
    pow,
    sqrt,
    toHex,
    p
};
