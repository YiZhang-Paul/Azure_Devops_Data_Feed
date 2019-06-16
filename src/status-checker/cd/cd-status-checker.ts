import { Deployment } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';

import { IDeploySummary } from '../deploy-summary.interface';
import { IPipelineStatus } from '../pipeline-status.interface';

import { ICdStatusChecker } from './cd-status-checker.interface';

export class CdStatusChecker implements ICdStatusChecker {

    public deploys: Deployment[] = [];

    public get summary(): { deploy: IDeploySummary } {

        const deploy = { fail: [], pass: [], ongoing: [], other: [] } as IDeploySummary;

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
}
