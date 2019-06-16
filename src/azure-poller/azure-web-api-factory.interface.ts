import { WebApi } from 'azure-devops-node-api';

export interface IAzureWebApiFactory {

    createWebApi(): WebApi;
}
