import { Deployment, DeploymentOperationStatus, DeploymentStatus } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';

import { IDeploySummary } from '../deploy-summary.interface';
import { IPipelineStatus } from '../pipeline-status.interface';

import { ICdStatusChecker } from './cd-status-checker.interface';

export class CdStatusChecker implements ICdStatusChecker {

    public deploys: Deployment[] = [];

    private _reported = new Set<string>();

    public get summary(): { deploy: IDeploySummary } {

        const deploy = { fail: [], pass: [], ongoing: [], other: [] } as IDeploySummary;
        const { pass, fail, ongoing, other } = deploy;

        for (const deployment of this.deploys) {

            if (this.isSucceededOrFailed(deployment)) {

                (this.isSucceeded(deployment) ? pass : fail).push(deployment);
            }
            else {

                (this.isDeploying(deployment) ? ongoing : other).push(deployment);
            }
        }

        return { deploy };
    }

    public deployBrokenCheck(): IPipelineStatus<{ branch: string }> | null {

        const skip = new Set<number>();
        const deploys = this.getSucceededOrFailedDeploys();

        for (const deploy of this.sortByCompletionTime(deploys)) {

            if (!deploy.releaseDefinition || !deploy.releaseDefinition.id) {

                continue;
            }

            const id = deploy.releaseDefinition.id;

            if (this.isSucceeded(deploy)) {

                skip.add(id);
            }
            else if (!skip.has(id)) {

                const branch = this.getReleaseName(deploy);

                return { event: 'cd', mode: 'deploy-broken', data: { branch } };
            }
        }

        return null;
    }

    public deployingCheck(): IPipelineStatus<{ branch: string }> | null {

        const deploy = this.deploys.find(_ => this.isDeploying(_));

        if (!deploy) {

            return null;
        }

        const branch = this.getReleaseName(deploy);

        return { event: 'cd', mode: 'deploying', data: { branch } };
    }

    public pendingCheck(): IPipelineStatus<{ branch: string }> | null {

        const deploy = this.deploys.find(_ => this.isPending(_));

        if (!deploy) {

            return null;
        }

        const branch = this.getReleaseName(deploy);

        return { event: 'cd', mode: 'pending', data: { branch } };
    }

    public deployFailureCheck(): IPipelineStatus<{ branch: string }> | null {

        return this.notificationCheck('deploy-failed');
    }

    public pendingStartCheck(): IPipelineStatus<{ branch: string }> | null {

        return this.notificationCheck('pending');
    }

    public deploySuccessCheck(): IPipelineStatus<{ branch: string }> | null {

        return this.notificationCheck('deployed');
    }

    private notificationCheck(expected: string): IPipelineStatus<{ branch: string }> | null {

        const deploy = this.getLatestCompletedDeploy();

        if (!deploy || !this.canReport(deploy) || !this.isPendingOrCompleted(deploy)) {

            return null;
        }

        const isSuccess = this.isSucceeded(deploy);
        const isPending = this.isPending(deploy);
        const mode = isSuccess ? 'deployed' : isPending ? 'pending' : 'deploy-failed';

        if (mode !== expected) {

            return null;
        }

        const branch = this.getReleaseName(deploy);
        this._reported.add(this.getKey(deploy));

        return { event: 'cd', mode, data: { branch } };
    }

    private canReport(deploy: Deployment, threshold = 300000): boolean {

        if (this._reported.has(this.getKey(deploy)) || !deploy.completedOn) {

            return false;
        }

        return Date.now() - deploy.completedOn.getTime() <= threshold;
    }

    private getLatestCompletedDeploy(): Deployment | null {

        const deploys = this.getCompletedDeploys();

        return deploys.length ? this.sortByCompletionTime(deploys)[0] : null;
    }

    private getCompletedDeploys(): Deployment[] {

        return this.deploys.filter(_ => this.isPendingOrCompleted(_));
    }

    private getSucceededOrFailedDeploys(): Deployment[] {

        return this.deploys.filter(_ => this.isSucceededOrFailed(_));
    }

    private getReleaseName(deploy: Deployment): string {

        if (!deploy.releaseDefinition || !deploy.releaseDefinition.name) {

            return '';
        }

        return deploy.releaseDefinition.name;
    }

    private getKey(deploy: Deployment): string {

        const name = deploy.releaseDefinition ? deploy.releaseDefinition.name : '';

        return `${name}|${deploy.id}`;
    }

    private sortByCompletionTime(deploys: Deployment[], ascending = false): Deployment[] {

        const sorted = deploys.slice().sort((a, b) => {

            const now = Date.now();
            const completedOnA = a.completedOn ? a.completedOn.getTime() : now;
            const completedOnB = b.completedOn ? b.completedOn.getTime() : now;

            return completedOnB - completedOnA;
        });

        return ascending ? sorted.reverse() : sorted;
    }

    private isPendingOrCompleted(deploy: Deployment): boolean {

        return this.isPending(deploy) || this.isSucceededOrFailed(deploy);
    }

    private isSucceededOrFailed(deploy: Deployment): boolean {

        return this.isSucceeded(deploy) || this.isFailed(deploy);
    }

    private isSucceeded(deploy: Deployment): boolean {

        return deploy.deploymentStatus === DeploymentStatus.Succeeded;
    }

    private isFailed(deploy: Deployment): boolean {

        if (deploy.deploymentStatus === DeploymentStatus.Failed) {

            return true;
        }

        return deploy.deploymentStatus === DeploymentStatus.PartiallySucceeded;
    }

    private isDeploying(deploy: Deployment): boolean {

        return deploy.deploymentStatus === DeploymentStatus.InProgress;
    }

    private isPending(deploy: Deployment): boolean {

        return deploy.operationStatus === DeploymentOperationStatus.Pending;
    }
}
