import * as config from 'config';
import { Build } from 'azure-devops-node-api/interfaces/BuildInterfaces';
import { Deployment } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';

import Logger from '../logger';
import { ICiStatusChecker } from '../status-checker/ci/ci-status-checker.interface';
import { ICdStatusChecker } from '../status-checker/cd/cd-status-checker.interface';
import { IPipelineStatus } from '../status-checker/pipeline-status.interface';
import { IPipelineSummary } from '../status-checker/pipeline-summary.interface';

import { IAzureWebApiFactory } from './azure-web-api-factory.interface';

const { include } = config.get<any>('azure');

export class AzurePoller {

    private _statusChecks: Function[] = [

        this._cdChecker.deployingCheck.bind(this._cdChecker),
        this._ciChecker.buildingCheck.bind(this._ciChecker),
        this._cdChecker.deployBrokenCheck.bind(this._cdChecker),
        this._ciChecker.brokenCheck.bind(this._ciChecker),
        this._cdChecker.pendingCheck.bind(this._cdChecker),
        this.passingCheck.bind(this)
    ];

    private _notificationChecks: Function[] = [

        this._cdChecker.deployFailureCheck.bind(this._cdChecker),
        this._ciChecker.failedCheck.bind(this._ciChecker),
        this._cdChecker.pendingStartCheck.bind(this._cdChecker),
        this._cdChecker.deploySuccessCheck.bind(this._cdChecker),
        this._ciChecker.builtCheck.bind(this._ciChecker)
    ];

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

    public async poll(project: string): Promise<IPipelineStatus[]> {

        try {

            this._ciChecker.builds = await this.getBuildsForToday(project);
            this._cdChecker.deploys = await this.getDeploysForToday(project);
            const status = this.check(this._statusChecks);
            const notification = this.check(this._notificationChecks);

            return [status, notification].filter(_ => !!_) as IPipelineStatus[];
        }
        catch (error) {

            Logger.log(error);

            return [];
        }
    }

    private async getBuildsForToday(project: string): Promise<Build[]> {

        const api = await this._apiFactory.createBuildApi();
        const builds = await api.getBuilds(project, include);

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

    private check(checkers: Function[]): IPipelineStatus | null {

        for (const checker of checkers) {

            const result = checker();

            if (result) {

                return result;
            }
        }

        return null;
    }

    private passingCheck(): IPipelineStatus | null {

        const buildStats = this._ciChecker.summary;
        const deployStats = this._cdChecker.summary;
        const pull = this.getCounts(buildStats.pull);
        const merge = this.getCounts(buildStats.merge);
        const deploy = this.getCounts(deployStats.deploy);

        return { event: 'ci', mode: 'passing', data: { pull, merge, deploy } };
    }

    private getCounts(summary: IPipelineSummary<any>): number[] {

        const { fail, pass, ongoing, other } = summary;
        const total = fail.length + pass.length + ongoing.length + other.length;

        return [fail.length, pass.length, total];
    }
}
