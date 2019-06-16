import { BuildResult } from 'azure-devops-node-api/interfaces/BuildInterfaces';
import { expect } from 'chai';

import Utilities from '../../tests/test-utilities';
import { stubAzureBuild } from '../../tests/stubs/azure-build.stub';
import { IPipelineStatus } from '../pipeline-status.interface';

import { CiStatusChecker } from './ci-status-checker';

context('ci status checker unit test', () => {

    let checker: CiStatusChecker;

    beforeEach('test setup', () => {

        checker = new CiStatusChecker();
        checker.builds = new Array(20).fill(0).map(_ => stubAzureBuild());
    });

    describe('summary', () => {

        it('should properly categorize pipelines based on their status', () => {
            // failing status
            checker.builds[0].result = BuildResult.PartiallySucceeded;
            checker.builds[1].result = BuildResult.Failed;
            checker.builds[2].result = BuildResult.Failed;
            checker.builds[10].result = BuildResult.PartiallySucceeded;
            checker.builds[11].result = BuildResult.Failed;
            checker.builds[12].result = BuildResult.Failed;
            // ongoing status
            checker.builds[3] = stubAzureBuild(true);
            checker.builds[4] = stubAzureBuild(true);
            checker.builds[13] = stubAzureBuild(true);
            checker.builds[14] = stubAzureBuild(true);
            // other status
            checker.builds[5].result = BuildResult.Canceled;
            checker.builds[15].result = BuildResult.Canceled;
            // builds 1 - 10 are pull request validations
            checker.builds.slice(0, 10).forEach(_ => _.sourceBranch = 'refs/pull/1200');
            // builds 11 - 20 are continuous integration
            checker.builds.slice(10).forEach(_ => _.sourceBranch = 'refs/heads/develop');
            const { pull, merge } = checker.summary;

            expect(pull.fail).to.deep.equal(checker.builds.slice(0, 3));
            expect(pull.ongoing).to.deep.equal(checker.builds.slice(3, 5));
            expect(pull.other).to.deep.equal(checker.builds.slice(5, 6));
            expect(pull.pass).to.deep.equal(checker.builds.slice(6, 10));
            expect(merge.fail).to.deep.equal(checker.builds.slice(10, 13));
            expect(merge.ongoing).to.deep.equal(checker.builds.slice(13, 15));
            expect(merge.other).to.deep.equal(checker.builds.slice(15, 16));
            expect(merge.pass).to.deep.equal(checker.builds.slice(16));
        });
    });

    describe('brokenCheck()', () => {

        beforeEach('brokenCheck() test setup', () => {
            // builds 1 - 5 belong to pipeline A
            checker.builds.slice(0, 5).forEach(_ => _.definition = { id: 5 });
            // builds 6 - 10 belong to pipeline B
            checker.builds.slice(5, 10).forEach(_ => _.definition = { id: 6 });
            // builds 11 - 15 belong to pipeline C
            checker.builds.slice(10, 15).forEach(_ => _.definition = { id: 7 });
            // builds 16 - 20 belong to pipeline D
            checker.builds.slice(15).forEach(_ => _.definition = { id: 8 });
        });

        it('should return null when no pipeline is broken', () => {
            // all pipelines are still considered passing since their most recent completed builds are all passed
            checker.builds[1].result = BuildResult.Failed;
            checker.builds[6].result = BuildResult.Failed;
            checker.builds[11].result = BuildResult.Failed;

            expect(checker.brokenCheck()).to.be.null;
        });

        it('should return total number of broken pipelines and elapsed time since first pipeline broke', () => {
            // pipeline A and C are broken since their most recent completed build is broken
            const minutes = -17;
            checker.builds[0].result = BuildResult.Failed;
            checker.builds[0].finishTime = Utilities.addMinutes(new Date(), minutes + 2);
            checker.builds[1].result = BuildResult.Failed;
            // build 2 was the first one to break
            checker.builds[1].finishTime = Utilities.addMinutes(new Date(), minutes);
            checker.builds[10].result = BuildResult.PartiallySucceeded;
            checker.builds[10].finishTime = Utilities.addMinutes(new Date(), minutes + 1);
            const elapsedTime = Math.abs(minutes) * 60000;
            const result = checker.brokenCheck() as IPipelineStatus;

            expect(result).to.be.not.null;
            expect(result.event).to.equal('ci');
            expect(result.mode).to.equal('broken');
            expect(result.data.total).to.equal(2);
            expect(Math.abs(result.data.time - elapsedTime)).to.be.lessThan(50);
        });

        it('should ignore builds that are neither passed nor failed', () => {
            // pipeline B is broken since its most recent passed/failed build is broken
            checker.builds[5].result = BuildResult.Canceled;
            checker.builds[6].result = BuildResult.None;
            checker.builds[7].result = BuildResult.Failed;
            const result = checker.brokenCheck() as IPipelineStatus;

            expect(result).to.be.not.null;
            expect(result.data.total).to.equal(1);
        });
    });

    describe('buildingCheck()', () => {

        it('should return null when no ongoing builds found', () => {

            const result = checker.buildingCheck();

            expect(result).to.be.null;
        });

        it('should return correct pipelines\' status and elapsed time based on first ongoing build', () => {

            const [first, last] = [4, 9];
            // builds 5 - 10 are ongoing builds with same start time
            for (let i = first; i <= last; ++i) {

                checker.builds[i] = stubAzureBuild(true);
                checker.builds[i].startTime = Utilities.getDate(15);
            }
            // build 7 is now the first one started
            const build = checker.builds[6];
            build.startTime = Utilities.addMinutes(build.startTime as Date, -15);
            const elapsedTime = Date.now() - build.startTime.getTime();
            const result = checker.buildingCheck() as IPipelineStatus;

            expect(result).to.be.not.null;
            expect(result.event).to.equal('ci');
            expect(result.mode).to.equal('building');
            expect(result.data.total).to.equal(last - first + 1);
            expect(Math.abs(result.data.time - elapsedTime)).to.be.lessThan(20);
        });
    });

    describe('builtCheck()', () => {

        it('should return null when no build passed within last 1 minute', () => {

            const build = checker.builds[0];
            build.finishTime = Utilities.addMilliseconds(new Date(), -60005);
            const result = checker.builtCheck();

            expect(result).to.be.null;
        });

        it('should send notification for build passed within last 1 minute', () => {
            // the build is continuous integration build
            const branch = 'develop';
            const build = checker.builds[0];
            build.sourceBranch = `refs/heads/${branch}`;
            build.finishTime = Utilities.addMilliseconds(new Date(), -59995);
            const result = checker.builtCheck() as IPipelineStatus;

            expect(result).to.be.not.null;
            expect(result.event).to.equal('ci');
            expect(result.mode).to.equal('built');
            expect(result.data.branch).to.equal(branch.toUpperCase());
        });

        it('should only send one notification for every passed build', () => {

            const build = checker.builds[0];
            build.finishTime = Utilities.addMilliseconds(new Date(), -59995);

            expect(checker.builtCheck()).to.be.not.null;

            for (let i = 0; i < 10; ++i) {

                expect(checker.builtCheck()).to.be.null;
            }
        });
    });

    describe('failedCheck()', () => {

        it('should return null when no build failed within last 1 minute', () => {

            const build = checker.builds[0];
            build.result = BuildResult.Failed;
            build.finishTime = Utilities.addMilliseconds(new Date(), -60005);
            const result = checker.failedCheck();

            expect(result).to.be.null;
        });

        it('should send notification for build failed within last 1 minute', () => {
            // the build is pull request validation
            checker.builds[0] = stubAzureBuild(false, true);
            const branch = 'random_branch';
            const build = checker.builds[0];
            build.result = BuildResult.Failed;
            build.triggerInfo = { 'pr.sourceBranch': branch };
            build.finishTime = Utilities.addMilliseconds(new Date(), -59995);
            const result = checker.failedCheck() as IPipelineStatus;

            expect(result).to.be.not.null;
            expect(result.event).to.equal('ci');
            expect(result.mode).to.equal('build-failed');
            expect(result.data.branch).to.equal(branch.toUpperCase());
        });

        it('should only send one notification for every failed build', () => {

            const build = checker.builds[0];
            build.result = BuildResult.Failed;
            build.finishTime = Utilities.addMilliseconds(new Date(), -59995);

            expect(checker.failedCheck()).to.be.not.null;

            for (let i = 0; i < 10; ++i) {

                expect(checker.failedCheck()).to.be.null;
            }
        });
    });
});
