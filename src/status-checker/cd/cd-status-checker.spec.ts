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
        checker.deploys = Utilities.fillArray(20, stubAzureDeploy);
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

    describe('deployBrokenCheck()', () => {

        beforeEach('deployBrokenCheck() test setup', () => {

            const definitionA = { id: 5, name: 'PROD' };
            const definitionB = { id: 6, name: 'DEV' };
            const definitionC = { id: 7, name: 'MASTER' };
            const definitionD = { id: 8, name: 'OTHER' };
            // deploys 1 - 5 belong to pipeline A
            checker.deploys.slice(0, 5).forEach(_ => _.releaseDefinition = definitionA);
            // deploys 6 - 10 belong to pipeline B
            checker.deploys.slice(5, 10).forEach(_ => _.releaseDefinition = definitionB);
            // deploys 11 - 15 belong to pipeline C
            checker.deploys.slice(10, 15).forEach(_ => _.releaseDefinition = definitionC);
            // deploys 16 - 20 belong to pipeline D
            checker.deploys.slice(15).forEach(_ => _.releaseDefinition = definitionD);
        });

        it('should return null when no pipeline is broken', () => {
            // all pipelines are still considered passing since their most recent completed deploys are all passed
            checker.deploys[1].deploymentStatus = DeploymentStatus.Failed;
            checker.deploys[6].deploymentStatus = DeploymentStatus.Failed;
            checker.deploys[11].deploymentStatus = DeploymentStatus.Failed;

            expect(checker.deployBrokenCheck()).to.be.null;
        });

        it('should return correct information of any one of the broken deployments', () => {
            // pipeline A and C are broken since their most recent completed deploy is broken
            const minutes = -17;
            checker.deploys[0].deploymentStatus = DeploymentStatus.PartiallySucceeded;
            // deploy 1 was the most recent one to break
            checker.deploys[0].completedOn = Utilities.addMinutes(new Date(), minutes + 2);
            checker.deploys[1].deploymentStatus = DeploymentStatus.Failed;
            checker.deploys[1].completedOn = Utilities.addMinutes(new Date(), minutes);
            checker.deploys[10].deploymentStatus = DeploymentStatus.Failed;
            checker.deploys[10].completedOn = Utilities.addMinutes(new Date(), minutes + 1);
            const result = checker.deployBrokenCheck() as IPipelineStatus;

            expect(result).to.be.not.null;
            expect(result.event).to.equal('cd');
            expect(result.mode).to.equal('deploy-broken');
            // deploy 1 belongs to pipeline A
            expect(result.data.branch).to.equal('PROD');
        });

        it('should ignore deploys that are neither passed nor failed', () => {
            // pipeline B is broken since its most recent passed/failed deploy is broken
            checker.deploys[5].deploymentStatus = DeploymentStatus.NotDeployed;
            checker.deploys[6].deploymentStatus = DeploymentStatus.Undefined;
            checker.deploys[7].deploymentStatus = DeploymentStatus.Failed;
            const result = checker.deployBrokenCheck() as IPipelineStatus;

            expect(result).to.be.not.null;
            expect(result.data.branch).to.equal('DEV');
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

    describe('pendingCheck()', () => {

        it('should return null when no pending deployments found', () => {

            const result = checker.pendingCheck();

            expect(result).to.be.null;
        });

        it('should return correct pipeline\'s status when pending deployment found', () => {

            checker.deploys[6] = stubAzureDeploy(false, true);
            const name = 'DEV';
            const deploy = checker.deploys[6];
            deploy.releaseDefinition = { name };
            const result = checker.pendingCheck() as IPipelineStatus;

            expect(result).to.be.not.null;
            expect(result.event).to.equal('cd');
            expect(result.mode).to.equal('pending');
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
