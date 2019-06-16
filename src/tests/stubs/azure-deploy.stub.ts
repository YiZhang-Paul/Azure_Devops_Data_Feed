import { Deployment, DeploymentOperationStatus, DeploymentStatus } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';
import { SinonStubbedInstance, stub } from 'sinon';

import Utilities from '../test-utilities';

export function stubAzureDeploy(ongoing = false, pending = false): SinonStubbedInstance<Deployment> {

    if (ongoing && pending) {

        throw new Error('A deployment cannot have both ongoing and pending status.');
    }

    const [hour, minute] = [12, 15];
    const stubbed = stub({} as Deployment);
    stubbed.deploymentStatus = ongoing ? DeploymentStatus.InProgress : DeploymentStatus.Succeeded;
    stubbed.startedOn = Utilities.getDate(hour);

    if (!ongoing && !pending) {

        stubbed.deploymentStatus = DeploymentStatus.Succeeded;
        stubbed.completedOn = Utilities.getDate(hour, minute);
    }

    if (pending) {

        stubbed.operationStatus = DeploymentOperationStatus.Pending;
    }

    return stubbed;
}
