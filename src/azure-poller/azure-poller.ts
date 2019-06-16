import * as config from 'config';
import { Build } from 'azure-devops-node-api/interfaces/BuildInterfaces';
import { Deployment } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';

import { ICiStatusChecker } from '../status-checker/ci/ci-status-checker.interface';
import { ICdStatusChecker } from '../status-checker/cd/cd-status-checker.interface';

import { IAzureWebApiFactory } from './azure-web-api-factory.interface';

const { include_definitions: definitions } = config.get<any>('azure');

export class AzurePoller {

    constructor(

        private _apiFactory: IAzureWebApiFactory,
        private _ciChecker: ICiStatusChecker,
        private _cdChecker: ICdStatusChecker

    ) { }

    private get _beginningOfDay(): Date {

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return today;
    }

    public async poll(project: string): Promise<any[]> {

        try {

            this._ciChecker.builds = await this.getBuildsForToday(project);
            this._cdChecker.deploys = await this.getDeploysForToday(project);

            return [null, null, null];
        }
        catch (error) {

            console.log(error);

            return [];
        }
    }

    private async getBuildsForToday(project: string): Promise<Build[]> {

        const api = await this._apiFactory.createBuildApi();
        const builds = await api.getBuilds(project, definitions);

        return builds
            .slice(0, 120)
            .filter(_ => !_.startTime || _.startTime >= this._beginningOfDay);
    }

    private async getDeploysForToday(project: string): Promise<Deployment[]> {

        const api = await this._apiFactory.createReleaseApi();
        const deploys = await api.getDeployments(project);

        return deploys
            .slice(0, 50)
            .filter(_ => !_.startedOn || _.startedOn >= this._beginningOfDay);
    }
}
