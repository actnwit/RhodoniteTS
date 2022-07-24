export declare class SymbolWeakMap<V> {
    private __weakMap;
    constructor();
    /**
     * set key and value
     * @param symbol the key for access
     * @param value the value as a cache item
     * @returns true: succeed to set value, false: not set (already exists)
     */
    set(symbol: Symbol, value: V): boolean;
    /**
     * return the boolean value whether it have the key or not
     * @param symbol the key for access
     * @returns Whether it have the key or not.
     */
    has(symbol: Symbol): boolean;
    /**
     * return the number of this cache items
     * @returns the number of this cache items
     */
    /**
     * return the value in the cache by the key
     * @param symbol the key for access
     * @returns the value in the cache by the key
     */
    get(symbol: Symbol): V | undefined;
    /**
     * delete the value
     * @param symbol the key for access
     * @returns the flag of the deletion was succeed or not
     */
    delete(symbol: Symbol): boolean;
}
