export interface IPipelineSummary<T> {

    readonly fail: T[];
    readonly pass: T[];
    readonly ongoing: T[];
    readonly other: T[];
}
