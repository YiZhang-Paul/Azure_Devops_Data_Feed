import { Guid } from 'guid-typescript';

import { ISubscriberInfo } from './subscriber-info.interface';

export class Notifier {

    private _subscribers = new Map<string, ISubscriberInfo>();

    get subscribed(): number {

        return this._subscribers.size;
    }

    public subscribe(info: ISubscriberInfo): string {

        const id = Guid.create().toString();
        this._subscribers.set(id, info);

        return id;
    }

    public unsubscribe(id: string): boolean {

        if (!this._subscribers.has(id)) {

            throw new Error('No subscription found.');
        }

        return this._subscribers.delete(id);
    }
}
