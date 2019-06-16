import { SinonStubbedInstance, stub } from 'sinon';

import { ICdStatusChecker } from '../../status-checker/cd/cd-status-checker.interface';

export function stubCdStatusChecker(): SinonStubbedInstance<ICdStatusChecker> {

    const stubbed = stub({

        summary: {},
        deployBrokenCheck: () => ({}),
        deployFailureCheck: () => ({}),
        deploySuccessCheck: () => ({}),
        deployingCheck: () => ({}),
        pendingCheck: () => ({}),
        pendingStartCheck: () => ({})

    } as ICdStatusChecker);

    stub(stubbed, 'summary').get(() => ({}));
    stubbed.deployBrokenCheck.returns(null);
    stubbed.deployFailureCheck.returns(null);
    stubbed.deploySuccessCheck.returns(null);
    stubbed.deployingCheck.returns(null);
    stubbed.pendingCheck.returns(null);
    stubbed.pendingStartCheck.returns(null);

    return stubbed;
}
