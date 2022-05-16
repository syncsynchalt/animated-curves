import * as curve from '../curve.js';
import * as field from '../field.js';
import * as chai from 'chai';

let expect = chai.expect;

describe('curve library', () => {

    // xxx more
    it('find good coverage in y', () => {
        const r = {};
        for (let A = 6; A < 100; A += 4) {
            curve.setCurveA(A);
            const yVals = {};
            for (let x = 1; x < field.p; x++) {
                let y = curve.Y(x);
                if (y) {
                    yVals[y[0]] = x;
                    yVals[y[1]] = x;
                }
            }
            r[A] = Object.keys(yVals).length / (field.p-1);
        }
        let keys = Object.keys(r).sort((a, b) => { return r[b] - r[a] });
        keys.forEach((A) => {
            console.log(`A=${A} ratio=${r[A]}`);
        });
    });

    it('should have a base point with a decent order', () => {
        let f = (base) => {
            let y = curve.Y(base);
            if (!y) {
                // console.log(`${base} is not on curve`);
                return undefined;
            }
            let x = base;
            let n = 2;
            for (n; n < 300; n++) {
                x = curve.pointMult(base, n);
                if (!x) {
                    return undefined;
                }
                if (x === base) {
                    return n;
                }
            }
            return n;
        };
        const results = {};
        for (let b = 2; b < field.p; b++) {
            if (f(b)) {
                results[b] = f(b);
            }
        }
        let keys = Object.keys(results);
        console.log(`${keys.length} results`);
        keys = keys.sort((a, b) => { return results[b] - results[a] });
        keys = keys.filter((k) => { return results[k] > field.p / 4 });
        keys.forEach((k) => {
            console.log(`${k} has order ${results[k]}`);
        });
    });

    /**
     * Calculate the x/z of point nP via add1 construction
     * @param baseX {Number}
     * @param n {Number}
     * @return {{x: Number, z: Number}}
     */
    let calcViaAdd1 = (baseX, n) => {
        let [ prev_x, prev_z ] = [ curve.basePointX, 1 ]; // 1P
        let { x, z } = curve.pointDouble(prev_x, prev_z);  // 2P
        if (n === 1) return { x: prev_x, z: prev_z };

        let next_x = 0, next_z = 0;
        for (let i = 0; i < n - 2; i++) {
            ({ x: next_x, z: next_z } = curve.pointAdd1(x, z, prev_x, prev_z));
            [prev_x, prev_z] = [x, z];
            // next_x = curve85.X(next_x, next_z);
            // next_z = 1;
            [x, z] = [next_x, next_z];
        }
        return { x, z };
    };

    it('can match add1 to result via doubling', () => {
        for (let exp = 0; exp < 8; exp++) {
            let n = 2 ** exp;
            let nPad = `000${n}`.slice(-3);

            // get {2^exp}P via doubling
            let [x, z] = [curve.basePointX, 1];
            for (let i = 0; i < exp; i++) {
                ({x, z} = curve.pointDouble(x, z));
            }
            let viaDoubling = curve.X(x, z);
            console.log(`${nPad}P via 2x is ${field.toHex(viaDoubling, 9)}`);

            // get {2^exp}P via add1
            ({x, z} = calcViaAdd1(curve.basePointX, n));
            let viaAdd1 = curve.X(x, z);
            console.log(`${nPad}P via +1 is ${field.toHex(viaAdd1, 9)}`);

            // compare them
            expect(field.toHex(viaDoubling, 9))
                .to.equal(field.toHex(viaAdd1, 9), `${nPad}P`);
            expect(viaDoubling).to.equal(viaAdd1, `${nPad}P`);
        }
    });

    it('should have working scalar multiplication (compare to add1)', () => {
        let runTest = (n, msg) => {
            let X = curve.pointMult(curve.basePointX, n);
            console.log(`mult n:${n} X:${X}`);
            let chkX = X;
            let {x, z} = calcViaAdd1(curve.basePointX, n);
            X = curve.X(x, z);
            console.log(`add1 n:${n} X:${X}`);
            let expX = X;

            expect(chkX).to.equal(expX, msg);
        };
        runTest(3, `${3}P`);
        for (let n = 1; n <= 256; n++) {
            runTest(n, `${n}P`);
        }
    });

    it('should have working scalar multiplication (compare to doubling)', () => {
        let runTest = (exp, msg) => {
            let [x, z] = [curve.basePointX, 1];
            for (let i = 0; i < exp; i++) {
                ({x, z} = curve.pointDouble(x, z));
            }
            let expX = curve.X(x, z);
            let chkX = curve.pointMult(curve.basePointX, 2 ** exp);
            expect(chkX).to.equal(expX, msg);
        };
        for (let exp = 0; exp <= 8; exp++) {
            runTest(exp, `${2**exp}P`);
        }
    });

    it('has working key exchange', () => {
        const cKeys = Array.from({length: 100}, (_, i) => {return i+1});
        const sKeys = Array.from({length: 100}, (_, i) => {return i+1});
        let results = {};
        cKeys.forEach((cKey) => {
            sKeys.forEach((sKey) => {
                // console.log(`cKey:${cKey} sKey:${sKey}`);
                let cPubKey = curve.pointMult(curve.basePointX, cKey);
                let sPubKey = curve.pointMult(curve.basePointX, sKey);
                const chk1 = curve.pointMult(cPubKey, sKey);
                const chk2 = curve.pointMult(sPubKey, cKey);
                expect(chk1).to.equal(chk2);
                results[chk1] = results[chk1] || 0;
                results[chk1]++;
            });
        });
        console.log(`landed on ${Object.keys(results).length} X values`);
        console.log(`results: ${JSON.stringify(results, null, 2)}`);
    });

    it('comes back to the same point', () => {
        let origY = curve.Y(curve.basePointX);
        for (let n = 1; n < 256; n++) {
            let X = curve.pointMult(curve.basePointX, n);
            let Y = curve.Y(X);
            expect(Y).to.not.be.undefined;
            console.log(`n:${n} X:${X} Y1:${Y[0]} Y2:${Y[1]}`);
            if (X === curve.basePointX) {
                if (n !== 1) {
                    console.log(`Detected order of ${n}`);
                }
                expect(Y).to.eql(origY);
            }
        }
    });
});
