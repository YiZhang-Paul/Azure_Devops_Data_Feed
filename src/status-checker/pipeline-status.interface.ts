export interface IPipelineStatus<T = any> {

    readonly event: 'ci' | 'cd';
    readonly mode: string;
    readonly data: T;
}
