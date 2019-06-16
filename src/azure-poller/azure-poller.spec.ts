import { expect } from 'chai';
import { assert as sinonExpect, SinonStubbedInstance, stub } from 'sinon';

import Utilities from '../tests/test-utilities';
import { stubAzureBuild } from '../tests/stubs/azure-build.stub';
import { stubAzureDeploy } from '../tests/stubs/azure-deploy.stub';
import { stubAzureWebApiFactory } from '../tests/stubs/azure-web-api-factory.stub';
import { stubCiStatusChecker } from '../tests/stubs/ci-status-checker.stub';
import { stubCdStatusChecker } from '../tests/stubs/cd-status-checker.stub';
import { ICiStatusChecker } from '../status-checker/ci/ci-status-checker.interface';
import { ICdStatusChecker } from '../status-checker/cd/cd-status-checker.interface';

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
    });
});
