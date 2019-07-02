import { Guid } from 'guid-typescript';

import Logger from '../logger';
import { IHttpClient } from '../http/http-client.interface';

import { ISubscriberInfo } from './subscriber-info.interface';

export class Notifier {

    private _callbackUrls = new Set<string>();
    private _subscribers = new Map<string, ISubscriberInfo>();

    constructor(private _http: IHttpClient) { }

    get subscribed(): number {

        return this._subscribers.size;
    }

    public subscribe(info: ISubscriberInfo): string {

        if (this._callbackUrls.has(info.callbackUrl)) {

            throw new Error(`Url "${info.callbackUrl}" is already registered.`);
        }

        const id = Guid.create().toString();
        this._callbackUrls.add(info.callbackUrl);
        this._subscribers.set(id, info);

        return id;
    }

    public unsubscribe(id: string): boolean {

        if (!this._subscribers.has(id)) {

            throw new Error('No subscription found.');
        }

        return this._subscribers.delete(id);
    }

    public async notify(payload: any): Promise<void> {

        const subscribers = Array.from(this._subscribers);

        await Promise.all(subscribers.map(async _ => {

            try {

                return await this._http.post(_[1].callbackUrl, payload);
            }
            catch (error) {

                Logger.log(error);
            }
        }));
    }
}
