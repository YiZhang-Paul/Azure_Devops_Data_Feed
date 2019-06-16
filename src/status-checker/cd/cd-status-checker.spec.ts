import { DeploymentStatus } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';
import { expect } from 'chai';

import { stubAzureDeploy } from '../../tests/stubs/azure-deploy.stub';

import { CdStatusChecker } from './cd-status-checker';

context('cd status checker unit test', () => {

    let checker: CdStatusChecker;

    beforeEach('test setup', () => {

        checker = new CdStatusChecker();
        checker.deploys = new Array(20).fill(0).map(_ => stubAzureDeploy());
    });

    describe('summary', () => {

        it('should properly categorize pipelines based on their status', () => {
            // failing status
            checker.deploys[0].deploymentStatus = DeploymentStatus.Failed;
            checker.deploys[1].deploymentStatus = DeploymentStatus.Failed;
            checker.deploys[2].deploymentStatus = DeploymentStatus.Failed;
            checker.deploys[3].deploymentStatus = DeploymentStatus.PartiallySucceeded;
            checker.deploys[4].deploymentStatus = DeploymentStatus.PartiallySucceeded;
            checker.deploys[5].deploymentStatus = DeploymentStatus.Failed;
            // ongoing status
            checker.deploys[6] = stubAzureDeploy(true);
            checker.deploys[7] = stubAzureDeploy(true);
            checker.deploys[8] = stubAzureDeploy(true);
            checker.deploys[9] = stubAzureDeploy(true);
            // other status
            checker.deploys[10].deploymentStatus = DeploymentStatus.NotDeployed;
            checker.deploys[11].deploymentStatus = DeploymentStatus.Undefined;
            const { deploy } = checker.summary;

            expect(deploy.fail).to.deep.equal(checker.deploys.slice(0, 6));
            expect(deploy.ongoing).to.deep.equal(checker.deploys.slice(6, 10));
            expect(deploy.other).to.deep.equal(checker.deploys.slice(10, 12));
            expect(deploy.pass).to.deep.equal(checker.deploys.slice(12));
        });
    });
});
