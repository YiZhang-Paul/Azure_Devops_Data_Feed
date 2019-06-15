import { SinonStubbedInstance, stub } from 'sinon';

import { IHttpClient } from '../../http/http-client.interface';

export function stubHttpClient(): SinonStubbedInstance<IHttpClient> {

    const stubbed = stub({

        post: () => Promise.resolve({})

    } as IHttpClient);

    stubbed.post.resolves({});

    return stubbed;
}
