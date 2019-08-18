import { get } from 'config';
import * as chai from 'chai';
import 'chai-http';

import Utilities from '../../test-utilities';
import { server } from '../../../server';

const { expect } = chai;
const rootUrl = `/${get<any>('server').root}`;
const subscribeUrl = `${rootUrl}/subscription`;
chai.use(require('chai-http'));

context('api test', () => {

    let agent: ChaiHttp.Agent;

    beforeEach('test setup', () => {

        agent = chai.request(server).keepOpen();
    });

    afterEach('test teardown', () => {

        agent.close();
    });

    describe(rootUrl, () => {

        it('should return 405 for get requests', async () => {

            const response = await agent.get(rootUrl);

            expect(response).to.have.status(405);
        });

        it('should return 405 for put requests', async () => {

            const response = await agent.put(rootUrl);

            expect(response).to.have.status(405);
        });

        it('should return 400 for post requests', async () => {

            const response = await agent.post(rootUrl);

            expect(response).to.have.status(400);
        });

        it('should return 400 for delete requests', async () => {

            const response = await agent.delete(rootUrl);

            expect(response).to.have.status(400);
        });
    });

    describe(subscribeUrl, () => {

        it('should return 400 for post requests with invalid body', async () => {

            const data = { no_callbackUrl: 'random_data' };
            const response = await agent.post(subscribeUrl).send(data);

            expect(response).to.have.status(400);
        });

        it('should return 201 and guid when successfully subscribed', async () => {

            const callbackUrl = 'example1.com';
            const response = await agent.post(subscribeUrl).send({ callbackUrl });

            expect(Utilities.isValidGuid(response.body)).to.be.true;
            expect(response).to.have.status(201);
        });

        it('should return 400 for delete requests with invalid body', async () => {

            const data = { no_id: 'random_data' };
            const response = await agent.delete(subscribeUrl).send(data);

            expect(response).to.have.status(400);
        });

        it('should return 400 no subscription found with given guid', async () => {

            const url = subscribeUrl;
            const callbackUrl = 'example2.com';
            const id = (await agent.post(url).send({ callbackUrl })).body;
            const newId = `${id.slice(0, -1)}${id[id.length - 1] === 'a' ? 'b' : 'a'}`;
            const response = await agent.delete(url).send({ id: newId });

            expect(newId).to.not.equal(id);
            expect(Utilities.isValidGuid(id)).to.be.true;
            expect(Utilities.isValidGuid(newId)).to.be.true;
            expect(response).to.have.status(400);
        });

        it('should return 200 and true when unsubscribed successfully', async () => {

            const url = subscribeUrl;
            const callbackUrl = 'example3.com';
            const id = (await agent.post(url).send({ callbackUrl })).body;
            const response = await agent.delete(url).send({ id });

            expect(Utilities.isValidGuid(id)).to.be.true;
            expect(response.body).to.equal(true);
            expect(response).to.have.status(200);
        });
    });
});
