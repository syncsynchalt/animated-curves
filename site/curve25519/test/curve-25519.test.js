import * as curve from '../curve-25519.js';
import * as chai from 'chai';

let expect = chai.expect;

describe('curve25519 library', () => {
    it('has a base point', () => {
        let P = curve.P();
        expect(P.x).to.equal(9n);
        expect(P.y).to.not.be.undefined;
    });

    it('can double', () => {
        let PP = curve.add(curve.P(), curve.P());
        // from https://x25519.xargs.org
        expect(PP.x).to.equal(
            0x20d342d51873f1b7d9750c687d1571148f3f5ced1e350b5c5cae469cdd684efbn);
        expect(PP.y).to.be.oneOf([
            0x6c4a81fee8ff1751faf5ff6ba2d45d0c889a614d7272c6e14328fb9a38d20a8an,
            0x13b57e011700e8ae050a00945d2ba2f377659eb28d8d391ebcd70465c72df563n]);
    });

    it('double double', () => {
        let PP = curve.add(curve.P(), curve.P());
        let PPPP = curve.add(PP, PP);
        // from https://x25519.xargs.org
        expect(PPPP.x).to.equal(
            0x79ce98b7e0689d7de7d1d074a15b315ffe1805dfcd5d2a230fee85e4550013efn);
    });

    it('can add', () => {
        let PP = curve.add(curve.P(), curve.P());
        let PPP = curve.add(PP, curve.P());
        // from https://x25519.xargs.org
        expect(PPP.x).to.equal(
            0x1c12bc1a6d57abe645534d91c21bba64f8824e67621c0859c00a03affb713c12n);
        expect(PPP.y).to.be.oneOf([
            0x2986855cbe387eaeaceea446532c338c536af570f71ef7cf75c665019c41222bn,
            0x56797aa341c7815153115bb9acd3cc73ac950a8f08e108308a399afe63beddc2n]);
    });

    it('can add again', () => {
        let P = curve.P(), Q = curve.P(), R = curve.P();
        for (let i = 1; i < 4; i++) {
            Q = R;
            R = curve.add(P, Q);
        }
        // from https://x25519.xargs.org
        expect(R.x).to.equal(
            0x79ce98b7e0689d7de7d1d074a15b315ffe1805dfcd5d2a230fee85e4550013efn);
    });
});
