import { Deployment } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';

import { IPipelineSummary } from './pipeline-summary.interface';

export interface IDeploySummary extends IPipelineSummary<Deployment> { }
