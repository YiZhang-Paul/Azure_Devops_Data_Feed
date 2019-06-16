import { Deployment } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';

import { IPipelineStatus } from '../pipeline-status.interface';
import { IDeploySummary } from '../deploy-summary.interface';

export interface ICdStatusChecker {

    deploys: Deployment[];
    readonly summary: { deploy: IDeploySummary };
    deployBrokenCheck(): IPipelineStatus<{ branch: string }> | null;
    deployingCheck(): IPipelineStatus<{ branch: string }> | null;
    pendingCheck(): IPipelineStatus<{ branch: string }> | null;
    deployFailureCheck(): IPipelineStatus<{ branch: string }> | null;
    pendingStartCheck(): IPipelineStatus<{ branch: string }> | null;
    deploySuccessCheck(): IPipelineStatus<{ branch: string }> | null;
}
