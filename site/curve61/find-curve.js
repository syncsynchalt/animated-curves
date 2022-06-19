import * as field from './field.js?bustin=1655597213';
import * as curve from './curve.js?bustin=1655597213';

const primeOrders = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37,
    41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107,
    109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179,
    181, 191, 193, 197, 199];

const primes = [61];
primes.forEach(prime => {
    field.setP(prime);
    for (let A = 1; A <= 10; A++) {
        for (let B = 1; B <= 20; B++) {
            for (let PX = 1; PX <= 10; PX++) {
                if (field.reduce(4 * field.pow(A, 3) + 27 * field.pow(B, 2)) === 0) {
                    console.log(`!bad-curve! p=${prime} A=${A} B=${B} PX=${PX}`);
                }
                if (!curve.setCurveParams(A, B, PX)) {
                    console.log(`!no-params! p=${prime} A=${A} B=${B} PX=${PX}`);
                    continue;
                }

                const base = curve.P();
                let n = 2;
                let order = 0;
                for (n; n < field.p * 3; n++) {
                    let p;
                    try {
                        p = curve.pointMult(base, n);
                    } catch (e) {
                        console.log(`!thro! A=${A} B=${B} PX=${PX} n=${n}`);
                        continue;
                    }
                    if (!p) {
                        console.log(`!zero! A=${A} B=${B} PX=${PX} n=${n}`);
                        continue;
                    }
                    if (p.x === base.x && p.y === base.y) {
                        order = n-1;
                        let ratio = (order/field.p).toPrecision(3);
                        console.log(`!loop! ratio=${ratio} A=${A} B=${B} PX=${PX} order=${order}`);
                        break;
                    }
                }
                if (order >= field.p) {
                    console.log(`!DONE! p=${field.p} A=${A} B=${B} PX=${PX} order=${order}`);
                    if (primeOrders.includes(order)) {
                        console.log(`{p: ${field.p}, A: ${A}, B: ${B}, PX: ${PX}, order: ${order}}, // CANDIDATE`);
                    }
                }
            }
        }
    }
});
