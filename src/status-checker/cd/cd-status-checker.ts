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

        return null;
    }

    public deployingCheck(): IPipelineStatus<{ branch: string }> | null {

        return null;
    }

    public pendingCheck(): IPipelineStatus<{ branch: string }> | null {

        return null;
    }

    public deployFailureCheck(): IPipelineStatus<{ branch: string }> | null {

        return this.notificationCheck('deploy-failed');
    }

    public pendingStartCheck(): IPipelineStatus<{ branch: string }> | null {

        return null;
    }

    public deploySuccessCheck(): IPipelineStatus<{ branch: string }> | null {

        return null;
    }

    private notificationCheck(expected: string): any | null {

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

        const branch = deploy.releaseDefinition ? deploy.releaseDefinition.name : '';
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
