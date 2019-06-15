import * as express from 'express';
import { get } from 'config';

type Request = express.Request;
type Response = express.Response;

const app = express();
const { port } = get('server');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/*', (_: Request, res: Response) => res.sendStatus(405));
app.put('/*', (_: Request, res: Response) => res.sendStatus(405));
app.post('/*', (_: Request, res: Response) => res.sendStatus(400));
app.delete('/*', (_: Request, res: Response) => res.sendStatus(400));

app.listen(port, () => {

    console.log(`Data feed server started listening on port ${port}.`);
});
