import { Build } from 'azure-devops-node-api/interfaces/BuildInterfaces';

import { IBuildSummary } from '../build-summary.interface';
import { IPipelineStatus } from '../pipeline-status.interface';

import { ICiStatusChecker } from './ci-status-checker.interface';

export class CiStatusChecker implements ICiStatusChecker {

    public builds: Build[] = [];

    public get stats(): { pull: IBuildSummary; merge: IBuildSummary } {

        return { pull: {} as IBuildSummary, merge: {} as IBuildSummary };
    }

    public brokenCheck(): IPipelineStatus<{ total: number; time: number }> | null {

        return null;
    }

    public buildingCheck(): IPipelineStatus<{ total: number; time: number }> | null {

        return null;
    }

    public builtCheck(): IPipelineStatus<{ branch: string }> | null {

        return null;
    }

    public failedCheck(): IPipelineStatus<{ branch: string }> | null {

        return null;
    }
}
