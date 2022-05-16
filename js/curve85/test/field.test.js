import * as field from '../field.js';
import * as chai from 'chai';

let expect = chai.expect;

describe('field math library', () => {

    // xxx more

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
});
