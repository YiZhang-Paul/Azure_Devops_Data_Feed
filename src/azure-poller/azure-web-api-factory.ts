import * as config from 'config';
import { getPersonalAccessTokenHandler, WebApi } from 'azure-devops-node-api';
import { IBuildApi } from 'azure-devops-node-api/BuildApi';
import { IReleaseApi } from 'azure-devops-node-api/ReleaseApi';

import { IAzureWebApiFactory } from './azure-web-api-factory.interface';

export class AzureWebApiFactory implements IAzureWebApiFactory {

    public createWebApi(): WebApi {

        const { url, token } = config.get<any>('azure');

        return new WebApi(url, getPersonalAccessTokenHandler(token));
    }

    public async createBuildApi(): Promise<IBuildApi> {

        return await this.createWebApi().getBuildApi();
    }

    public async createReleaseApi(): Promise<IReleaseApi> {

        return await this.createWebApi().getReleaseApi();
    }
}
