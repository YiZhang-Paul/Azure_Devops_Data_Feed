import { WebApi } from 'azure-devops-node-api';
import { IBuildApi } from 'azure-devops-node-api/BuildApi';
import { IReleaseApi } from 'azure-devops-node-api/ReleaseApi';
import { SinonStubbedInstance, stub } from 'sinon';

import { IAzureWebApiFactory } from '../../azure-poller/azure-web-api-factory.interface';

export function stubAzureWebApiFactory(): SinonStubbedInstance<IAzureWebApiFactory> {

    const stubbed = stub({

        createWebApi: () => ({}),
        createBuildApi: () => ({}),
        createReleaseApi: () => ({})

    } as IAzureWebApiFactory);

    stubbed.createWebApi.returns({} as WebApi);
    stubbed.createBuildApi.resolves({} as IBuildApi);
    stubbed.createReleaseApi.resolves({} as IReleaseApi);

    return stubbed;
}
