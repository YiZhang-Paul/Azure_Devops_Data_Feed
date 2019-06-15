export class Logger {

    public log(data: any): void {

        if (process.env.TESTING !== 'true') {

            console.log(data);
        }
    }
}

export default new Logger();
