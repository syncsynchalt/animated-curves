import * as curve from './real-curve.js';

let range = (min, max, step) => {
    step = step || 1;
    let r = [];
    for (let i = min; i <= max; i += step) {
        i = Number(i.toFixed(1));
        r.push(i);
    }
    return r;
};

const xBound = 10;
const yBound = 20;
const aVals = range(-100, 100);
const bVals = range(-100, 100);
const points = range(-1, 10, 0.2);
aVals.forEach(a => {
    bVals.forEach(b => {
        points.forEach(p => {
            curve.setCurveParams(a, b, p);
            let P = curve.P();
            let Q = null;
            let points = [];
            let firstNeg;
            for (let n = 1; n <= 8; n++) {
                Q = curve.add(P, Q);
                if (Number.isNaN(Q)) {
                    return console.log(`a:${a} b:${b} p:${p} cycled at n:${n}`);
                }
                if (Q.y < 0 && !firstNeg) {
                    firstNeg = n;
                }
                points.push(Q);
                if (Q.x > xBound || Q.x < -xBound || Q.y > yBound || Q.y < -yBound) {
                    return console.log(`a:${a} b:${b} p:${p} out of bounds at n:${n}`);
                }
            }
            if (!firstNeg || firstNeg > 4) {
                return console.log(`a:${a} b:${b} p:${p} didn't flip until n:${firstNeg}`);
            }
            for (let chk = 0; chk < points.length; chk++) {
                for (let i = chk+1; i < points.length; i++) {
                    if (Math.abs(points[i].x - points[chk].x) < 0.5 &&
                        Math.abs(Math.abs(points[i].y) - Math.abs(points[chk].y)) < 0.5) {
                        return console.log(`a:${a} b:${b} p:${p} too close at i:${i}=chk:${chk}`);
                    }
                }
            }
            return console.log(`{a: ${a}, b: ${b}, p: ${p}}, // winner`);
        });
    });
});
