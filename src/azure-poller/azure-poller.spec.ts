import { expect } from 'chai';
import { assert as sinonExpect, SinonStubbedInstance, stub } from 'sinon';

import Utilities from '../tests/test-utilities';
import { stubAzureBuild } from '../tests/stubs/azure-build.stub';
import { stubAzureDeploy } from '../tests/stubs/azure-deploy.stub';
import { stubAzureWebApiFactory } from '../tests/stubs/azure-web-api-factory.stub';
import { stubCiStatusChecker } from '../tests/stubs/ci-status-checker.stub';
import { stubCdStatusChecker } from '../tests/stubs/cd-status-checker.stub';
import { IBuildSummary } from '../status-checker/build-summary.interface';
import { IDeploySummary } from '../status-checker/deploy-summary.interface';
import { ICiStatusChecker } from '../status-checker/ci/ci-status-checker.interface';
import { ICdStatusChecker } from '../status-checker/cd/cd-status-checker.interface';
import { IPipelineStatus } from '../status-checker/pipeline-status.interface';

import { IAzureWebApiFactory } from './azure-web-api-factory.interface';
import { AzurePoller } from './azure-poller';

context('azure poller unit test', () => {

    let poller: AzurePoller;
    let apiFactoryStub: SinonStubbedInstance<IAzureWebApiFactory>;
    let ciCheckerStub: SinonStubbedInstance<ICiStatusChecker>;
    let cdCheckerStub: SinonStubbedInstance<ICdStatusChecker>;
    let buildApiStub: any;
    let releaseApiStub: any;

    beforeEach('stub setup', () => {

        buildApiStub = { getBuilds: stub().resolves([]) } as any;
        releaseApiStub = { getDeployments: stub().resolves([]) } as any;
        apiFactoryStub = stubAzureWebApiFactory();
        apiFactoryStub.createBuildApi.resolves(buildApiStub);
        apiFactoryStub.createReleaseApi.resolves(releaseApiStub);
    });

    beforeEach('test setup', () => {

        ciCheckerStub = stubCiStatusChecker();
        cdCheckerStub = stubCdStatusChecker();
        poller = new AzurePoller(apiFactoryStub, ciCheckerStub, cdCheckerStub);
    });

    describe('poll()', () => {

        const project = 'random_project';
        let builds: any[];
        let deploys: any[];

        beforeEach('poll() test setup', () => {

            builds = Utilities.fillArray(140, stubAzureBuild);
            deploys = Utilities.fillArray(70, stubAzureDeploy);
            buildApiStub.getBuilds.resolves(builds);
            releaseApiStub.getDeployments.resolves(deploys);
        });

        it('should fetch top 120 builds for the day', async () => {

            await poller.poll(project);

            expect(ciCheckerStub.builds).to.deep.equal(builds.slice(0, 120));
            sinonExpect.calledOnce(buildApiStub.getBuilds);
            sinonExpect.calledWith(buildApiStub.getBuilds, project);
        });

        it('should only fetch builds for the day', async () => {
            // last 70 builds are from yesterday
            builds.slice(70).forEach(_ => _.startTime = Utilities.addDays(new Date(), -1));
            await poller.poll(project);

            expect(ciCheckerStub.builds).to.deep.equal(builds.slice(0, 70));
        });

        it('should fetch top 50 deployments for the day', async () => {

            await poller.poll(project);

            expect(cdCheckerStub.deploys).to.deep.equal(deploys.slice(0, 50));
            sinonExpect.calledOnce(releaseApiStub.getDeployments);
            sinonExpect.calledWith(releaseApiStub.getDeployments, project);
        });

        it('should only fetch deployments for the day', async () => {
            // last 35 deploys are from yesterday
            deploys.slice(35).forEach(_ => _.startedOn = Utilities.addDays(new Date(), -1));
            await poller.poll(project);

            expect(cdCheckerStub.deploys).to.deep.equal(deploys.slice(0, 35));
            sinonExpect.calledOnce(releaseApiStub.getDeployments);
            sinonExpect.calledWith(releaseApiStub.getDeployments, project);
        });

        it('should return empty array when exception thrown', async () => {

            buildApiStub.getBuilds.rejects(new Error());
            const result = await poller.poll(project);

            expect(Array.isArray(result)).to.be.true;
            expect(result).to.be.empty;
        });

        it('should return highest priority status checks found', async () => {

            const failedStatus = { event: 'ci', mode: 'build-failed' } as IPipelineStatus;
            const builtStatus = { event: 'ci', mode: 'built' } as IPipelineStatus;
            const buildingStatus = { event: 'ci', mode: 'building' } as IPipelineStatus;
            const pendingStatus = { event: 'cd', mode: 'pending' } as IPipelineStatus;
            ciCheckerStub.failedCheck.returns(failedStatus);
            ciCheckerStub.builtCheck.returns(builtStatus);
            ciCheckerStub.buildingCheck.returns(buildingStatus);
            cdCheckerStub.pendingCheck.returns(pendingStatus);
            const result = await poller.poll(project);
            // failed has higher priority than built, building has higher priority than pending
            expect(result).to.deep.equal([failedStatus, buildingStatus]);
        });

        it('should ignore null status checks', async () => {

            const status = { event: 'ci', mode: 'building' } as IPipelineStatus;
            ciCheckerStub.buildingCheck.returns(status);
            const result = await poller.poll(project);

            expect(result).to.deep.equal([status]);
        });

        it('should always return passing status when all other checks return null', async () => {

            const pull: IBuildSummary = {

                fail: Utilities.fillArray(2, stubAzureBuild),
                pass: Utilities.fillArray(5, stubAzureBuild),
                ongoing: Utilities.fillArray(1, stubAzureBuild),
                other: Utilities.fillArray(2, stubAzureBuild)
            };

            const merge: IBuildSummary = {

                fail: Utilities.fillArray(1, stubAzureBuild),
                pass: Utilities.fillArray(3, stubAzureBuild),
                ongoing: Utilities.fillArray(0, stubAzureBuild),
                other: Utilities.fillArray(1, stubAzureBuild)
            };

            const deploy: IDeploySummary = {

                fail: Utilities.fillArray(0, stubAzureDeploy),
                pass: Utilities.fillArray(4, stubAzureDeploy),
                ongoing: Utilities.fillArray(0, stubAzureDeploy),
                other: Utilities.fillArray(1, stubAzureDeploy)
            };

            stub(ciCheckerStub, 'summary').get(() => ({ pull, merge }));
            stub(cdCheckerStub, 'summary').get(() => ({ deploy }));
            const result = await poller.poll(project);

            expect(result.length).to.equal(1);
            expect(result[0].event).to.equal('ci');
            expect(result[0].mode).to.equal('passing');
            expect(result[0].data.pull).to.deep.equal([2, 5, 10]);
            expect(result[0].data.merge).to.deep.equal([1, 3, 5]);
            expect(result[0].data.deploy).to.deep.equal([0, 4, 5]);
        });
    });
});
