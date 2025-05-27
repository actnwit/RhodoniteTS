import { CubeTexture } from '../textures/CubeTexture';
import { Texture } from '../textures/Texture';
import { HdriFormatEnum } from '../definitions/HdriFormat';

/**
 * アセットローダーの設定インターフェース
 */
export interface AssetLoaderConfig {
  /** 並列読み込み数の制限 */
  maxConcurrentLoads?: number;
  /** タイムアウト時間（ミリ秒） */
  timeout?: number;
  /** エラー時のリトライ回数 */
  retryCount?: number;
}

/**
 * 読み込み要求の内部表現
 */
interface LoadRequest<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
  retryCount: number;
  retryFactory?: () => Promise<T>;
}

/**
 * 型安全なアセットローダークラス
 *
 * @example
 * ```typescript
 * const loader = new AssetLoader();
 *
 * // 単一のPromiseを読み込み
 * const cubeTexture = await loader.load(Rn.CubeTexture.fromUrl({
 *   baseUrl: '/path/to/environment',
 *   mipmapLevelNumber: 1,
 *   isNamePosNeg: true,
 *   hdriFormat: Rn.HdriFormat.HDR_LINEAR,
 * }));
 *
 * // 複数のPromiseを一括読み込み
 * const [envTexture, specTexture, diffTexture] = await loader.loadAll([
 *   Rn.CubeTexture.fromUrl({ baseUrl: '/env', ... }),
 *   Rn.CubeTexture.fromUrl({ baseUrl: '/spec', ... }),
 *   Rn.CubeTexture.fromUrl({ baseUrl: '/diff', ... })
 * ]);
 *
 * // 異なる型のPromiseを一括読み込み
 * const [cubeTexture, texture] = await loader.loadAll([
 *   Rn.CubeTexture.fromUrl({ ... }),
 *   texturePromise
 * ]);
 * ```
 */
export class AssetLoader {
  private config: Required<AssetLoaderConfig>;
  private loadingQueue: LoadRequest<any>[] = [];
  private activeLoads = 0;

  constructor(config: AssetLoaderConfig = {}) {
    this.config = {
      maxConcurrentLoads: config.maxConcurrentLoads ?? 3,
      timeout: config.timeout ?? 30000,
      retryCount: config.retryCount ?? 2,
    };
  }

  /**
   * 単一のPromiseを読み込む
   */
  async load<T>(promise: Promise<T>, retryFactory?: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: LoadRequest<T> = {
        promise,
        resolve,
        reject,
        retryCount: 0,
        retryFactory,
      };

      this.loadingQueue.push(request);
      this.processQueue();
    });
  }

  /**
   * 複数のPromiseを一括読み込み（同じ型）
   */
  async loadAll<T>(promises: Promise<T>[]): Promise<T[]>;
  /**
   * 複数のPromiseを一括読み込み（異なる型のタプル）
   */
  async loadAll<T extends readonly unknown[]>(
    promises: readonly [...{ [K in keyof T]: Promise<T[K]> }]
  ): Promise<T>;
  async loadAll<T>(promises: Promise<T>[] | readonly Promise<any>[]): Promise<T[] | any[]> {
    const loadPromises = promises.map(promise => this.load(promise));
    return Promise.all(loadPromises);
  }

  /**
   * 複数のPromiseを一括読み込み（リトライファクトリ付き）
   */
  async loadAllWithRetry<T>(
    promiseFactories: Array<() => Promise<T>>
  ): Promise<T[]> {
    const loadPromises = promiseFactories.map(factory =>
      this.load(factory(), factory)
    );
    return Promise.all(loadPromises);
  }

  /**
   * 読み込みキューを処理する
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
      if (request.retryCount < this.config.retryCount && request.retryFactory) {
        request.retryCount++;
        request.promise = request.retryFactory();
        this.loadingQueue.unshift(request); // 先頭に戻してリトライ
      } else {
        request.reject(error);
      }
    } finally {
      this.activeLoads--;
      this.processQueue(); // 次のアイテムを処理
    }
  }

  /**
   * 実際の読み込み処理を実行する
   */
  private async executeLoad<T>(request: LoadRequest<T>): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Load timeout')), this.config.timeout);
    });

    return Promise.race([request.promise, timeoutPromise]);
  }

  /**
   * 現在の読み込み状況を取得する
   */
  getLoadingStatus(): { active: number; queued: number } {
    return {
      active: this.activeLoads,
      queued: this.loadingQueue.length,
    };
  }

  /**
   * すべての読み込みが完了するまで待機する
   */
  async waitForAllLoads(): Promise<void> {
    while (this.activeLoads > 0 || this.loadingQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

/**
 * デフォルトのアセットローダーインスタンス
 */
export const defaultAssetLoader = new AssetLoader();
