import http from 'axios';

import { IHttpClient } from './http-client.interface';

export class HttpClient implements IHttpClient {

    public async post(url: string, data: any): Promise<any> {

        return await http.post(url, data);
    }
}
