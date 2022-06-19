import * as fmath from '../field-math.js';
import * as chai from 'chai';

const expect = chai.expect;

describe('field math library', () => {
    it ('can compute inverses', () => {
        expect(fmath.inverseOf(0)).to.equal(Infinity, '0');
        for (let i = 1; i < fmath.p; i++) {
            let j = fmath.inverseOf(i);
            expect(j).to.be.lessThan(fmath.p, `${i}`);
            expect(j).to.be.greaterThan(0, `${i}`);
            expect(j*i % 23).to.equal(1, `${i}`);
        }
    });

    it ('can handle out-of-range inverses', () => {
        for (let i = 24; i < fmath.p * 2; i++) {
            let j = fmath.inverseOf(i);
            expect(j).to.be.lessThan(fmath.p, `${i}`);
            expect(j).to.be.greaterThan(0, `${i}`);
            expect(fmath.reduce(j*i)).to.equal(1, `${i}`);
        }

        for (let i = -22; i < 0; i++) {
            let j = fmath.inverseOf(i);
            expect(j).to.be.lessThan(fmath.p, `${i}`);
            expect(j).to.be.greaterThan(0, `${i}`);
            expect(fmath.reduce(j*i)).to.equal(1, `${i}`);
        }
    });

    it('can compute square root', () => {
        expect(fmath.sqrt(0)).to.eql([0, 0]);
        let solutions = 1;
        for (let i = 1; i < fmath.p; i++) {
            const s = fmath.sqrt(i);
            if (s) {
                solutions++;
                expect(fmath.reduce(s[0]*s[0])).to.equal(i, `${i}`);
                expect(fmath.reduce(s[1]*s[1])).to.equal(i, `${i}`);
            }
        }
        expect(solutions).to.equal((fmath.p+1)/2);
    });
});
