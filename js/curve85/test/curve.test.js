import * as curve from '../curve.js';
import * as field from '../field.js';
import * as chai from 'chai';

let expect = chai.expect;

describe('curve library', () => {

    // xxx more

    /**
     * Calculate the x/z of point nP via add1 construction
     * @param baseX {Number}
     * @param n {Number}
     * @return {{x: Number, z: Number}}
     */
    let calcViaAdd1 = (baseX, n) => {
        let [ prev_x, prev_z ] = [ curve.basePointX, 1 ]; // 1P
        let { x, z } = curve.xDouble(prev_x, prev_z);  // 2P
        if (n === 1) return { x: prev_x, z: prev_z };

        let next_x = 0, next_z = 0;
        for (let i = 0; i < n - 2; i++) {
            ({ x: next_x, z: next_z } = curve.xAdd1(x, z, prev_x, prev_z));
            [prev_x, prev_z] = [x, z];
            // next_x = curve85.X(next_x, next_z);
            // next_z = 1;
            [x, z] = [next_x, next_z];
        }
        return { x, z };
    };

    it('can match add1 to result via doubling', () => {
        for (let exp = 0; exp < 6; exp++) {
            let n = 2 ** exp;
            let nPad = `000${n}`.slice(-3);

            // get {2^exp}P via doubling
            let [x, z] = [curve.basePointX, 1];
            for (let i = 0; i < exp; i++) {
                ({x, z} = curve.xDouble(x, z));
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
            let X = curve.xLadderMult(curve.basePointX, n);
            console.log(`mult n:${n} X:${X}`);
            let chkX = X;
            let {x, z} = calcViaAdd1(curve.basePointX, n);
            X = curve.X(x, z);
            console.log(`add1 n:${n} X:${X}`);
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
            let [x, z] = [curve.basePointX, 1];
            for (let i = 0; i < exp; i++) {
                ({x, z} = curve.xDouble(x, z));
            }
            let expX = curve.X(x, z);
            let chkX = curve.xLadderMult(curve.basePointX, 2 ** exp);
            expect(chkX).to.equal(expX, msg);
        };
        for (let exp = 0; exp <= 5; exp++) {
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
                let cPubKey = curve.xLadderMult(curve.basePointX, cKey);
                let sPubKey = curve.xLadderMult(curve.basePointX, sKey);
                const chk1 = curve.xLadderMult(cPubKey, sKey);
                const chk2 = curve.xLadderMult(sPubKey, cKey);
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
            let X = curve.xLadderMult(curve.basePointX, n);
            let Y = (X === 0 ? [0, 0] : curve.Y(X));
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

    it('adds', () => {
        let p1 = {x: curve.basePointX, y: curve.Y(curve.basePointX)[0]};
        console.log(`1P: ${JSON.stringify(p1)}`);
        let p = {...p1};
        for (let n = 2; n <= 34; n++) {
            let newP = curve.pointAdd(p, p1);
            let pchk = curve.pointAdd(p1, p);
            expect(newP).to.eql(pchk);
            p = newP;
            console.log(`${n}P: ${JSON.stringify(p)}`);
        }
    });

    it('doubles', () => {
        let p = {x: curve.basePointX, y: curve.Y(curve.basePointX)[0]};
        console.log(`1P: ${JSON.stringify(p)}`);
        for (let n = 2; n <= 64; n *= 2) {
            p = curve.pointDouble(p);
            console.log(`${n}P: ${JSON.stringify(p)}`);
        }
    });
});
