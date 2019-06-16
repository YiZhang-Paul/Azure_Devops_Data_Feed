import { DeploymentStatus } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';
import { expect } from 'chai';

import Utilities from '../../tests/test-utilities';
import { stubAzureDeploy } from '../../tests/stubs/azure-deploy.stub';
import { IPipelineStatus } from '../pipeline-status.interface';

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

    describe('deployingCheck()', () => {

        it('should return null when no ongoing deployments found', () => {

            const result = checker.deployingCheck();

            expect(result).to.be.null;
        });

        it('should return correct pipeline\'s status when ongoing deployment found', () => {

            checker.deploys[6] = stubAzureDeploy(true);
            const name = 'DEV';
            const deploy = checker.deploys[6];
            deploy.releaseDefinition = { name };
            const result = checker.deployingCheck() as IPipelineStatus;

            expect(result).to.be.not.null;
            expect(result.event).to.equal('cd');
            expect(result.mode).to.equal('deploying');
            expect(result.data.branch).to.equal(name);
        });
    });

    describe('deployFailureCheck()', () => {

        it('should return null when no deployment failed within last 5 minutes', () => {

            const deploy = checker.deploys[0];
            deploy.deploymentStatus = DeploymentStatus.Failed;
            deploy.completedOn = Utilities.addMilliseconds(new Date(), -300500);
            const result = checker.deployFailureCheck();

            expect(result).to.be.null;
        });

        it('should send notification for deployment failed within last 5 minutes', () => {

            const name = 'PROD';
            const deploy = checker.deploys[0];
            deploy.releaseDefinition = { name };
            deploy.deploymentStatus = DeploymentStatus.Failed;
            deploy.completedOn = Utilities.addMilliseconds(new Date(), -299500);
            const result = checker.deployFailureCheck() as IPipelineStatus;

            expect(result).to.be.not.null;
            expect(result.event).to.equal('cd');
            expect(result.mode).to.equal('deploy-failed');
            expect(result.data.branch).to.equal(name);
        });

        it('should only send one notification for every failed deployment', () => {

            const deploy = checker.deploys[0];
            deploy.deploymentStatus = DeploymentStatus.Failed;
            deploy.completedOn = Utilities.addMilliseconds(new Date(), -299500);

            expect(checker.deployFailureCheck()).to.be.not.null;

            for (let i = 0; i < 10; ++i) {

                expect(checker.deployFailureCheck()).to.be.null;
            }
        });
    });

    describe('pendingStartCheck()', () => {

        it('should return null when no deployment became pending within last 5 minutes', () => {

            checker.deploys[0] = stubAzureDeploy(false, true);
            const deploy = checker.deploys[0];
            deploy.completedOn = Utilities.addMilliseconds(new Date(), -300500);
            const result = checker.pendingStartCheck();

            expect(result).to.be.null;
        });

        it('should send notification for deployment became pending within last 5 minutes', () => {

            checker.deploys[0] = stubAzureDeploy(false, true);
            const name = 'PROD';
            const deploy = checker.deploys[0];
            deploy.releaseDefinition = { name };
            deploy.completedOn = Utilities.addMilliseconds(new Date(), -299500);
            const result = checker.pendingStartCheck() as IPipelineStatus;

            expect(result).to.be.not.null;
            expect(result.event).to.equal('cd');
            expect(result.mode).to.equal('pending');
            expect(result.data.branch).to.equal(name);
        });

        it('should only send one notification for every pending deployment', () => {

            checker.deploys[0] = stubAzureDeploy(false, true);
            const deploy = checker.deploys[0];
            deploy.completedOn = Utilities.addMilliseconds(new Date(), -299500);

            expect(checker.pendingStartCheck()).to.be.not.null;

            for (let i = 0; i < 10; ++i) {

                expect(checker.pendingStartCheck()).to.be.null;
            }
        });
    });

    describe('deploySuccessCheck()', () => {

        it('should return null when no deployment succeeded within last 5 minutes', () => {

            const deploy = checker.deploys[0];
            deploy.completedOn = Utilities.addMilliseconds(new Date(), -300500);
            const result = checker.deploySuccessCheck();

            expect(result).to.be.null;
        });

        it('should send notification for deployment succeeded within last 5 minutes', () => {

            const name = 'PROD';
            const deploy = checker.deploys[0];
            deploy.releaseDefinition = { name };
            deploy.completedOn = Utilities.addMilliseconds(new Date(), -299500);
            const result = checker.deploySuccessCheck() as IPipelineStatus;

            expect(result).to.be.not.null;
            expect(result.event).to.equal('cd');
            expect(result.mode).to.equal('deployed');
            expect(result.data.branch).to.equal(name);
        });

        it('should only send one notification for every successful deployment', () => {

            const deploy = checker.deploys[0];
            deploy.completedOn = Utilities.addMilliseconds(new Date(), -299500);

            expect(checker.deploySuccessCheck()).to.be.not.null;

            for (let i = 0; i < 10; ++i) {

                expect(checker.deploySuccessCheck()).to.be.null;
            }
        });
    });
});
