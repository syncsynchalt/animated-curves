import * as field from './field.js';
import * as curve from './curve.js';

const primes = [61, 67, 71, 73, 79, 83, 89, 97];
primes.forEach((p) => {
    field.setP(p);
    for (let A = 6; A < 500; A += 4) {
        curve.setCurveA(A);
        const bases = [];
        for (let b = 2; b < 256; b += 1) {
            bases.push(b);
        }
        bases.forEach((base) => {
            let y = curve.Y(base);
            if (!y) {
                console.log(`!no-c! p=${p} A=${A} base=${base}`);
                return;
            }
            let n = 1;
            let order = 0;
            for (n; n < (field.p); n++) {
                let x;
                try {
                    x = curve.xLadderMult(base, n);
                } catch (e) {
                    console.log(`!thro! p=${p} A=${A} base=${base} n=${n}`);
                    return;
                }
                if (!x) {
                    console.log(`!zero! p=${p} A=${A} base=${base} n=${n}`);
                    return;
                }
                if (!curve.Y(x)) {
                    console.log(`!no-y! p=${p} A=${A} base=${base} n=${n}`);
                    return;
                }
                if (x === base) {
                    order = n;
                    let ratio = (order/p).toPrecision(3);
                    console.log(`!loop! ratio=${ratio} p=${p} A=${A} base=${base} Y=${curve.Y(x)} order=${order}`);
                }
            }
            console.log(`!DONE! p=${p} A=${A} base=${base} order=${order}`);
        });
    }
});
