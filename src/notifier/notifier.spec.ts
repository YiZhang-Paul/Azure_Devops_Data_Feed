import { expect } from 'chai';
import { assert as sinonExpect, match, SinonStubbedInstance } from 'sinon';

import { stubHttpClient } from '../tests/stubs/http-client.stub';
import { IHttpClient } from '../http/http-client.interface';

import { Notifier } from './notifier';

context('notifier unit test', () => {

    let notifier: Notifier;
    let httpClientStub: SinonStubbedInstance<IHttpClient>;

    beforeEach('test setup', () => {

        httpClientStub = stubHttpClient();
        notifier = new Notifier(httpClientStub);
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

    describe('notify()', () => {

        beforeEach('notify() test setup', () => {

            notifier.subscribe({ callbackUrl: 'url_1' });
            notifier.subscribe({ callbackUrl: 'url_2' });
            notifier.subscribe({ callbackUrl: 'url_3' });
        });

        it('should notify all subscribers with the payload', async () => {

            const subscribed = notifier.subscribed;
            const payload = { data: 'random_data' };
            await notifier.notify(payload);

            expect(subscribed).to.be.greaterThan(0);
            sinonExpect.callCount(httpClientStub.post, subscribed);
            sinonExpect.calledWith(httpClientStub.post, match(/url_\d/), payload);
        });

        it('should notify all subscribers despite errors', async () => {

            httpClientStub.post.rejects(new Error());

            const subscribed = notifier.subscribed;
            await notifier.notify({});

            expect(subscribed).to.be.greaterThan(0);
            sinonExpect.callCount(httpClientStub.post, subscribed);
        });
    });
});
