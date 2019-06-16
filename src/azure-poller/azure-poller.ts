import { ICiStatusChecker } from '../status-checker/ci/ci-status-checker.interface';
import { ICdStatusChecker } from '../status-checker/cd/cd-status-checker.interface';

import { IAzureWebApiFactory } from './azure-web-api-factory.interface';

export class AzurePoller {

    constructor(

        private _apiFactory: IAzureWebApiFactory,
        private _ciChecker: ICiStatusChecker,
        private _cdChecker: ICdStatusChecker

    ) { }

    public async poll(project: string): Promise<any[]> {

        try {

            return [];
        }
        catch (error) {

            console.log(error);

            return [];
        }
    }
}
