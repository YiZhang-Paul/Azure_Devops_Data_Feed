import { stub } from 'sinon';

import { IHttpClient } from '../../http/http-client.interface';

export function stubHttpClient(): IHttpClient {

    const stubbed = {} as IHttpClient;
    stubbed.post = stub().resolves({});

    return stubbed;
}
