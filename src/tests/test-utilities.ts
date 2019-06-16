export class TestUtilities {

    public isValidGuid(guid: string): boolean {

        if (/[A-Z|_]/.test(guid)) {

            return false;
        }

        return /\w{8}-\w{4}-\w{4}-\w{4}-\w{8}/.test(guid);
    }

    public getDate(hour = 0, minute = 0, second = 0): Date {

        const time = new Date().setHours(hour, minute, second, 0);

        return new Date(time);
    }

    public addMinutes(date: Date, minutes: number): Date {

        const time = date.setMinutes(date.getMinutes() + minutes);

        return new Date(time);
    }
}

export default new TestUtilities();
