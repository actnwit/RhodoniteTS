/** A dirty range of table slots [min, max), uploaded at once. */
export declare class DirtyRange {
    min: number;
    max: number;
    add(begin: number, end: number): void;
    get isEmpty(): boolean;
    clear(): void;
}
