import { Build } from 'azure-devops-node-api/interfaces/BuildInterfaces';

import { IPipelineStatus } from '../pipeline-status.interface';
import { IBuildSummary } from '../build-summary.interface';

export interface ICiStatusChecker {

    builds: Build[];
    readonly stats: { pull: IBuildSummary; merge: IBuildSummary };
    brokenCheck(): IPipelineStatus<{ total: number; time: number }> | null;
    buildingCheck(): IPipelineStatus<{ total: number; time: number }> | null;
    builtCheck(): IPipelineStatus<{ branch: string }> | null;
    failedCheck(): IPipelineStatus<{ branch: string }> | null;
}
