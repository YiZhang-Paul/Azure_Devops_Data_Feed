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

    describe('unsubscribe()', () => {

        it('should throw error when no subscriber exist', () => {

            expect(notifier.subscribed).to.equal(0);
            expect(() => notifier.unsubscribe('random_id')).to.throw();
        });

        it('should throw error when no subscriber found with given id', () => {

            const id = notifier.subscribe({ callbackUrl: '' });
            const otherId = `${id.slice(0, -1)}${id[id.length - 1] === 'a' ? 'b' : 'a'}`;

            expect(id).to.not.equal(otherId);
            expect(() => notifier.unsubscribe(otherId)).to.throw();
        });

        it('should return true when unsubscribed successfully', () => {

            const id = notifier.subscribe({ callbackUrl: '' });
            const subscribed = notifier.subscribed;

            expect(notifier.unsubscribe(id)).to.be.true;
            expect(notifier.subscribed).to.equal(subscribed - 1);
        });
    });
});
