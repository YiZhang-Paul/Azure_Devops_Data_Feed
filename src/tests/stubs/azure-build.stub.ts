import { Build, BuildResult, BuildStatus } from 'azure-devops-node-api/interfaces/BuildInterfaces';
import { SinonStubbedInstance, stub } from 'sinon';

import Utilities from '../test-utilities';

export function stubAzureBuild(ongoing = false, isPullRequest = false): SinonStubbedInstance<Build> {

    const [hour, minute] = [0, 5];
    const stubbed = stub({} as Build);
    stubbed.status = ongoing ? BuildStatus.InProgress : BuildStatus.Completed;
    stubbed.sourceBranch = isPullRequest ? 'refs/pull/1200' : 'refs/heads/develop';
    stubbed.startTime = Utilities.getDate(hour);

    if (!ongoing) {

        stubbed.result = BuildResult.Succeeded;
        stubbed.finishTime = Utilities.getDate(hour, minute);
    }

    if (isPullRequest) {

        stubbed.triggerInfo = { 'pr.sourceBranch': 'random_branch' };
    }

    return stubbed;
}
