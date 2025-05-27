/**
 * Asset loader configuration interface
 */
export interface AssetLoaderConfig {
  /** Limit on the number of concurrent loads */
  maxConcurrentLoads?: number;
  /** Timeout duration (in milliseconds). Set to 0 or negative value to disable timeout */
  timeout?: number;
}

/**
 * Internal representation of a load request
 */
interface LoadRequest<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
  retryCount: number;
  maxRetryCount: number;
  retryFactory?: () => Promise<T>;
}

/**
 * Helper type to infer the result object type from the promise object type
 */
type AwaitedObject<T> = {
  [K in keyof T]: T[K] extends Promise<infer U> ? U : T[K]
};

/**
 * Type-safe asset loader class
 *
 * @example
 * ```typescript
 * // Default configuration with 60 second timeout
 * const assetLoader = new AssetLoader();
 *
 * // Configuration with custom settings
 * const customLoader = new AssetLoader({
 *   maxConcurrentLoads: 5,
 *   timeout: 30000 // 30 seconds
 * });
 *
 * // Disable timeout (wait indefinitely)
 * const noTimeoutLoader = new AssetLoader({
 *   timeout: 0 // or any negative value
 * });
 *
 * // Load promises in object format
 * const assets = await assetLoader.load({
 *   environment: Rn.CubeTexture.fromUrl({
 *     baseUrl: '/path/to/environment',
 *     mipmapLevelNumber: 1,
 *     isNamePosNeg: true,
 *     hdriFormat: Rn.HdriFormat.HDR_LINEAR,
 *   }),
 *   specular: Rn.CubeTexture.fromUrl({
 *     baseUrl: '/path/to/specular',
 *     mipmapLevelNumber: 10,
 *     isNamePosNeg: true,
 *     hdriFormat: Rn.HdriFormat.RGBE_PNG,
 *   }),
 *   diffuse: Rn.CubeTexture.fromUrl({
 *     baseUrl: '/path/to/diffuse',
 *     mipmapLevelNumber: 1,
 *     isNamePosNeg: true,
 *     hdriFormat: Rn.HdriFormat.RGBE_PNG,
 *   })
 * });
 *
 * console.log(assets.environment); // CubeTexture
 * console.log(assets.specular); // CubeTexture
 * console.log(assets.diffuse); // CubeTexture
 * ```
 */
export class AssetLoader {
  private config: Required<AssetLoaderConfig>;
  private loadingQueue: LoadRequest<any>[] = [];
  private activeLoads = 0;

  constructor(config: AssetLoaderConfig = {}) {
    this.config = {
      maxConcurrentLoads: config.maxConcurrentLoads ?? 3,
      timeout: config.timeout ?? 60000,
    };
  }

  /**
   * Load promises in object format
   */
  async load<T extends Record<string, Promise<any>>>(
    promiseObject: T
  ): Promise<AwaitedObject<T>> {
    const keys = Object.keys(promiseObject);
    const promises = Object.values(promiseObject);

    const results = await this.loadArray(promises);

    const resultObject = {} as AwaitedObject<T>;
    keys.forEach((key, index) => {
      (resultObject as any)[key] = results[index];
    });

    return resultObject;
  }

  /**
   * Load a single promise
   */
  async loadSingle<T>(promise: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: LoadRequest<T> = {
        promise,
        resolve,
        reject,
        retryCount: 0,
        maxRetryCount: 0,
        retryFactory: undefined,
      };

      this.loadingQueue.push(request);
      this.processQueue();
    });
  }

  /**
   * Load a single promise with multiple retry factories
   */
  async loadWithRetrySingle<T>(
    promiseFactories: Array<() => Promise<T>>
  ): Promise<T> {
    if (promiseFactories.length === 0) {
      throw new Error('At least one promise factory must be provided');
    }

    const [primaryFactory, ...retryFactories] = promiseFactories;
    return this.loadSingleWithMultipleRetries(primaryFactory(), retryFactories);
  }

  /**
   * Load multiple promises in bulk (array format)
   */
  async loadArray<T>(promises: Promise<T>[]): Promise<T[]>;
  /**
   * Load multiple promises in bulk (tuple of different types)
   */
  async loadArray<T extends readonly unknown[]>(
    promises: readonly [...{ [K in keyof T]: Promise<T[K]> }]
  ): Promise<T>;
  async loadArray<T>(promises: Promise<T>[] | readonly Promise<any>[]): Promise<T[] | any[]> {
    const loadPromises = promises.map(promise => this.loadSingle(promise));
    return Promise.all(loadPromises);
  }

  /**
   * Load with retry factories in array format
   */
  async loadWithRetryArray<T>(
    promiseFactories: Array<Array<() => Promise<T>>>
  ): Promise<T[]> {
    const loadPromises = promiseFactories.map(factories => {
      const [primaryFactory, ...retryFactories] = factories;
      return this.loadSingleWithMultipleRetries(primaryFactory(), retryFactories);
    });
    return Promise.all(loadPromises);
  }

  /**
   * Load with retry factories in object format
   */
  async loadWithRetry<T extends Record<string, Promise<any>>>(
    promiseFactories: {
      [K in keyof T]: Array<() => T[K]>
    }
  ): Promise<AwaitedObject<T>> {
    const keys = Object.keys(promiseFactories);
    const factoryArrays = Object.values(promiseFactories);

    const results = await this.loadWithRetryArray(factoryArrays);

    const resultObject = {} as AwaitedObject<T>;
    keys.forEach((key, index) => {
      (resultObject as any)[key] = results[index];
    });

    return resultObject;
  }

  /**
   * Load a single promise with multiple retry factories
   */
  private async loadSingleWithMultipleRetries<T>(
    initialPromise: Promise<T>,
    retryFactories: Array<() => Promise<T>>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: LoadRequest<T> = {
        promise: initialPromise,
        resolve,
        reject,
        retryCount: 0,
        maxRetryCount: retryFactories.length,
        retryFactory: retryFactories.length > 0 ? () => {
          const factoryIndex = Math.min(request.retryCount - 1, retryFactories.length - 1);
          return retryFactories[factoryIndex]();
        } : undefined,
      };

      this.loadingQueue.push(request);
      this.processQueue();
    });
  }

  /**
   * Process the loading queue
   */
  private async processQueue(): Promise<void> {
    if (this.activeLoads >= this.config.maxConcurrentLoads || this.loadingQueue.length === 0) {
      return;
    }

    const request = this.loadingQueue.shift()!;
    this.activeLoads++;

    try {
      const result = await this.executeLoad(request);
      request.resolve(result);
    } catch (error) {
      if (request.retryCount < request.maxRetryCount && request.retryFactory) {
        request.retryCount++;
        request.promise = request.retryFactory();
        this.loadingQueue.unshift(request); // Move to the front for retry
      } else {
        request.reject(error);
      }
    } finally {
      this.activeLoads--;
      this.processQueue(); // Process the next item
    }
  }

  /**
   * Execute the actual loading process
   */
  private async executeLoad<T>(request: LoadRequest<T>): Promise<T> {
    // If timeout is 0 or negative, don't use timeout
    if (this.config.timeout <= 0) {
      return request.promise;
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Load timeout')), this.config.timeout);
    });

    return Promise.race([request.promise, timeoutPromise]);
  }

  /**
   * Get the current loading status
   */
  getLoadingStatus(): { active: number; queued: number } {
    return {
      active: this.activeLoads,
      queued: this.loadingQueue.length,
    };
  }

  /**
   * Wait until all loads are complete
   */
  async waitForAllLoads(): Promise<void> {
    while (this.activeLoads > 0 || this.loadingQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

/**
 * Default asset loader instance
 */
export const defaultAssetLoader = new AssetLoader();
