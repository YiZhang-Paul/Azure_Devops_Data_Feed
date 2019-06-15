import * as express from 'express';
import { get } from 'config';

import { HttpClient } from './http/http-client';
import { Notifier } from './notifier/notifier';

type Request = express.Request;
type Response = express.Response;

const app = express();
const { port, root } = get('server');
const apiUrl = `/${root}/subscription`;
const notifier = new Notifier(new HttpClient());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post(apiUrl, (req: Request, res: Response) => {

    if (!req.body.callbackUrl) {

        return res.sendStatus(400);
    }

    res.status(201).json(notifier.subscribe(req.body));
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
