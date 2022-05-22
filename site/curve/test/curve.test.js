import * as curve from '../curve.js';
import * as field from '../field.js';
import * as chai from 'chai';

let expect = chai.expect;

describe('curve library', () => {

    let range = (n) => {
        return Array.from({length: n}, (_, i) => {return i+1});
    };

    /**
     * Calculate the x/z of point nP via add1 construction
     * @param baseX {Number}
     * @param n {Number}
     * @return {{x: Number, z: Number}}
     */
    let calcViaAdd1 = (baseX, n) => {
        let [ prev_x, prev_z ] = [ curve.P().x, 1 ]; // 1P
        let { x, z } = curve.xDouble(prev_x, prev_z);  // 2P
        if (n === 1) return { x: prev_x, z: prev_z };

        let next_x = 0, next_z = 0;
        for (let i = 0; i < n - 2; i++) {
            ({ x: next_x, z: next_z } = curve.xAdd1(x, z, prev_x, prev_z));
            [prev_x, prev_z] = [x, z];
            [x, z] = [next_x, next_z];
        }
        return { x, z };
    };

    it('can match add1 to result via doubling', () => {
        for (let exp = 0; exp < 6; exp++) {
            let n = 2 ** exp;
            let nPad = `000${n}`.slice(-3);

            // get {2^exp}P via doubling
            let [x, z] = [curve.P().x, 1];
            for (let i = 0; i < exp; i++) {
                ({x, z} = curve.xDouble(x, z));
            }
            let viaDoubling = curve.X(x, z);

            // get {2^exp}P via add1
            ({x, z} = calcViaAdd1(curve.P().x, n));
            let viaAdd1 = curve.X(x, z);

            // compare them
            expect(field.toHex(viaDoubling, 9))
                .to.equal(field.toHex(viaAdd1, 9), `${nPad}P`);
            expect(viaDoubling).to.equal(viaAdd1, `${nPad}P`);
        }
    });

    it('should have working scalar multiplication (compare to add1)', () => {
        let runTest = (n, msg) => {
            let X = curve.xLadderMult(curve.P().x, n);
            let chkX = X;
            let {x, z} = calcViaAdd1(curve.P().x, n);
            X = curve.X(x, z);
            let expX = X;

            expect(chkX).to.equal(expX, msg);
        };
        runTest(3, `${3}P`);
        for (let n = 1; n <= 32; n++) {
            runTest(n, `${n}P`);
        }
    });

    it('should have working scalar multiplication (compare to doubling)', () => {
        let runTest = (exp, msg) => {
            let [x, z] = [curve.P().x, 1];
            for (let i = 0; i < exp; i++) {
                ({x, z} = curve.xDouble(x, z));
            }
            let expX = curve.X(x, z);
            let chkX = curve.xLadderMult(curve.P().x, 2 ** exp);
            expect(chkX).to.equal(expX, msg);
        };
        for (let exp = 0; exp <= 5; exp++) {
            runTest(exp, `${2**exp}P`);
        }
    });

    it('has working key exchange', () => {
        const cKeys = range(100);
        const sKeys = range(100);
        let results = {};
        cKeys.forEach((cKey) => {
            sKeys.forEach((sKey) => {
                let cPubKey = curve.xLadderMult(curve.P().x, cKey);
                let sPubKey = curve.xLadderMult(curve.P().x, sKey);
                const chk1 = curve.xLadderMult(cPubKey, sKey);
                const chk2 = curve.xLadderMult(sPubKey, cKey);
                expect(chk1).to.equal(chk2, `cKey:${cKey} sKey:${sKey}`);
                results[chk1] = results[chk1] || 0;
                results[chk1]++;
            });
        });
        console.log(`landed on ${Object.keys(results).length} X values`);
    });

    it('comes back to the same point in ladder', () => {
        let origY = curve.Y(curve.P().x);
        for (let n = 1; n < 256; n++) {
            let X = curve.xLadderMult(curve.P().x, n);
            let Y = (X === 0 ? [0, 0] : curve.Y(X));
            expect(Y).to.not.be.undefined;
            if (X === curve.P().x) {
                if (n !== 1) {
                    console.log(`Detected order of ${n}`);
                }
                expect(Y).to.eql(origY);
            }
        }
    });

    it('adds', () => {
        let p1 = curve.P();
        console.log(`1P: ${JSON.stringify(p1)}`);
        let p = {...p1};
        for (let n = 2; n <= 100; n++) {
            let newP = curve.pointAdd(p, p1);
            let pchk = curve.pointAdd(p1, p);
            expect(newP).to.eql(pchk);
            p = newP;
            console.log(`${n}P: ${JSON.stringify(p)}`);
        }
    });

    it('doubles', () => {
        let p = curve.P();
        console.log(`1P: ${JSON.stringify(p)}`);
        for (let n = 2; n <= 64; n *= 2) {
            p = curve.pointDouble(p);
            console.log(`${n}P: ${JSON.stringify(p)}`);
        }
    });

    it('adds and doubles the same', () => {
        let a1p = curve.P();
        let a2p = curve.pointAdd(a1p, a1p);
        let a3p = curve.pointAdd(a1p, a2p);
        let a5p = curve.pointAdd(a3p, a2p);
        let a6p = curve.pointAdd(a1p, a5p);
        let a11p = curve.pointAdd(a5p, a6p);
        let a12p = curve.pointAdd(a11p, a1p);

        let d2p = curve.pointDouble(a1p);
        let d6p = curve.pointDouble(a3p);
        let d12p = curve.pointDouble(a6p);

        expect(d2p).to.eql(a2p);
        expect(d6p).to.eql(a6p);
        expect(d12p).to.eql(a12p);
    });

    it('scalar multiplies points via double-and-add', () => {
        let baseP = curve.P();
        let viaAdd = (base, n) => {
            let p = {...base};
            for (let i = 1; i < n; i++) {
                p = curve.pointAdd(p, base);
            }
            return p;
        };

        const checks = range(100);
        checks.forEach((n) => {
            let addP = viaAdd(baseP, n);
            let multP = curve.pointMult(baseP, n);
            expect(multP).to.eql(addP, `failed at n=${n}`);
        });
    });

    it('comes back to the same point in point mult', () => {
        let base = curve.P();
        for (let n = 1; n < 256; n++) {
            let p = curve.pointMult(base, n);
            if (p && p.x === base.x && p.y === base.y) {
                if (n !== 1) {
                    console.log(`Detected order of ${n}`);
                }
            }
        }
    });

    it('comes back to the same point in point add', () => {
        let base = curve.P();
        let p = undefined;
        for (let n = 1; n < 256; n++) {
            p = curve.pointAdd(base, p);
            if (p && p.x === base.x && p.y === base.y) {
                if (n !== 1) {
                    console.log(`Detected order of ${n}`);
                }
            }
        }
    });
});
