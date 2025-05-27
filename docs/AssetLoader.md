# AssetLoader

AssetLoaderは、Rhodoniteで様々なPromiseを型安全に読み込むためのユーティリティクラスです。従来のPromise.allを使った読み込み方法と比較して、以下の利点があります：

## 特徴

- **型安全性**: TypeScriptのジェネリクスを使用して、読み込むアセットの型が正しく推論されます
- **並列制御**: 同時読み込み数を制限して、ネットワーク負荷を制御できます
- **エラーハンドリング**: タイムアウトとリトライ機能を内蔵
- **読み込み状況の監視**: 現在の読み込み状況を取得可能
- **汎用性**: 任意のPromiseを処理でき、特定のアセットタイプに依存しません

## 基本的な使用方法

### インスタンスの作成

```typescript
import Rn from 'rhodonite';

// デフォルト設定でインスタンスを作成
const assetLoader = new Rn.AssetLoader();

// カスタム設定でインスタンスを作成
const customLoader = new Rn.AssetLoader({
  maxConcurrentLoads: 5,    // 最大同時読み込み数（デフォルト: 3）
  timeout: 60000,           // タイムアウト時間（デフォルト: 30000ms）
  retryCount: 3,            // リトライ回数（デフォルト: 2）
});
```

### 単一のPromiseを読み込み

```typescript
// CubeTextureの読み込み
const environmentTexture = await assetLoader.load(
  Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  })
);

// Textureの読み込み
const texture = await assetLoader.load(
  (async () => {
    const tex = new Rn.Texture();
    await tex.generateTextureFromUri('/assets/textures/albedo.jpg');
    return tex;
  })()
);
```

### 複数のPromiseを一括読み込み（同じ型）

```typescript
// 複数のCubeTextureを一括読み込み
const [envTexture, specTexture, diffTexture] = await assetLoader.loadAll([
  Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  }),
  Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/specular/specular',
    mipmapLevelNumber: 10,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
  Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/diffuse/diffuse',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  })
]);
```

### 異なる型のPromiseを一括読み込み

```typescript
// 異なる型のアセットを一括読み込み
const [cubeTexture, texture, model] = await assetLoader.loadAll([
  Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  }),
  (async () => {
    const tex = new Rn.Texture();
    await tex.generateTextureFromUri('/assets/textures/albedo.jpg');
    return tex;
  })(),
  Rn.Gltf2Importer.importFromUri('/assets/models/model.gltf')
]);

// 型推論により、cubeTextureはCubeTexture、textureはTexture、modelはGltf2型として扱われる
```

### リトライファクトリ付きで読み込み

```typescript
// リトライ可能な読み込み
const textures = await assetLoader.loadAllWithRetry([
  () => Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  }),
  () => Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/specular/specular',
    mipmapLevelNumber: 10,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  })
]);
```

## 従来の方法との比較

### 従来の方法（Promise.all）

```typescript
// 型安全性がなく、any型として扱われる
const promises = [];
promises.push(Rn.CubeTexture.fromUrl({
  baseUrl: '/assets/ibl/environment/environment',
  mipmapLevelNumber: 1,
  isNamePosNeg: true,
  hdriFormat: Rn.HdriFormat.HDR_LINEAR,
}));
promises.push(Rn.CubeTexture.fromUrl({
  baseUrl: '/assets/ibl/specular/specular',
  mipmapLevelNumber: 10,
  isNamePosNeg: true,
  hdriFormat: Rn.HdriFormat.RGBE_PNG,
}));

const [envTexture, specTexture] = await Promise.all(promises);
// envTexture, specTextureの型はany
```

### AssetLoaderを使用した方法

```typescript
// 型安全で、適切な型が推論される
const [envTexture, specTexture] = await assetLoader.loadAll([
  Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  }),
  Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/specular/specular',
    mipmapLevelNumber: 10,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  })
]);
// envTexture, specTextureの型はCubeTexture
```

## 元のコードの置き換え例

元のコードを簡単にAssetLoaderに置き換えることができます：

```typescript
// 元のコード
const promises = [];
promises.push(Rn.CubeTexture.fromUrl({
  baseUrl: basePathIBL + '/environment/environment',
  mipmapLevelNumber: 1,
  isNamePosNeg: true,
  hdriFormat: Rn.HdriFormat.HDR_LINEAR,
}));
promises.push(Rn.CubeTexture.fromUrl({
  baseUrl: basePathIBL + '/specular/specular',
  mipmapLevelNumber: 10,
  isNamePosNeg: true,
  hdriFormat: Rn.HdriFormat.RGBE_PNG,
}));
promises.push(Rn.CubeTexture.fromUrl({
  baseUrl: basePathIBL + '/diffuse/diffuse',
  mipmapLevelNumber: 1,
  isNamePosNeg: true,
  hdriFormat: Rn.HdriFormat.RGBE_PNG,
}));
const [cubeTextureEnvironment, cubeTextureSpecular, cubeTextureDiffuse] = await Promise.all(promises);

// AssetLoaderを使った置き換え
const assetLoader = new Rn.AssetLoader();
const [cubeTextureEnvironment, cubeTextureSpecular, cubeTextureDiffuse] = await assetLoader.loadAll([
  Rn.CubeTexture.fromUrl({
    baseUrl: basePathIBL + '/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  }),
  Rn.CubeTexture.fromUrl({
    baseUrl: basePathIBL + '/specular/specular',
    mipmapLevelNumber: 10,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
  Rn.CubeTexture.fromUrl({
    baseUrl: basePathIBL + '/diffuse/diffuse',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  })
]);
```

## 読み込み状況の監視

```typescript
// 読み込み状況を取得
const status = assetLoader.getLoadingStatus();
console.log(`アクティブ: ${status.active}, キュー: ${status.queued}`);

// すべての読み込み完了を待機
await assetLoader.waitForAllLoads();
console.log('すべての読み込みが完了しました');
```

## エラーハンドリング

```typescript
try {
  const texture = await assetLoader.load(
    Rn.CubeTexture.fromUrl({
      baseUrl: '/invalid/path',
      mipmapLevelNumber: 1,
      isNamePosNeg: true,
      hdriFormat: Rn.HdriFormat.HDR_LINEAR,
    })
  );
} catch (error) {
  console.error('読み込みに失敗しました:', error);
  // 自動的にリトライが実行された後のエラー
}
```

## デフォルトインスタンス

グローバルに使用できるデフォルトのAssetLoaderインスタンスも提供されています：

```typescript
import Rn from 'rhodonite';

// デフォルトインスタンスを使用
const texture = await Rn.defaultAssetLoader.load(
  Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  })
);
```

## API リファレンス

### AssetLoaderConfig

```typescript
interface AssetLoaderConfig {
  maxConcurrentLoads?: number;  // 並列読み込み数の制限（デフォルト: 3）
  timeout?: number;             // タイムアウト時間（ミリ秒、デフォルト: 30000）
  retryCount?: number;          // エラー時のリトライ回数（デフォルト: 2）
}
```

### AssetLoaderクラス

#### `load<T>(promise: Promise<T>, retryFactory?: () => Promise<T>): Promise<T>`

単一のPromiseを読み込みます。

- `promise`: 読み込むPromise
- `retryFactory`: リトライ時に新しいPromiseを生成する関数（オプション）

#### `loadAll<T>(promises: Promise<T>[]): Promise<T[]>`

同じ型の複数のPromiseを一括読み込みします。

#### `loadAll<T extends readonly unknown[]>(promises: readonly [...{ [K in keyof T]: Promise<T[K]> }]): Promise<T>`

異なる型のPromiseを一括読み込みし、タプル型として返します。

#### `loadAllWithRetry<T>(promiseFactories: Array<() => Promise<T>>): Promise<T[]>`

リトライファクトリ付きで複数のPromiseを読み込みます。

#### `getLoadingStatus(): { active: number; queued: number }`

現在の読み込み状況を取得します。

#### `waitForAllLoads(): Promise<void>`

すべての読み込みが完了するまで待機します。

## 利点

1. **型安全性**: TypeScriptの型推論により、戻り値の型が正確に推論されます
2. **並列制御**: 同時読み込み数を制限して、ネットワーク負荷を制御できます
3. **エラーハンドリング**: タイムアウトとリトライ機能が内蔵されています
4. **汎用性**: 任意のPromiseを処理でき、特定のアセットタイプに依存しません
5. **簡単な移行**: 既存のPromise.allコードを簡単に置き換えできます

AssetLoaderクラスは、型安全性と使いやすさを両立させた汎用的なPromise管理ソリューションです。大規模なアプリケーションでの使用に適しており、開発効率の向上に貢献します。
