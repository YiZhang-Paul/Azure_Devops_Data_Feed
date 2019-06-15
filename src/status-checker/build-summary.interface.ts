import { Build } from 'azure-devops-node-api/interfaces/BuildInterfaces';

import { IPipelineSummary } from './pipeline-summary.interface';

export interface IBuildSummary extends IPipelineSummary<Build> { }
