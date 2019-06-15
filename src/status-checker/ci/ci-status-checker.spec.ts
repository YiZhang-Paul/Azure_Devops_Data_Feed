import { BuildResult } from 'azure-devops-node-api/interfaces/BuildInterfaces';
import { expect } from 'chai';

import { stubAzureBuild } from '../../tests/stubs/azure-build.stub';

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
            checker.builds[3] = stubAzureBuild(false, true);
            checker.builds[4] = stubAzureBuild(false, true);
            checker.builds[13] = stubAzureBuild(false, true);
            checker.builds[14] = stubAzureBuild(false, true);
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
});
