import { get } from 'config';
import * as express from 'express';
import { setTimeout } from 'timers';

import { AzureWebApiFactory } from './azure-poller/azure-web-api-factory';
import { CiStatusChecker } from './status-checker/ci/ci-status-checker';
import { CdStatusChecker } from './status-checker/cd/cd-status-checker';
import { AzurePoller } from './azure-poller/azure-poller';
import { HttpClient } from './http/http-client';
import { Notifier } from './notifier/notifier';

type Request = express.Request;
type Response = express.Response;

const app = express();
const { port, root } = get('server');
const { project } = get<any>('azure');
const apiUrl = `/${root}/subscription`;
const apiFactory = new AzureWebApiFactory();
const ciChecker = new CiStatusChecker();
const cdChecker = new CdStatusChecker();
const poller = new AzurePoller(apiFactory, ciChecker, cdChecker);
const notifier = new Notifier(new HttpClient());

initialize(project);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post(apiUrl, (req: Request, res: Response) => {

    if (!req.body.callbackUrl) {

        return res.sendStatus(400);
    }

    try {

        return res.status(201).json(notifier.subscribe(req.body));
    }
    catch (error) {

        console.log(error);

        return res.status(400).json(error);
    }
});

app.delete(apiUrl, (req: Request, res: Response) => {

    try {

        res.status(200).json(notifier.unsubscribe(req.body.id));
    }
    catch (error) {

        res.sendStatus(400);
    }
});

app.get('/*', (_: Request, res: Response) => res.sendStatus(405));
app.put('/*', (_: Request, res: Response) => res.sendStatus(405));
app.post('/*', (_: Request, res: Response) => res.sendStatus(400));
app.delete('/*', (_: Request, res: Response) => res.sendStatus(400));

export const server = app.listen(port, () => {

    console.log(`Data feed server started listening on port ${port}.`);
});

function initialize(project: string): void {

    const emit = async () => {

        for (const result of await poller.poll(project)) {
            console.log(result);
            await notifier.notify(result);
        }

        setTimeout(emit, 5000);
    };

    emit();
}
