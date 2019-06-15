import { expect } from 'chai';

import { Notifier } from './notifier';

context('notifier unit test', () => {

    let notifier: Notifier;

    beforeEach('test setup', () => {

        notifier = new Notifier();
    });

    describe('subscribe()', () => {

        it('should return guid created', () => {

            const guid = notifier.subscribe({ callbackUrl: '' });

            expect(/[A-Z|_]/.test(guid)).to.be.false;
            expect(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/.test(guid)).to.be.true;
        });

        it('should register new subscriber', () => {

            const subscribed = notifier.subscribed;
            notifier.subscribe({ callbackUrl: '' });

            expect(notifier.subscribed).to.equal(subscribed + 1);
        });
    });
});
