import * as field from '../field.js';
import * as chai from 'chai';

let expect = chai.expect;

describe('field math library', () => {

    it('should have functional toHex', () => {
        expect(field.toHex(0, 256)).to.equal('0'.repeat(64));
        expect(field.toHex(0)).to.equal('0');

        expect(field.toHex(1, 256)).to.equal('0'.repeat(63) + '1');
        expect(field.toHex(1)).to.equal('1');

        expect(field.toHex(15)).to.equal('f');
        expect(field.toHex(15, 0)).to.equal('f');
        for (let i = 1; i < 8; i++) {
            expect(field.toHex(15, i)).to.equal('0f', `${i} bits`);
        }
        expect(field.toHex(15, 9)).to.equal('000f');

        expect(field.toHex(0xffffff7)).to.equal('ffffff7');
    });

    it('should round toHex bits properly', () => {
        expect(field.toHex(1, 0)).to.equal('1');
        expect(field.toHex(1, 1)).to.equal('01');
        expect(field.toHex(1, 8)).to.equal('01');
        expect(field.toHex(1, 9)).to.equal('0001');
    });

    it('should have fixed sqrt values', () => {
        expect(field.sqrt(1)).to.eql([1, 60]);
        expect(field.sqrt(2)).to.be.undefined;
        expect(field.sqrt(3)).to.eql([8, 53]);
        expect(field.sqrt(9)).to.eql([58, 3]);
        expect(field.sqrt(248)).to.eql([59, 2]);
        expect(field.sqrt(249)).to.eql([35, 26]);
        expect(field.sqrt(250)).to.be.undefined;
        expect(field.sqrt(251)).to.be.undefined;
        expect(field.sqrt(256)).to.eql([16, 45]);
    });

    it('should have valid sqrt for half of values', () => {
        let count = 0;
        for (let i = 1; i < field.p; i++) {
            if (field.sqrt(i)) {
                count++;
            }
        }
        expect(count).to.equal(Math.floor((field.p-1)/2));
    });

    it('should calculate distinct sqrt', () => {
        const results = {};
        for (let i = 1; i < field.p; i++) {
            let v = field.sqrt(i);
            if (!v) {
                continue;
            }
            expect(results[v[0]]).to.be.undefined;
            results[v[0]] = i;
            if (i !== 1) {
                expect(results[v[1]]).to.be.undefined;
                results[v[1]] = i;
            }
        }
    });

    it('can calculate distinct inverses', () => {
        const results = {};
        for (let i = 1; i < field.p; i++) {
            const inv = field.inverseOf(i);
            expect(results[inv]).to.be.undefined;
            results[inv] = i;
            expect(inv).to.not.equal(0);
            expect((i * inv) % field.p).to.equal(1);
        }
        expect(Object.keys(results).length).to.equal(field.p-1);
    });

    it('should have working multiplicative inverse', () => {
        let chk = (n, known) => {
            let result = field.inverseOf(n);
            expect(field.reduce(n * result)).to.equal(1, `inverseOf(${n})`);
            if (known !== undefined) {
                expect(result).to.equal(known, `inverseOf(${n})`);
            }
        };
        chk(1, 1);
        chk(2, Math.floor(field.p / 2) + 1);
        chk(Math.floor(field.p / 2) + 1, 2);
        chk(field.p + 1, 1);
        chk(123);
        chk(456);
    });

    it('it can find exponents efficiently', () => {
        expect(field.pow(1, 3)).to.equal(1);
        expect(field.pow(2, 4)).to.equal(16);
        expect(field.pow(3, 5)).to.equal(60);
        let p = field.p;
        // checking euler criteria
        expect(field.pow(7, (p-1)/2)).to.equal(p-1);
        expect(field.pow(9, (p-1)/2)).to.equal(1);
    });

    it('can find roots', () => {
        let checkSquare = (n) => {
            let msg = `n=${n}`;
            let r = field.sqrt(n);
            if (n === 0) {
                expect(r[0]).to.equal(0, msg);
                expect(r[1]).to.equal(0, msg);
            } else {
                expect(r[0]).to.not.equal(r[1]);
                expect(r[0] * r[0] % field.p).to.equal(n, msg);
                expect(r[1] * r[1] % field.p).to.equal(n, msg);
            }
            console.log(`${n} has roots in Fp ${r[0]} and ${r[1]}`);
        };
        let checkNotSquare = (n) => {
            let msg = `n=${n}`;
            expect(field.sqrt(n), msg).to.be.undefined;
        };

        let squares = [0, 1, 3, 4, 5, 9, (Math.floor(field.p/2)+4), field.p-1];
        let notSquares = [2, 6, 7, 8, 10, 100000, (field.p-1)/2-1, (field.p-1)/2, (field.p/2+1)];

        for (let n of squares) checkSquare(n);
        for (let n of notSquares) checkNotSquare(n);
    });
});
