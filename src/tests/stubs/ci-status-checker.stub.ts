import { SinonStubbedInstance, stub } from 'sinon';

import { ICiStatusChecker } from '../../status-checker/ci/ci-status-checker.interface';

export function stubCiStatusChecker(): SinonStubbedInstance<ICiStatusChecker> {

    const stubbed = stub({

        summary: {},
        brokenCheck: () => ({}),
        buildingCheck: () => ({}),
        builtCheck: () => ({}),
        failedCheck: () => ({})

    } as ICiStatusChecker);

    stub(stubbed, 'summary').get(() => ({}));
    stubbed.brokenCheck.returns(null);
    stubbed.buildingCheck.returns(null);
    stubbed.builtCheck.returns(null);
    stubbed.failedCheck.returns(null);

    return stubbed;
}
