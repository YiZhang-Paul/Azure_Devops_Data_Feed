import * as config from 'config';
import { getPersonalAccessTokenHandler, WebApi } from 'azure-devops-node-api';

import { IAzureWebApiFactory } from './azure-web-api-factory.interface';

export class AzureWebApiFactory implements IAzureWebApiFactory {

    public createWebApi(): WebApi {

        const { url, token } = config.get<any>('azure');

        return new WebApi(url, getPersonalAccessTokenHandler(token));
    }
}
