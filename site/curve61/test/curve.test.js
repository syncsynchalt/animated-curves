import * as curve from '../curve.js';
import * as field from '../field.js';
import * as chai from 'chai';

let expect = chai.expect;

describe('curve library', () => {

    /**
     * @param n {Number}
     * @return {Number[n]} Array of numbers 1...n
     */
    let range = (n) => {
        return Array.from({length: n}, (_, i) => {return i+1});
    };

    it('comes back to the same point (has order)', () => {
        for (let n = 1; n <= field.p*2; n++) {
            let Q = curve.pointMult(curve.P(), n);
            if (Q && Q.x === curve.P().x && Q.y === curve.P().y) {
                if (n !== 1) {
                    console.log(`Detected order of ${n}`);
                }
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
        checks.forEach(n => {
            const addP = viaAdd(baseP, n);
            const multP = curve.pointMult(baseP, n);
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

    it('has working key exchange', () => {
        const cKeys = range(100);
        const sKeys = range(100);
        let results = {};
        cKeys.forEach(cKey => {
            sKeys.forEach(sKey => {
                let cPubKey = curve.pointMult(curve.P(), cKey);
                let sPubKey = curve.pointMult(curve.P(), sKey);
                let chk1 = curve.pointMult(cPubKey, sKey);
                let chk2 = curve.pointMult(sPubKey, cKey);
                expect(chk1).to.eql(chk2, `cKey:${cKey} sKey:${sKey}`);
                results[chk1] = results[chk1] || 0;
                results[chk1]++;
            });
        });
        console.log(`landed on ${Object.keys(results).length} X values`);
    });

    it('calculates the correct result', () => {
        const P = {x: 5, y: 7};
        const P23 = {x: 2, y: 24};
        const Q = curve.pointAdd(P, P23);
        expect(Q.x).to.equal(59);
        expect(Q.y).to.equal(55);

        const P24 = curve.pointMult(P, 24);
        expect(P24.x).to.equal(Q.x);
        expect(P24.y).to.equal(Q.y);
    });
});
