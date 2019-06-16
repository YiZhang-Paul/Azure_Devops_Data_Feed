import { WebApi } from 'azure-devops-node-api';
import { IBuildApi } from 'azure-devops-node-api/BuildApi';
import { IReleaseApi } from 'azure-devops-node-api/ReleaseApi';
import { SinonStubbedInstance, stub } from 'sinon';

export function stubAzureWebApi(): SinonStubbedInstance<WebApi> {

    const stubbed = stub({

        getBuildApi: () => Promise.resolve({}),
        getReleaseApi: () => Promise.resolve({})

    } as WebApi);

    stubbed.getBuildApi.resolves({} as IBuildApi);
    stubbed.getReleaseApi.resolves({} as IReleaseApi);

    return stubbed;
}
