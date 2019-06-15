export class TestUtilities {

    public isValidGuid(guid: string): boolean {

        if (/[A-Z|_]/.test(guid)) {

            return false;
        }

        return /\w{8}-\w{4}-\w{4}-\w{4}-\w{8}/.test(guid);
    }
}

export default new TestUtilities();
