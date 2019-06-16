import { WebApi } from 'azure-devops-node-api';
import { IBuildApi } from 'azure-devops-node-api/BuildApi';
import { IReleaseApi } from 'azure-devops-node-api/ReleaseApi';

export interface IAzureWebApiFactory {

    createWebApi(): WebApi;
    createBuildApi(): Promise<IBuildApi>;
    createReleaseApi(): Promise<IReleaseApi>;
}
