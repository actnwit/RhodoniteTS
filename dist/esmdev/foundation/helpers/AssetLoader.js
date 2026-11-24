// src/foundation/helpers/AssetLoader.ts
var AssetLoader = class {
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
  constructor(config = {}) {
    this.loadingQueue = [];
    this.activeLoads = 0;
    var _a, _b;
    this.config = {
      maxConcurrentLoads: (_a = config.maxConcurrentLoads) != null ? _a : 3,
      timeout: (_b = config.timeout) != null ? _b : 6e4
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
  async load(promiseObject) {
    const keys = Object.keys(promiseObject);
    const promises = Object.values(promiseObject);
    const results = await this.loadArray(promises);
    const resultObject = {};
    keys.forEach((key, index) => {
      resultObject[key] = results[index];
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
  async loadSingle(promise) {
    return new Promise((resolve, reject) => {
      const request = {
        promise,
        resolve,
        reject,
        retryCount: 0,
        maxRetryCount: 0,
        retryFactory: void 0
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
  async loadWithRetrySingle(promiseFactories) {
    if (promiseFactories.length === 0) {
      throw new Error("At least one promise factory must be provided");
    }
    const [primaryFactory, ...retryFactories] = promiseFactories;
    return this.loadSingleWithMultipleRetries(primaryFactory(), retryFactories);
  }
  async loadArray(promises) {
    const loadPromises = promises.map((promise) => this.loadSingle(promise));
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
  async loadWithRetryArray(promiseFactories) {
    const loadPromises = promiseFactories.map((factories) => {
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
  async loadWithRetry(promiseFactories) {
    const keys = Object.keys(promiseFactories);
    const factoryArrays = Object.values(promiseFactories);
    const results = await this.loadWithRetryArray(factoryArrays);
    const resultObject = {};
    keys.forEach((key, index) => {
      resultObject[key] = results[index];
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
  async loadSingleWithMultipleRetries(initialPromise, retryFactories) {
    return new Promise((resolve, reject) => {
      const request = {
        promise: initialPromise,
        resolve,
        reject,
        retryCount: 0,
        maxRetryCount: retryFactories.length,
        retryFactory: retryFactories.length > 0 ? () => {
          const factoryIndex = Math.min(request.retryCount - 1, retryFactories.length - 1);
          return retryFactories[factoryIndex]();
        } : void 0
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
  async processQueue() {
    if (this.activeLoads >= this.config.maxConcurrentLoads || this.loadingQueue.length === 0) {
      return;
    }
    const request = this.loadingQueue.shift();
    this.activeLoads++;
    try {
      const result = await this.executeLoad(request);
      request.resolve(result);
    } catch (error) {
      if (request.retryCount < request.maxRetryCount && request.retryFactory) {
        request.retryCount++;
        request.promise = request.retryFactory();
        this.loadingQueue.unshift(request);
      } else {
        request.reject(error);
      }
    } finally {
      this.activeLoads--;
      this.processQueue();
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
  async executeLoad(request) {
    if (this.config.timeout <= 0) {
      return request.promise;
    }
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Load timeout")), this.config.timeout);
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
  getLoadingStatus() {
    return {
      active: this.activeLoads,
      queued: this.loadingQueue.length
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
  async waitForAllLoads() {
    while (this.activeLoads > 0 || this.loadingQueue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
};
var defaultAssetLoader = new AssetLoader();
export {
  AssetLoader,
  defaultAssetLoader
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vaGVscGVycy9Bc3NldExvYWRlci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBBc3NldCBsb2FkZXIgY29uZmlndXJhdGlvbiBpbnRlcmZhY2VcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBc3NldExvYWRlckNvbmZpZyB7XG4gIC8qKiBMaW1pdCBvbiB0aGUgbnVtYmVyIG9mIGNvbmN1cnJlbnQgbG9hZHMgKi9cbiAgbWF4Q29uY3VycmVudExvYWRzPzogbnVtYmVyO1xuICAvKiogVGltZW91dCBkdXJhdGlvbiAoaW4gbWlsbGlzZWNvbmRzKS4gU2V0IHRvIDAgb3IgbmVnYXRpdmUgdmFsdWUgdG8gZGlzYWJsZSB0aW1lb3V0ICovXG4gIHRpbWVvdXQ/OiBudW1iZXI7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgcmVwcmVzZW50YXRpb24gb2YgYSBsb2FkIHJlcXVlc3RcbiAqL1xuaW50ZXJmYWNlIExvYWRSZXF1ZXN0PFQ+IHtcbiAgcHJvbWlzZTogUHJvbWlzZTxUPjtcbiAgcmVzb2x2ZTogKHZhbHVlOiBUKSA9PiB2b2lkO1xuICByZWplY3Q6IChyZWFzb246IGFueSkgPT4gdm9pZDtcbiAgcmV0cnlDb3VudDogbnVtYmVyO1xuICBtYXhSZXRyeUNvdW50OiBudW1iZXI7XG4gIHJldHJ5RmFjdG9yeT86ICgpID0+IFByb21pc2U8VD47XG59XG5cbi8qKlxuICogSGVscGVyIHR5cGUgdG8gaW5mZXIgdGhlIHJlc3VsdCBvYmplY3QgdHlwZSBmcm9tIHRoZSBwcm9taXNlIG9iamVjdCB0eXBlXG4gKi9cbnR5cGUgQXdhaXRlZE9iamVjdDxUPiA9IHtcbiAgW0sgaW4ga2V5b2YgVF06IFRbS10gZXh0ZW5kcyBQcm9taXNlPGluZmVyIFU+ID8gVSA6IFRbS107XG59O1xuXG4vKipcbiAqIFR5cGUtc2FmZSBhc3NldCBsb2FkZXIgY2xhc3NcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogLy8gRGVmYXVsdCBjb25maWd1cmF0aW9uIHdpdGggNjAgc2Vjb25kIHRpbWVvdXRcbiAqIGNvbnN0IGFzc2V0TG9hZGVyID0gbmV3IEFzc2V0TG9hZGVyKCk7XG4gKlxuICogLy8gQ29uZmlndXJhdGlvbiB3aXRoIGN1c3RvbSBzZXR0aW5nc1xuICogY29uc3QgY3VzdG9tTG9hZGVyID0gbmV3IEFzc2V0TG9hZGVyKHtcbiAqICAgbWF4Q29uY3VycmVudExvYWRzOiA1LFxuICogICB0aW1lb3V0OiAzMDAwMCAvLyAzMCBzZWNvbmRzXG4gKiB9KTtcbiAqXG4gKiAvLyBEaXNhYmxlIHRpbWVvdXQgKHdhaXQgaW5kZWZpbml0ZWx5KVxuICogY29uc3Qgbm9UaW1lb3V0TG9hZGVyID0gbmV3IEFzc2V0TG9hZGVyKHtcbiAqICAgdGltZW91dDogMCAvLyBvciBhbnkgbmVnYXRpdmUgdmFsdWVcbiAqIH0pO1xuICpcbiAqIC8vIExvYWQgcHJvbWlzZXMgaW4gb2JqZWN0IGZvcm1hdFxuICogY29uc3QgYXNzZXRzID0gYXdhaXQgYXNzZXRMb2FkZXIubG9hZCh7XG4gKiAgIGVudmlyb25tZW50OiBSbi5DdWJlVGV4dHVyZS5mcm9tVXJsKHtcbiAqICAgICBiYXNlVXJsOiAnL3BhdGgvdG8vZW52aXJvbm1lbnQnLFxuICogICAgIG1pcG1hcExldmVsTnVtYmVyOiAxLFxuICogICAgIGlzTmFtZVBvc05lZzogdHJ1ZSxcbiAqICAgICBoZHJpRm9ybWF0OiBSbi5IZHJpRm9ybWF0LkhEUl9MSU5FQVIsXG4gKiAgIH0pLFxuICogICBzcGVjdWxhcjogUm4uQ3ViZVRleHR1cmUuZnJvbVVybCh7XG4gKiAgICAgYmFzZVVybDogJy9wYXRoL3RvL3NwZWN1bGFyJyxcbiAqICAgICBtaXBtYXBMZXZlbE51bWJlcjogMTAsXG4gKiAgICAgaXNOYW1lUG9zTmVnOiB0cnVlLFxuICogICAgIGhkcmlGb3JtYXQ6IFJuLkhkcmlGb3JtYXQuUkdCRV9QTkcsXG4gKiAgIH0pLFxuICogICBkaWZmdXNlOiBSbi5DdWJlVGV4dHVyZS5mcm9tVXJsKHtcbiAqICAgICBiYXNlVXJsOiAnL3BhdGgvdG8vZGlmZnVzZScsXG4gKiAgICAgbWlwbWFwTGV2ZWxOdW1iZXI6IDEsXG4gKiAgICAgaXNOYW1lUG9zTmVnOiB0cnVlLFxuICogICAgIGhkcmlGb3JtYXQ6IFJuLkhkcmlGb3JtYXQuUkdCRV9QTkcsXG4gKiAgIH0pXG4gKiB9KTtcbiAqXG4gKiBjb25zb2xlLmxvZyhhc3NldHMuZW52aXJvbm1lbnQpOyAvLyBDdWJlVGV4dHVyZVxuICogY29uc29sZS5sb2coYXNzZXRzLnNwZWN1bGFyKTsgLy8gQ3ViZVRleHR1cmVcbiAqIGNvbnNvbGUubG9nKGFzc2V0cy5kaWZmdXNlKTsgLy8gQ3ViZVRleHR1cmVcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgQXNzZXRMb2FkZXIge1xuICBwcml2YXRlIGNvbmZpZzogUmVxdWlyZWQ8QXNzZXRMb2FkZXJDb25maWc+O1xuICBwcml2YXRlIGxvYWRpbmdRdWV1ZTogTG9hZFJlcXVlc3Q8YW55PltdID0gW107XG4gIHByaXZhdGUgYWN0aXZlTG9hZHMgPSAwO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IEFzc2V0TG9hZGVyIGluc3RhbmNlIHdpdGggdGhlIHNwZWNpZmllZCBjb25maWd1cmF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gY29uZmlnIC0gQ29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgYXNzZXQgbG9hZGVyXG4gICAqIEBwYXJhbSBjb25maWcubWF4Q29uY3VycmVudExvYWRzIC0gTWF4aW11bSBudW1iZXIgb2YgY29uY3VycmVudCBsb2FkcyAoZGVmYXVsdDogMylcbiAgICogQHBhcmFtIGNvbmZpZy50aW1lb3V0IC0gVGltZW91dCBkdXJhdGlvbiBpbiBtaWxsaXNlY29uZHMgKGRlZmF1bHQ6IDYwMDAwKS4gU2V0IHRvIDAgb3IgbmVnYXRpdmUgdG8gZGlzYWJsZVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIC8vIERlZmF1bHQgY29uZmlndXJhdGlvblxuICAgKiBjb25zdCBsb2FkZXIgPSBuZXcgQXNzZXRMb2FkZXIoKTtcbiAgICpcbiAgICogLy8gQ3VzdG9tIGNvbmZpZ3VyYXRpb25cbiAgICogY29uc3QgY3VzdG9tTG9hZGVyID0gbmV3IEFzc2V0TG9hZGVyKHtcbiAgICogICBtYXhDb25jdXJyZW50TG9hZHM6IDUsXG4gICAqICAgdGltZW91dDogMzAwMDBcbiAgICogfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgY29uc3RydWN0b3IoY29uZmlnOiBBc3NldExvYWRlckNvbmZpZyA9IHt9KSB7XG4gICAgdGhpcy5jb25maWcgPSB7XG4gICAgICBtYXhDb25jdXJyZW50TG9hZHM6IGNvbmZpZy5tYXhDb25jdXJyZW50TG9hZHMgPz8gMyxcbiAgICAgIHRpbWVvdXQ6IGNvbmZpZy50aW1lb3V0ID8/IDYwMDAwLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgbXVsdGlwbGUgcHJvbWlzZXMgb3JnYW5pemVkIGFzIGFuIG9iamVjdCB3aXRoIG5hbWVkIGtleXMuXG4gICAqIFRoZSByZXN1bHQgcHJlc2VydmVzIHRoZSBzYW1lIHN0cnVjdHVyZSB3aXRoIHJlc29sdmVkIHZhbHVlcy5cbiAgICpcbiAgICogQHRlbXBsYXRlIFQgLSBPYmplY3QgdHlwZSB3aGVyZSB2YWx1ZXMgYXJlIHByb21pc2VzXG4gICAqIEBwYXJhbSBwcm9taXNlT2JqZWN0IC0gT2JqZWN0IGNvbnRhaW5pbmcgcHJvbWlzZXMgdG8gYmUgbG9hZGVkXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byBhbiBvYmplY3Qgd2l0aCB0aGUgc2FtZSBrZXlzIGJ1dCByZXNvbHZlZCB2YWx1ZXNcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBhc3NldHMgPSBhd2FpdCBsb2FkZXIubG9hZCh7XG4gICAqICAgdGV4dHVyZTogbG9hZFRleHR1cmUoJ3BhdGgvdG8vdGV4dHVyZS5qcGcnKSxcbiAgICogICBtb2RlbDogbG9hZE1vZGVsKCdwYXRoL3RvL21vZGVsLmdsdGYnKSxcbiAgICogICBhdWRpbzogbG9hZEF1ZGlvKCdwYXRoL3RvL3NvdW5kLm1wMycpXG4gICAqIH0pO1xuICAgKlxuICAgKiAvLyBUeXBlLXNhZmUgYWNjZXNzIHRvIHJlc29sdmVkIHZhbHVlc1xuICAgKiBjb25zb2xlLmxvZyhhc3NldHMudGV4dHVyZSk7IC8vIFRleHR1cmVcbiAgICogY29uc29sZS5sb2coYXNzZXRzLm1vZGVsKTsgICAvLyBNb2RlbFxuICAgKiBjb25zb2xlLmxvZyhhc3NldHMuYXVkaW8pOyAgIC8vIEF1ZGlvQnVmZmVyXG4gICAqIGBgYFxuICAgKi9cbiAgYXN5bmMgbG9hZDxUIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgUHJvbWlzZTxhbnk+Pj4ocHJvbWlzZU9iamVjdDogVCk6IFByb21pc2U8QXdhaXRlZE9iamVjdDxUPj4ge1xuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9taXNlT2JqZWN0KTtcbiAgICBjb25zdCBwcm9taXNlcyA9IE9iamVjdC52YWx1ZXMocHJvbWlzZU9iamVjdCk7XG5cbiAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgdGhpcy5sb2FkQXJyYXkocHJvbWlzZXMpO1xuXG4gICAgY29uc3QgcmVzdWx0T2JqZWN0ID0ge30gYXMgQXdhaXRlZE9iamVjdDxUPjtcbiAgICBrZXlzLmZvckVhY2goKGtleSwgaW5kZXgpID0+IHtcbiAgICAgIChyZXN1bHRPYmplY3QgYXMgYW55KVtrZXldID0gcmVzdWx0c1tpbmRleF07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0T2JqZWN0O1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGEgc2luZ2xlIHByb21pc2Ugd2l0aCBxdWV1ZSBtYW5hZ2VtZW50LCB0aW1lb3V0LCBhbmQgY29uY3VycmVuY3kgY29udHJvbC5cbiAgICpcbiAgICogQHRlbXBsYXRlIFQgLSBUaGUgdHlwZSBvZiB2YWx1ZSB0aGUgcHJvbWlzZSByZXNvbHZlcyB0b1xuICAgKiBAcGFyYW0gcHJvbWlzZSAtIFRoZSBwcm9taXNlIHRvIGJlIGxvYWRlZFxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHNhbWUgdmFsdWUgYXMgdGhlIGlucHV0IHByb21pc2VcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCB0ZXh0dXJlID0gYXdhaXQgbG9hZGVyLmxvYWRTaW5nbGUobG9hZFRleHR1cmUoJ3RleHR1cmUuanBnJykpO1xuICAgKiBjb25zdCBtb2RlbCA9IGF3YWl0IGxvYWRlci5sb2FkU2luZ2xlKGxvYWRNb2RlbCgnbW9kZWwuZ2x0ZicpKTtcbiAgICogYGBgXG4gICAqL1xuICBhc3luYyBsb2FkU2luZ2xlPFQ+KHByb21pc2U6IFByb21pc2U8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogTG9hZFJlcXVlc3Q8VD4gPSB7XG4gICAgICAgIHByb21pc2UsXG4gICAgICAgIHJlc29sdmUsXG4gICAgICAgIHJlamVjdCxcbiAgICAgICAgcmV0cnlDb3VudDogMCxcbiAgICAgICAgbWF4UmV0cnlDb3VudDogMCxcbiAgICAgICAgcmV0cnlGYWN0b3J5OiB1bmRlZmluZWQsXG4gICAgICB9O1xuXG4gICAgICB0aGlzLmxvYWRpbmdRdWV1ZS5wdXNoKHJlcXVlc3QpO1xuICAgICAgdGhpcy5wcm9jZXNzUXVldWUoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhIHNpbmdsZSBwcm9taXNlIHdpdGggYXV0b21hdGljIHJldHJ5IHVzaW5nIGZhbGxiYWNrIGZhY3Rvcmllcy5cbiAgICogSWYgdGhlIGZpcnN0IHByb21pc2UgZmFpbHMsIGl0IHdpbGwgdHJ5IHRoZSBuZXh0IGZhY3RvcnkgaW4gb3JkZXIuXG4gICAqXG4gICAqIEB0ZW1wbGF0ZSBUIC0gVGhlIHR5cGUgb2YgdmFsdWUgdGhlIHByb21pc2UgcmVzb2x2ZXMgdG9cbiAgICogQHBhcmFtIHByb21pc2VGYWN0b3JpZXMgLSBBcnJheSBvZiBmYWN0b3J5IGZ1bmN0aW9ucyB0aGF0IGNyZWF0ZSBwcm9taXNlcywgb3JkZXJlZCBieSBwcmlvcml0eVxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHZhbHVlIGZyb20gdGhlIGZpcnN0IHN1Y2Nlc3NmdWwgZmFjdG9yeVxuICAgKlxuICAgKiBAdGhyb3dzIHtFcnJvcn0gV2hlbiBubyBwcm9taXNlIGZhY3RvcmllcyBhcmUgcHJvdmlkZWRcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCB0ZXh0dXJlID0gYXdhaXQgbG9hZGVyLmxvYWRXaXRoUmV0cnlTaW5nbGUoW1xuICAgKiAgICgpID0+IGxvYWRUZXh0dXJlKCdoaWdoLXF1YWxpdHkuanBnJyksICAgIC8vIFRyeSBmaXJzdFxuICAgKiAgICgpID0+IGxvYWRUZXh0dXJlKCdtZWRpdW0tcXVhbGl0eS5qcGcnKSwgIC8vIEZhbGxiYWNrIDFcbiAgICogICAoKSA9PiBsb2FkVGV4dHVyZSgnbG93LXF1YWxpdHkuanBnJykgICAgICAvLyBGYWxsYmFjayAyXG4gICAqIF0pO1xuICAgKiBgYGBcbiAgICovXG4gIGFzeW5jIGxvYWRXaXRoUmV0cnlTaW5nbGU8VD4ocHJvbWlzZUZhY3RvcmllczogQXJyYXk8KCkgPT4gUHJvbWlzZTxUPj4pOiBQcm9taXNlPFQ+IHtcbiAgICBpZiAocHJvbWlzZUZhY3Rvcmllcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQXQgbGVhc3Qgb25lIHByb21pc2UgZmFjdG9yeSBtdXN0IGJlIHByb3ZpZGVkJyk7XG4gICAgfVxuXG4gICAgY29uc3QgW3ByaW1hcnlGYWN0b3J5LCAuLi5yZXRyeUZhY3Rvcmllc10gPSBwcm9taXNlRmFjdG9yaWVzO1xuICAgIHJldHVybiB0aGlzLmxvYWRTaW5nbGVXaXRoTXVsdGlwbGVSZXRyaWVzKHByaW1hcnlGYWN0b3J5KCksIHJldHJ5RmFjdG9yaWVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBtdWx0aXBsZSBwcm9taXNlcyBpbiBidWxrIGFzIGFuIGFycmF5LlxuICAgKiBTdXBwb3J0cyBib3RoIGhvbW9nZW5lb3VzIGFycmF5cyBhbmQgaGV0ZXJvZ2VuZW91cyB0dXBsZXMgd2l0aCB0eXBlIHNhZmV0eS5cbiAgICpcbiAgICogQHRlbXBsYXRlIFQgLSBUaGUgdHlwZSBvZiB2YWx1ZXMgaW4gdGhlIGFycmF5IG9yIHR1cGxlXG4gICAqIEBwYXJhbSBwcm9taXNlcyAtIEFycmF5IG9yIHR1cGxlIG9mIHByb21pc2VzIHRvIGJlIGxvYWRlZFxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gYXJyYXkgb3IgdHVwbGUgb2YgcmVzb2x2ZWQgdmFsdWVzIHdpdGggcHJlc2VydmVkIHR5cGVzXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogLy8gSG9tb2dlbmVvdXMgYXJyYXlcbiAgICogY29uc3QgdGV4dHVyZXMgPSBhd2FpdCBsb2FkZXIubG9hZEFycmF5KFtcbiAgICogICBsb2FkVGV4dHVyZSgndGV4dHVyZTEuanBnJyksXG4gICAqICAgbG9hZFRleHR1cmUoJ3RleHR1cmUyLmpwZycpLFxuICAgKiAgIGxvYWRUZXh0dXJlKCd0ZXh0dXJlMy5qcGcnKVxuICAgKiBdKTtcbiAgICpcbiAgICogLy8gSGV0ZXJvZ2VuZW91cyB0dXBsZSB3aXRoIHR5cGUgc2FmZXR5XG4gICAqIGNvbnN0IFt0ZXh0dXJlLCBtb2RlbCwgYXVkaW9dID0gYXdhaXQgbG9hZGVyLmxvYWRBcnJheShbXG4gICAqICAgbG9hZFRleHR1cmUoJ3RleHR1cmUuanBnJyksXG4gICAqICAgbG9hZE1vZGVsKCdtb2RlbC5nbHRmJyksXG4gICAqICAgbG9hZEF1ZGlvKCdzb3VuZC5tcDMnKVxuICAgKiBdIGFzIGNvbnN0KTtcbiAgICogYGBgXG4gICAqL1xuICBhc3luYyBsb2FkQXJyYXk8VD4ocHJvbWlzZXM6IFByb21pc2U8VD5bXSk6IFByb21pc2U8VFtdPjtcbiAgYXN5bmMgbG9hZEFycmF5PFQgZXh0ZW5kcyByZWFkb25seSB1bmtub3duW10+KHByb21pc2VzOiByZWFkb25seSBbLi4ueyBbSyBpbiBrZXlvZiBUXTogUHJvbWlzZTxUW0tdPiB9XSk6IFByb21pc2U8VD47XG4gIGFzeW5jIGxvYWRBcnJheTxUPihwcm9taXNlczogUHJvbWlzZTxUPltdIHwgcmVhZG9ubHkgUHJvbWlzZTxhbnk+W10pOiBQcm9taXNlPFRbXSB8IGFueVtdPiB7XG4gICAgY29uc3QgbG9hZFByb21pc2VzID0gcHJvbWlzZXMubWFwKHByb21pc2UgPT4gdGhpcy5sb2FkU2luZ2xlKHByb21pc2UpKTtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwobG9hZFByb21pc2VzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBtdWx0aXBsZSBwcm9taXNlcyB3aXRoIHJldHJ5IGNhcGFiaWxpdGllcyBmb3IgZWFjaCBvbmUuXG4gICAqIEVhY2ggcHJvbWlzZSBoYXMgaXRzIG93biBzZXQgb2YgZmFjdG9yeSBmdW5jdGlvbnMgZm9yIHJldHJ5IGF0dGVtcHRzLlxuICAgKlxuICAgKiBAdGVtcGxhdGUgVCAtIFRoZSB0eXBlIG9mIHZhbHVlcyB0aGUgcHJvbWlzZXMgcmVzb2x2ZSB0b1xuICAgKiBAcGFyYW0gcHJvbWlzZUZhY3RvcmllcyAtIEFycmF5IHdoZXJlIGVhY2ggZWxlbWVudCBpcyBhbiBhcnJheSBvZiBmYWN0b3J5IGZ1bmN0aW9ucyBmb3Igb25lIHByb21pc2VcbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGFuIGFycmF5IG9mIHJlc29sdmVkIHZhbHVlc1xuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGFzc2V0cyA9IGF3YWl0IGxvYWRlci5sb2FkV2l0aFJldHJ5QXJyYXkoW1xuICAgKiAgIFtcbiAgICogICAgICgpID0+IGxvYWRUZXh0dXJlKCdoaWdoLXJlcy5qcGcnKSxcbiAgICogICAgICgpID0+IGxvYWRUZXh0dXJlKCdsb3ctcmVzLmpwZycpXG4gICAqICAgXSxcbiAgICogICBbXG4gICAqICAgICAoKSA9PiBsb2FkTW9kZWwoJ2RldGFpbGVkLmdsdGYnKSxcbiAgICogICAgICgpID0+IGxvYWRNb2RlbCgnc2ltcGxlLmdsdGYnKVxuICAgKiAgIF1cbiAgICogXSk7XG4gICAqIGBgYFxuICAgKi9cbiAgYXN5bmMgbG9hZFdpdGhSZXRyeUFycmF5PFQ+KHByb21pc2VGYWN0b3JpZXM6IEFycmF5PEFycmF5PCgpID0+IFByb21pc2U8VD4+Pik6IFByb21pc2U8VFtdPiB7XG4gICAgY29uc3QgbG9hZFByb21pc2VzID0gcHJvbWlzZUZhY3Rvcmllcy5tYXAoZmFjdG9yaWVzID0+IHtcbiAgICAgIGNvbnN0IFtwcmltYXJ5RmFjdG9yeSwgLi4ucmV0cnlGYWN0b3JpZXNdID0gZmFjdG9yaWVzO1xuICAgICAgcmV0dXJuIHRoaXMubG9hZFNpbmdsZVdpdGhNdWx0aXBsZVJldHJpZXMocHJpbWFyeUZhY3RvcnkoKSwgcmV0cnlGYWN0b3JpZXMpO1xuICAgIH0pO1xuICAgIHJldHVybiBQcm9taXNlLmFsbChsb2FkUHJvbWlzZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIG11bHRpcGxlIHByb21pc2VzIHdpdGggcmV0cnkgY2FwYWJpbGl0aWVzIG9yZ2FuaXplZCBhcyBhbiBvYmplY3QuXG4gICAqIENvbWJpbmVzIHRoZSBzdHJ1Y3R1cmUgb2YgYGxvYWQoKWAgd2l0aCB0aGUgcmV0cnkgZnVuY3Rpb25hbGl0eSBvZiBgbG9hZFdpdGhSZXRyeUFycmF5KClgLlxuICAgKlxuICAgKiBAdGVtcGxhdGUgVCAtIE9iamVjdCB0eXBlIHdoZXJlIHZhbHVlcyBhcmUgcHJvbWlzZXNcbiAgICogQHBhcmFtIHByb21pc2VGYWN0b3JpZXMgLSBPYmplY3Qgd2hlcmUgZWFjaCB2YWx1ZSBpcyBhbiBhcnJheSBvZiBmYWN0b3J5IGZ1bmN0aW9uc1xuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gb2JqZWN0IHdpdGggdGhlIHNhbWUga2V5cyBidXQgcmVzb2x2ZWQgdmFsdWVzXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgYXNzZXRzID0gYXdhaXQgbG9hZGVyLmxvYWRXaXRoUmV0cnkoe1xuICAgKiAgIHRleHR1cmU6IFtcbiAgICogICAgICgpID0+IGxvYWRUZXh0dXJlKCdoaWdoLXJlcy5qcGcnKSxcbiAgICogICAgICgpID0+IGxvYWRUZXh0dXJlKCdsb3ctcmVzLmpwZycpXG4gICAqICAgXSxcbiAgICogICBtb2RlbDogW1xuICAgKiAgICAgKCkgPT4gbG9hZE1vZGVsKCdkZXRhaWxlZC5nbHRmJyksXG4gICAqICAgICAoKSA9PiBsb2FkTW9kZWwoJ3NpbXBsZS5nbHRmJylcbiAgICogICBdXG4gICAqIH0pO1xuICAgKlxuICAgKiBjb25zb2xlLmxvZyhhc3NldHMudGV4dHVyZSk7IC8vIFRleHR1cmUgKGZyb20gc3VjY2Vzc2Z1bCBmYWN0b3J5KVxuICAgKiBjb25zb2xlLmxvZyhhc3NldHMubW9kZWwpOyAgIC8vIE1vZGVsIChmcm9tIHN1Y2Nlc3NmdWwgZmFjdG9yeSlcbiAgICogYGBgXG4gICAqL1xuICBhc3luYyBsb2FkV2l0aFJldHJ5PFQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCBQcm9taXNlPGFueT4+PihcbiAgICBwcm9taXNlRmFjdG9yaWVzOiB7XG4gICAgICBbSyBpbiBrZXlvZiBUXTogQXJyYXk8KCkgPT4gVFtLXT47XG4gICAgfVxuICApOiBQcm9taXNlPEF3YWl0ZWRPYmplY3Q8VD4+IHtcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocHJvbWlzZUZhY3Rvcmllcyk7XG4gICAgY29uc3QgZmFjdG9yeUFycmF5cyA9IE9iamVjdC52YWx1ZXMocHJvbWlzZUZhY3Rvcmllcyk7XG5cbiAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgdGhpcy5sb2FkV2l0aFJldHJ5QXJyYXkoZmFjdG9yeUFycmF5cyk7XG5cbiAgICBjb25zdCByZXN1bHRPYmplY3QgPSB7fSBhcyBBd2FpdGVkT2JqZWN0PFQ+O1xuICAgIGtleXMuZm9yRWFjaCgoa2V5LCBpbmRleCkgPT4ge1xuICAgICAgKHJlc3VsdE9iamVjdCBhcyBhbnkpW2tleV0gPSByZXN1bHRzW2luZGV4XTtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHRPYmplY3Q7XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJuYWwgbWV0aG9kIHRvIGxvYWQgYSBzaW5nbGUgcHJvbWlzZSB3aXRoIG11bHRpcGxlIHJldHJ5IGZhY3Rvcmllcy5cbiAgICogSGFuZGxlcyB0aGUgcmV0cnkgbG9naWMgd2hlbiB0aGUgaW5pdGlhbCBwcm9taXNlIGZhaWxzLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAdGVtcGxhdGUgVCAtIFRoZSB0eXBlIG9mIHZhbHVlIHRoZSBwcm9taXNlIHJlc29sdmVzIHRvXG4gICAqIEBwYXJhbSBpbml0aWFsUHJvbWlzZSAtIFRoZSBmaXJzdCBwcm9taXNlIHRvIGF0dGVtcHRcbiAgICogQHBhcmFtIHJldHJ5RmFjdG9yaWVzIC0gQXJyYXkgb2YgZmFjdG9yeSBmdW5jdGlvbnMgdG8gdXNlIGZvciByZXRyaWVzXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0aGUgdmFsdWUgZnJvbSB0aGUgZmlyc3Qgc3VjY2Vzc2Z1bCBhdHRlbXB0XG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGxvYWRTaW5nbGVXaXRoTXVsdGlwbGVSZXRyaWVzPFQ+KFxuICAgIGluaXRpYWxQcm9taXNlOiBQcm9taXNlPFQ+LFxuICAgIHJldHJ5RmFjdG9yaWVzOiBBcnJheTwoKSA9PiBQcm9taXNlPFQ+PlxuICApOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogTG9hZFJlcXVlc3Q8VD4gPSB7XG4gICAgICAgIHByb21pc2U6IGluaXRpYWxQcm9taXNlLFxuICAgICAgICByZXNvbHZlLFxuICAgICAgICByZWplY3QsXG4gICAgICAgIHJldHJ5Q291bnQ6IDAsXG4gICAgICAgIG1heFJldHJ5Q291bnQ6IHJldHJ5RmFjdG9yaWVzLmxlbmd0aCxcbiAgICAgICAgcmV0cnlGYWN0b3J5OlxuICAgICAgICAgIHJldHJ5RmFjdG9yaWVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgID8gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhY3RvcnlJbmRleCA9IE1hdGgubWluKHJlcXVlc3QucmV0cnlDb3VudCAtIDEsIHJldHJ5RmFjdG9yaWVzLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXRyeUZhY3Rvcmllc1tmYWN0b3J5SW5kZXhdKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgfTtcblxuICAgICAgdGhpcy5sb2FkaW5nUXVldWUucHVzaChyZXF1ZXN0KTtcbiAgICAgIHRoaXMucHJvY2Vzc1F1ZXVlKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJuYWwgbWV0aG9kIHRvIHByb2Nlc3MgdGhlIGxvYWRpbmcgcXVldWUuXG4gICAqIE1hbmFnZXMgY29uY3VycmVuY3kgbGltaXRzIGFuZCBoYW5kbGVzIHJldHJ5IGxvZ2ljIGZvciBmYWlsZWQgbG9hZHMuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHF1ZXVlIHByb2Nlc3NpbmcgaXMgY29tcGxldGVcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcHJvY2Vzc1F1ZXVlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmFjdGl2ZUxvYWRzID49IHRoaXMuY29uZmlnLm1heENvbmN1cnJlbnRMb2FkcyB8fCB0aGlzLmxvYWRpbmdRdWV1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5sb2FkaW5nUXVldWUuc2hpZnQoKSE7XG4gICAgdGhpcy5hY3RpdmVMb2FkcysrO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZXhlY3V0ZUxvYWQocmVxdWVzdCk7XG4gICAgICByZXF1ZXN0LnJlc29sdmUocmVzdWx0KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKHJlcXVlc3QucmV0cnlDb3VudCA8IHJlcXVlc3QubWF4UmV0cnlDb3VudCAmJiByZXF1ZXN0LnJldHJ5RmFjdG9yeSkge1xuICAgICAgICByZXF1ZXN0LnJldHJ5Q291bnQrKztcbiAgICAgICAgcmVxdWVzdC5wcm9taXNlID0gcmVxdWVzdC5yZXRyeUZhY3RvcnkoKTtcbiAgICAgICAgdGhpcy5sb2FkaW5nUXVldWUudW5zaGlmdChyZXF1ZXN0KTsgLy8gTW92ZSB0byB0aGUgZnJvbnQgZm9yIHJldHJ5XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXF1ZXN0LnJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuYWN0aXZlTG9hZHMtLTtcbiAgICAgIHRoaXMucHJvY2Vzc1F1ZXVlKCk7IC8vIFByb2Nlc3MgdGhlIG5leHQgaXRlbVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBtZXRob2QgdG8gZXhlY3V0ZSB0aGUgYWN0dWFsIGxvYWRpbmcgcHJvY2VzcyB3aXRoIHRpbWVvdXQgaGFuZGxpbmcuXG4gICAqIFJhY2VzIHRoZSBwcm9taXNlIGFnYWluc3QgYSB0aW1lb3V0IGlmIGNvbmZpZ3VyZWQuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEB0ZW1wbGF0ZSBUIC0gVGhlIHR5cGUgb2YgdmFsdWUgdGhlIHByb21pc2UgcmVzb2x2ZXMgdG9cbiAgICogQHBhcmFtIHJlcXVlc3QgLSBUaGUgbG9hZCByZXF1ZXN0IHRvIGV4ZWN1dGVcbiAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBsb2FkZWQgdmFsdWVcbiAgICpcbiAgICogQHRocm93cyB7RXJyb3J9IFdoZW4gdGhlIGxvYWQgdGltZXMgb3V0IChpZiB0aW1lb3V0IGlzIGNvbmZpZ3VyZWQpXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGV4ZWN1dGVMb2FkPFQ+KHJlcXVlc3Q6IExvYWRSZXF1ZXN0PFQ+KTogUHJvbWlzZTxUPiB7XG4gICAgLy8gSWYgdGltZW91dCBpcyAwIG9yIG5lZ2F0aXZlLCBkb24ndCB1c2UgdGltZW91dFxuICAgIGlmICh0aGlzLmNvbmZpZy50aW1lb3V0IDw9IDApIHtcbiAgICAgIHJldHVybiByZXF1ZXN0LnByb21pc2U7XG4gICAgfVxuXG4gICAgY29uc3QgdGltZW91dFByb21pc2UgPSBuZXcgUHJvbWlzZTxuZXZlcj4oKF8sIHJlamVjdCkgPT4ge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiByZWplY3QobmV3IEVycm9yKCdMb2FkIHRpbWVvdXQnKSksIHRoaXMuY29uZmlnLnRpbWVvdXQpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIFByb21pc2UucmFjZShbcmVxdWVzdC5wcm9taXNlLCB0aW1lb3V0UHJvbWlzZV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgbG9hZGluZyBzdGF0dXMgaW5jbHVkaW5nIGFjdGl2ZSBhbmQgcXVldWVkIGxvYWRzLlxuICAgKiBVc2VmdWwgZm9yIG1vbml0b3JpbmcgbG9hZGluZyBwcm9ncmVzcyBhbmQgZGVidWdnaW5nLlxuICAgKlxuICAgKiBAcmV0dXJucyBPYmplY3QgY29udGFpbmluZyB0aGUgbnVtYmVyIG9mIGFjdGl2ZSBhbmQgcXVldWVkIGxvYWRzXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3Qgc3RhdHVzID0gbG9hZGVyLmdldExvYWRpbmdTdGF0dXMoKTtcbiAgICogY29uc29sZS5sb2coYEFjdGl2ZTogJHtzdGF0dXMuYWN0aXZlfSwgUXVldWVkOiAke3N0YXR1cy5xdWV1ZWR9YCk7XG4gICAqIGBgYFxuICAgKi9cbiAgZ2V0TG9hZGluZ1N0YXR1cygpOiB7IGFjdGl2ZTogbnVtYmVyOyBxdWV1ZWQ6IG51bWJlciB9IHtcbiAgICByZXR1cm4ge1xuICAgICAgYWN0aXZlOiB0aGlzLmFjdGl2ZUxvYWRzLFxuICAgICAgcXVldWVkOiB0aGlzLmxvYWRpbmdRdWV1ZS5sZW5ndGgsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXYWl0cyB1bnRpbCBhbGwgY3VycmVudGx5IGFjdGl2ZSBhbmQgcXVldWVkIGxvYWRzIGFyZSBjb21wbGV0ZS5cbiAgICogVXNlZnVsIGZvciBlbnN1cmluZyBhbGwgYXNzZXRzIGFyZSBsb2FkZWQgYmVmb3JlIHByb2NlZWRpbmcuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIGFsbCBsb2FkcyBhcmUgY29tcGxldGVcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiAvLyBTdGFydCBtdWx0aXBsZSBsb2Fkc1xuICAgKiBsb2FkZXIubG9hZFNpbmdsZShsb2FkVGV4dHVyZSgndGV4dHVyZS5qcGcnKSk7XG4gICAqIGxvYWRlci5sb2FkU2luZ2xlKGxvYWRNb2RlbCgnbW9kZWwuZ2x0ZicpKTtcbiAgICpcbiAgICogLy8gV2FpdCBmb3IgYWxsIHRvIGNvbXBsZXRlXG4gICAqIGF3YWl0IGxvYWRlci53YWl0Rm9yQWxsTG9hZHMoKTtcbiAgICogY29uc29sZS5sb2coJ0FsbCBhc3NldHMgbG9hZGVkIScpO1xuICAgKiBgYGBcbiAgICovXG4gIGFzeW5jIHdhaXRGb3JBbGxMb2FkcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB3aGlsZSAodGhpcy5hY3RpdmVMb2FkcyA+IDAgfHwgdGhpcy5sb2FkaW5nUXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwKSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGVmYXVsdCBhc3NldCBsb2FkZXIgaW5zdGFuY2Ugd2l0aCBzdGFuZGFyZCBjb25maWd1cmF0aW9uLlxuICogUHJvdmlkZXMgYSBjb252ZW5pZW50IHNpbmdsZXRvbiBmb3IgbW9zdCB1c2UgY2FzZXMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGltcG9ydCB7IGRlZmF1bHRBc3NldExvYWRlciB9IGZyb20gJy4vQXNzZXRMb2FkZXInO1xuICpcbiAqIGNvbnN0IGFzc2V0cyA9IGF3YWl0IGRlZmF1bHRBc3NldExvYWRlci5sb2FkKHtcbiAqICAgdGV4dHVyZTogbG9hZFRleHR1cmUoJ3RleHR1cmUuanBnJyksXG4gKiAgIG1vZGVsOiBsb2FkTW9kZWwoJ21vZGVsLmdsdGYnKVxuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNvbnN0IGRlZmF1bHRBc3NldExvYWRlciA9IG5ldyBBc3NldExvYWRlcigpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQTJFTyxJQUFNLGNBQU4sTUFBa0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBd0J2QixZQUFZLFNBQTRCLENBQUMsR0FBRztBQXRCNUMsU0FBUSxlQUFtQyxDQUFDO0FBQzVDLFNBQVEsY0FBYztBQTlFeEI7QUFvR0ksU0FBSyxTQUFTO0FBQUEsTUFDWixxQkFBb0IsWUFBTyx1QkFBUCxZQUE2QjtBQUFBLE1BQ2pELFVBQVMsWUFBTyxZQUFQLFlBQWtCO0FBQUEsSUFDN0I7QUFBQSxFQUNGO0FBQUE7QUFB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
