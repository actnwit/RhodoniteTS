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

  /**
   * Creates a new AssetLoader instance with the specified configuration.
   *
   * @param config - Configuration options for the asset loader
   * @param config.maxConcurrentLoads - Maximum number of concurrent loads (default: 3)
   * @param config.timeout - Timeout duration in milliseconds (default: 60000). Set to 0 or negative to disable
   *
   * @example
   * ```typescript
   * // Default configuration
   * const loader = new AssetLoader();
   *
   * // Custom configuration
   * const customLoader = new AssetLoader({
   *   maxConcurrentLoads: 5,
   *   timeout: 30000
   * });
   * ```
   */
  constructor(config: AssetLoaderConfig = {}) {
    this.config = {
      maxConcurrentLoads: config.maxConcurrentLoads ?? 3,
      timeout: config.timeout ?? 60000,
    };
  }

  /**
   * Loads multiple promises organized as an object with named keys.
   * The result preserves the same structure with resolved values.
   *
   * @template T - Object type where values are promises
   * @param promiseObject - Object containing promises to be loaded
   * @returns Promise that resolves to an object with the same keys but resolved values
   *
   * @example
   * ```typescript
   * const assets = await loader.load({
   *   texture: loadTexture('path/to/texture.jpg'),
   *   model: loadModel('path/to/model.gltf'),
   *   audio: loadAudio('path/to/sound.mp3')
   * });
   *
   * // Type-safe access to resolved values
   * console.log(assets.texture); // Texture
   * console.log(assets.model);   // Model
   * console.log(assets.audio);   // AudioBuffer
   * ```
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
   * Loads a single promise with queue management, timeout, and concurrency control.
   *
   * @template T - The type of value the promise resolves to
   * @param promise - The promise to be loaded
   * @returns Promise that resolves to the same value as the input promise
   *
   * @example
   * ```typescript
   * const texture = await loader.loadSingle(loadTexture('texture.jpg'));
   * const model = await loader.loadSingle(loadModel('model.gltf'));
   * ```
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
   * Loads a single promise with automatic retry using fallback factories.
   * If the first promise fails, it will try the next factory in order.
   *
   * @template T - The type of value the promise resolves to
   * @param promiseFactories - Array of factory functions that create promises, ordered by priority
   * @returns Promise that resolves to the value from the first successful factory
   *
   * @throws {Error} When no promise factories are provided
   *
   * @example
   * ```typescript
   * const texture = await loader.loadWithRetrySingle([
   *   () => loadTexture('high-quality.jpg'),    // Try first
   *   () => loadTexture('medium-quality.jpg'),  // Fallback 1
   *   () => loadTexture('low-quality.jpg')      // Fallback 2
   * ]);
   * ```
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
   * Loads multiple promises in bulk as an array.
   * Supports both homogeneous arrays and heterogeneous tuples with type safety.
   *
   * @template T - The type of values in the array or tuple
   * @param promises - Array or tuple of promises to be loaded
   * @returns Promise that resolves to an array or tuple of resolved values with preserved types
   *
   * @example
   * ```typescript
   * // Homogeneous array
   * const textures = await loader.loadArray([
   *   loadTexture('texture1.jpg'),
   *   loadTexture('texture2.jpg'),
   *   loadTexture('texture3.jpg')
   * ]);
   *
   * // Heterogeneous tuple with type safety
   * const [texture, model, audio] = await loader.loadArray([
   *   loadTexture('texture.jpg'),
   *   loadModel('model.gltf'),
   *   loadAudio('sound.mp3')
   * ] as const);
   * ```
   */
  async loadArray<T>(promises: Promise<T>[]): Promise<T[]>;
  async loadArray<T extends readonly unknown[]>(
    promises: readonly [...{ [K in keyof T]: Promise<T[K]> }]
  ): Promise<T>;
  async loadArray<T>(promises: Promise<T>[] | readonly Promise<any>[]): Promise<T[] | any[]> {
    const loadPromises = promises.map(promise => this.loadSingle(promise));
    return Promise.all(loadPromises);
  }

  /**
   * Loads multiple promises with retry capabilities for each one.
   * Each promise has its own set of factory functions for retry attempts.
   *
   * @template T - The type of values the promises resolve to
   * @param promiseFactories - Array where each element is an array of factory functions for one promise
   * @returns Promise that resolves to an array of resolved values
   *
   * @example
   * ```typescript
   * const assets = await loader.loadWithRetryArray([
   *   [
   *     () => loadTexture('high-res.jpg'),
   *     () => loadTexture('low-res.jpg')
   *   ],
   *   [
   *     () => loadModel('detailed.gltf'),
   *     () => loadModel('simple.gltf')
   *   ]
   * ]);
   * ```
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
   * Loads multiple promises with retry capabilities organized as an object.
   * Combines the structure of `load()` with the retry functionality of `loadWithRetryArray()`.
   *
   * @template T - Object type where values are promises
   * @param promiseFactories - Object where each value is an array of factory functions
   * @returns Promise that resolves to an object with the same keys but resolved values
   *
   * @example
   * ```typescript
   * const assets = await loader.loadWithRetry({
   *   texture: [
   *     () => loadTexture('high-res.jpg'),
   *     () => loadTexture('low-res.jpg')
   *   ],
   *   model: [
   *     () => loadModel('detailed.gltf'),
   *     () => loadModel('simple.gltf')
   *   ]
   * });
   *
   * console.log(assets.texture); // Texture (from successful factory)
   * console.log(assets.model);   // Model (from successful factory)
   * ```
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
   * Internal method to load a single promise with multiple retry factories.
   * Handles the retry logic when the initial promise fails.
   *
   * @private
   * @template T - The type of value the promise resolves to
   * @param initialPromise - The first promise to attempt
   * @param retryFactories - Array of factory functions to use for retries
   * @returns Promise that resolves to the value from the first successful attempt
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
   * Internal method to process the loading queue.
   * Manages concurrency limits and handles retry logic for failed loads.
   *
   * @private
   * @returns Promise that resolves when queue processing is complete
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
   * Internal method to execute the actual loading process with timeout handling.
   * Races the promise against a timeout if configured.
   *
   * @private
   * @template T - The type of value the promise resolves to
   * @param request - The load request to execute
   * @returns Promise that resolves to the loaded value
   *
   * @throws {Error} When the load times out (if timeout is configured)
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
   * Gets the current loading status including active and queued loads.
   * Useful for monitoring loading progress and debugging.
   *
   * @returns Object containing the number of active and queued loads
   *
   * @example
   * ```typescript
   * const status = loader.getLoadingStatus();
   * console.log(`Active: ${status.active}, Queued: ${status.queued}`);
   * ```
   */
  getLoadingStatus(): { active: number; queued: number } {
    return {
      active: this.activeLoads,
      queued: this.loadingQueue.length,
    };
  }

  /**
   * Waits until all currently active and queued loads are complete.
   * Useful for ensuring all assets are loaded before proceeding.
   *
   * @returns Promise that resolves when all loads are complete
   *
   * @example
   * ```typescript
   * // Start multiple loads
   * loader.loadSingle(loadTexture('texture.jpg'));
   * loader.loadSingle(loadModel('model.gltf'));
   *
   * // Wait for all to complete
   * await loader.waitForAllLoads();
   * console.log('All assets loaded!');
   * ```
   */
  async waitForAllLoads(): Promise<void> {
    while (this.activeLoads > 0 || this.loadingQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

/**
 * Default asset loader instance with standard configuration.
 * Provides a convenient singleton for most use cases.
 *
 * @example
 * ```typescript
 * import { defaultAssetLoader } from './AssetLoader';
 *
 * const assets = await defaultAssetLoader.load({
 *   texture: loadTexture('texture.jpg'),
 *   model: loadModel('model.gltf')
 * });
 * ```
 */
export const defaultAssetLoader = new AssetLoader();
