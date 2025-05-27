# AssetLoader

AssetLoaderは、Rhodoniteで様々なPromiseを型安全に読み込むためのユーティリティクラスです。従来のPromise.allを使った読み込み方法と比較して、以下の利点があります：

## 特徴

- **型安全性**: TypeScriptのジェネリクスを使用して、読み込むアセットの型が正しく推論されます
- **並列制御**: 同時読み込み数を制限して、ネットワーク負荷を制御できます
- **エラーハンドリング**: タイムアウトとリトライ機能を内蔵
- **読み込み状況の監視**: 現在の読み込み状況を取得可能
- **直感的なAPI**: オブジェクト形式でPromiseを渡し、同じ構造で結果を取得

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
});
```

### メインAPI: オブジェクト形式でPromiseを読み込み

```typescript
// オブジェクト形式でPromiseを読み込み
const assets = await assetLoader.load({
  environment: Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  }),
  specular: Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/specular/specular',
    mipmapLevelNumber: 10,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
  diffuse: Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/diffuse/diffuse',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  })
});

// 型安全にアクセス可能
console.log(assets.environment); // CubeTexture
console.log(assets.specular);    // CubeTexture
console.log(assets.diffuse);     // CubeTexture
```

### 異なる型のPromiseを一括読み込み

```typescript
// 異なる型のアセットを一括読み込み
const mixedAssets = await assetLoader.load({
  cubeTexture: Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  }),
  texture: (async () => {
    const tex = new Rn.Texture();
    await tex.generateTextureFromUri('/assets/textures/albedo.jpg');
    return tex;
  })(),
  model: Rn.Gltf2Importer.importFromUri('/assets/models/model.gltf')
});

// 型推論により、各プロパティの型が正確に推論される
console.log(mixedAssets.cubeTexture); // CubeTexture
console.log(mixedAssets.texture);     // Texture
console.log(mixedAssets.model);       // Gltf2
```

### その他のAPI

#### 単一のPromiseを読み込み

```typescript
const texture = await assetLoader.loadSingle(
  Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  })
);
```

#### 単一のPromiseをリトライ付きで読み込み

```typescript
const texture = await assetLoader.loadWithRetrySingle([
  // 最初の試行
  () => Rn.CubeTexture.fromUrl({
    baseUrl: 'https://main-server.com/assets/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  }),
  // 1回目のリトライ
  () => Rn.CubeTexture.fromUrl({
    baseUrl: 'https://backup-server.com/assets/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  })
]);
```

#### 配列形式で複数のPromiseを読み込み

```typescript
const [texture1, texture2, texture3] = await assetLoader.loadArray([
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

#### 配列形式でリトライファクトリ付き読み込み

```typescript
// 各アイテムに対して複数のリトライ戦略を提供
const textures = await assetLoader.loadWithRetryArray([
  [
    // 最初の試行: メインサーバー
    () => Rn.CubeTexture.fromUrl({
      baseUrl: 'https://main-server.com/assets/environment',
      mipmapLevelNumber: 1,
      isNamePosNeg: true,
      hdriFormat: Rn.HdriFormat.HDR_LINEAR,
    }),
    // 1回目のリトライ: バックアップサーバー
    () => Rn.CubeTexture.fromUrl({
      baseUrl: 'https://backup-server.com/assets/environment',
      mipmapLevelNumber: 1,
      isNamePosNeg: true,
      hdriFormat: Rn.HdriFormat.HDR_LINEAR,
    }),
    // 2回目のリトライ: 異なるフォーマット
    () => Rn.CubeTexture.fromUrl({
      baseUrl: 'https://main-server.com/assets/environment',
      mipmapLevelNumber: 1,
      isNamePosNeg: true,
      hdriFormat: Rn.HdriFormat.RGBE_PNG,
    })
  ],
  [
    // specularテクスチャの戦略
    () => Rn.CubeTexture.fromUrl({
      baseUrl: 'https://main-server.com/assets/specular',
      mipmapLevelNumber: 10,
      isNamePosNeg: true,
      hdriFormat: Rn.HdriFormat.RGBE_PNG,
    }),
    // リトライ: 低解像度版を試行
    () => Rn.CubeTexture.fromUrl({
      baseUrl: 'https://main-server.com/assets/specular_low',
      mipmapLevelNumber: 5,
      isNamePosNeg: true,
      hdriFormat: Rn.HdriFormat.RGBE_PNG,
    })
  ]
]);
```

#### オブジェクト形式でリトライファクトリ付き読み込み

```typescript
// オブジェクト形式で複数のリトライ戦略を提供
const assets = await assetLoader.loadWithRetry({
  environment: [
    // 最初の試行
    () => Rn.CubeTexture.fromUrl({
      baseUrl: 'https://main-server.com/assets/environment',
      mipmapLevelNumber: 1,
      isNamePosNeg: true,
      hdriFormat: Rn.HdriFormat.HDR_LINEAR,
    }),
    // リトライ1: バックアップサーバー
    () => Rn.CubeTexture.fromUrl({
      baseUrl: 'https://backup-server.com/assets/environment',
      mipmapLevelNumber: 1,
      isNamePosNeg: true,
      hdriFormat: Rn.HdriFormat.HDR_LINEAR,
    })
  ],
  specular: [
    // 最初の試行
    () => Rn.CubeTexture.fromUrl({
      baseUrl: 'https://main-server.com/assets/specular',
      mipmapLevelNumber: 10,
      isNamePosNeg: true,
      hdriFormat: Rn.HdriFormat.RGBE_PNG,
    }),
    // リトライ1: 低解像度版
    () => Rn.CubeTexture.fromUrl({
      baseUrl: 'https://main-server.com/assets/specular_low',
      mipmapLevelNumber: 5,
      isNamePosNeg: true,
      hdriFormat: Rn.HdriFormat.RGBE_PNG,
    }),
    // リトライ2: 異なるフォーマット
    () => Rn.CubeTexture.fromUrl({
      baseUrl: 'https://main-server.com/assets/specular',
      mipmapLevelNumber: 10,
      isNamePosNeg: true,
      hdriFormat: Rn.HdriFormat.HDR_LINEAR,
    })
  ]
});

// 型安全にアクセス
console.log(assets.environment); // CubeTexture
console.log(assets.specular);    // CubeTexture
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
// どちらがenvironmentでどちらがspecularかわからない
```

### AssetLoaderを使用した方法

```typescript
// 型安全で、適切な型が推論される
const assets = await assetLoader.load({
  environment: Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  }),
  specular: Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/specular/specular',
    mipmapLevelNumber: 10,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  })
});

// assets.environment, assets.specularの型はCubeTexture
// 名前でアクセスできるため、わかりやすい
console.log(assets.environment); // CubeTexture
console.log(assets.specular);    // CubeTexture
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
const assets = await assetLoader.load({
  environment: Rn.CubeTexture.fromUrl({
    baseUrl: basePathIBL + '/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  }),
  specular: Rn.CubeTexture.fromUrl({
    baseUrl: basePathIBL + '/specular/specular',
    mipmapLevelNumber: 10,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
  diffuse: Rn.CubeTexture.fromUrl({
    baseUrl: basePathIBL + '/diffuse/diffuse',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  })
});

// 名前でアクセス可能
const cubeTextureEnvironment = assets.environment;
const cubeTextureSpecular = assets.specular;
const cubeTextureDiffuse = assets.diffuse;
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
  const assets = await assetLoader.load({
    environment: Rn.CubeTexture.fromUrl({
      baseUrl: '/invalid/path',
      mipmapLevelNumber: 1,
      isNamePosNeg: true,
      hdriFormat: Rn.HdriFormat.HDR_LINEAR,
    })
  });
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
const assets = await Rn.defaultAssetLoader.load({
  environment: Rn.CubeTexture.fromUrl({
    baseUrl: '/assets/ibl/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  })
});
```

## API リファレンス

### AssetLoaderConfig

```typescript
interface AssetLoaderConfig {
  maxConcurrentLoads?: number;  // 並列読み込み数の制限（デフォルト: 3）
  timeout?: number;             // タイムアウト時間（ミリ秒、デフォルト: 30000）
}
```

### AssetLoaderクラス

#### `load<T extends Record<string, Promise<any>>>(promiseObject: T): Promise<AwaitedObject<T>>`

オブジェクト形式でPromiseを読み込みます。**メインAPI**

- `promiseObject`: キーと値がPromiseのオブジェクト
- 戻り値: 同じキーで、Promiseの結果を値とするオブジェクト

#### `loadSingle<T>(promise: Promise<T>): Promise<T>`

単一のPromiseを読み込みます（リトライなし）。

- `promise`: 読み込むPromise

#### `loadArray<T>(promises: Promise<T>[]): Promise<T[]>`

同じ型の複数のPromiseを配列形式で一括読み込みします。

#### `loadArray<T extends readonly unknown[]>(promises: readonly [...{ [K in keyof T]: Promise<T[K]> }]): Promise<T>`

異なる型のPromiseを配列形式で一括読み込みし、タプル型として返します。

#### `loadWithRetryArray<T>(promiseFactories: Array<Array<() => Promise<T>>>): Promise<T[]>`

配列形式でリトライファクトリ付きPromiseを読み込みます。各アイテムに対して異なるリトライ戦略を提供できます。

#### `loadWithRetry<T extends Record<string, Promise<any>>>(promiseFactories: { [K in keyof T]: Array<() => T[K]> }): Promise<AwaitedObject<T>>`

オブジェクト形式でリトライファクトリ付きPromiseを読み込みます。

#### `getLoadingStatus(): { active: number; queued: number }`

現在の読み込み状況を取得します。

#### `waitForAllLoads(): Promise<void>`

すべての読み込みが完了するまで待機します。

#### `loadWithRetrySingle<T>(promiseFactories: Array<() => Promise<T>>): Promise<T>`

単一のPromiseをリトライ付きで読み込みます。

- `promiseFactories`: 最初の試行とリトライ用のPromiseファクトリの配列

## リトライ戦略

AssetLoaderのリトライ機能は非常にシンプルです：

**リトライ回数 = 提供されたリトライファクトリの数**

### 基本的なリトライ

```typescript
// リトライ関数を提供しない場合 = リトライしない
const assets = await assetLoader.load({
  environment: Rn.CubeTexture.fromUrl({...}) // 失敗したらそのまま失敗
});

// リトライ関数を1個提供 = 1回リトライ
const assets = await assetLoader.loadWithRetry({
  environment: [
    () => loadFromMainServer(),    // 最初の試行
    () => loadFromBackupServer()   // 1回リトライ
  ]
});

// リトライ関数を2個提供 = 2回リトライ
const assets = await assetLoader.loadWithRetry({
  environment: [
    () => loadFromMainServer(),    // 最初の試行
    () => loadFromBackupServer(),  // 1回目のリトライ
    () => loadFromCDN()            // 2回目のリトライ
  ]
});
```

### リトライ戦略の例

#### 1回リトライ: メイン → バックアップ

```typescript
const assets = await assetLoader.loadWithRetry({
  environment: [
    () => loadFromMainServer(),
    () => loadFromBackupServer()
  ]
});
```

#### 2回リトライ: メイン → バックアップ → CDN

```typescript
const assets = await assetLoader.loadWithRetry({
  environment: [
    () => loadFromMainServer(),
    () => loadFromBackupServer(),
    () => loadFromCDN()
  ]
});
```

#### 品質フォールバック戦略

```typescript
const assets = await assetLoader.loadWithRetry({
  texture: [
    () => loadHighQuality(),       // 最初: 高品質
    () => loadMediumQuality(),     // 1回目のリトライ: 中品質
    () => loadLowQuality()         // 2回目のリトライ: 低品質
  ]
});
```

#### フォーマットフォールバック戦略

```typescript
const assets = await assetLoader.loadWithRetry({
  cubeTexture: [
    () => loadAsHDR(),             // 最初: HDR形式
    () => loadAsRGBE(),            // 1回目のリトライ: RGBE形式
    () => loadAsJPEG()             // 2回目のリトライ: JPEG形式
  ]
});
```

## 利点

1. **型安全性**: TypeScriptの型推論により、戻り値の型が正確に推論されます
2. **並列制御**: 同時読み込み数を制限して、ネットワーク負荷を制御できます
3. **エラーハンドリング**: タイムアウトとリトライ機能が内蔵されています
4. **直感的なAPI**: オブジェクト形式で名前付きアクセスが可能
5. **簡単な移行**: 既存のPromise.allコードを簡単に置き換えできます
6. **可読性**: コードが読みやすく、保守しやすくなります

AssetLoaderクラスは、型安全性と使いやすさを両立させた直感的なPromise管理ソリューションです。大規模なアプリケーションでの使用に適しており、開発効率の向上に貢献します。



### 推奨事項

1. **適切なリトライ回数**: 通常は1-3回のリトライが適切です（リトライ関数を1-3個提供）
2. **異なる戦略の組み合わせ**: サーバー、品質、フォーマットなど、異なるアプローチを組み合わせる
3. **シンプルな設計**: 必要な分だけリトライ関数を提供し、複雑な設定は避ける
