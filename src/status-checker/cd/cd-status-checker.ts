import { Deployment, DeploymentStatus } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';

import { IDeploySummary } from '../deploy-summary.interface';
import { IPipelineStatus } from '../pipeline-status.interface';

import { ICdStatusChecker } from './cd-status-checker.interface';

export class CdStatusChecker implements ICdStatusChecker {

    public deploys: Deployment[] = [];

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

        return null;
    }

    public pendingStartCheck(): IPipelineStatus<{ branch: string }> | null {

        return null;
    }

    public deploySuccessCheck(): IPipelineStatus<{ branch: string }> | null {

        return null;
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
}
