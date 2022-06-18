import * as draw from '../sample-draw.js';
import * as curve from '../sample-curve.js';
import * as chai from 'chai';

const expect = chai.expect;

describe('sample drawing lib', () => {
    it('can mutate graph', () => {
        let repeat = (n) => { for (let i = 0; i < n; i++) draw.mutateGraph(state); };
        let state = {a: -2, b: -1, aDir: 1, bDir: 1};
        repeat(1);
        expect([state.a, state.b]).to.eql([-2, 0]);
        repeat(3);
        expect([state.a, state.b]).to.eql([-1, 2]);
        repeat(1);
        expect([state.a, state.b]).to.eql([-1, 1]);
        repeat(3);
        expect([state.a, state.b]).to.eql([0, -1]);
        repeat(7);
        expect([state.a, state.b]).to.eql([1, -1]);
        repeat(1);
        expect([state.a, state.b]).to.eql([0, -1]);
        repeat(11);
        expect([state.a, state.b]).to.eql([-2, 2]);
        repeat(1);
        expect([state.a, state.b]).to.eql([-1, 2]);
    });

    it('anneals graph data', () => {
        let d1 = {x: [1, 2, 2.5, 3], y: [20, 30, 40, 50], a: 1, b: 2};
        let d2 = {x: [1, 1.5, 2, 3], y: [30, 40, 50, 60], a: 2, b: 1};
        draw.annealGraphData(d1, d2);
        expect(d1.x).to.eql([1, 1.5, 2, 2.5, 3]);
        expect(d2.x).to.eql([1, 1.5, 2, 2.5, 3]);
        expect(d1.y).to.eql([20, curve.yValPos(1.5, d1.a, d1.b), 30, 40, 50]);
        expect(d2.y).to.eql([30, 40, 50, curve.yValPos(2.5, d2.a, d2.b), 60]);
    });
});
