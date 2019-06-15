export interface IHttpClient {

    post(url: string, data: any): Promise<any>;
}
