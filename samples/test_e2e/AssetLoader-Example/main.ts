import Rn from '../../../dist/esmdev/index.js';

// 元のコードと同じパス設定
const basePathIBL = '../../../assets/ibl/papermill';

// AssetLoaderのインスタンスを作成
const assetLoader = new Rn.AssetLoader({
  maxConcurrentLoads: 3,
  timeout: 30000,
  retryCount: 2,
});

async function loadAssetsWithAssetLoader() {
  console.log('AssetLoaderを使用してアセットを読み込み中...');

  try {
    // 方法1: 単一のPromiseを読み込み
    console.log('方法1: 単一のPromiseを読み込み');
    const environmentTexture = await assetLoader.load(
      Rn.CubeTexture.fromUrl({
        baseUrl: basePathIBL + '/environment/environment',
        mipmapLevelNumber: 1,
        isNamePosNeg: true,
        hdriFormat: Rn.HdriFormat.HDR_LINEAR,
      })
    );
    console.log('Environment texture loaded:', environmentTexture);

    // 方法2: 複数のPromiseを一括読み込み（同じ型）
    console.log('方法2: 複数のCubeTextureを一括読み込み');
    const [specularTexture, diffuseTexture] = await assetLoader.loadAll([
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
    console.log('Specular texture loaded:', specularTexture);
    console.log('Diffuse texture loaded:', diffuseTexture);

    // 方法3: 異なる型のPromiseを一括読み込み
    console.log('方法3: 異なる型のPromiseを一括読み込み');

    // Textureを作成するPromise
    const createTexturePromise = async () => {
      const texture = new Rn.Texture();
      await texture.generate1x1TextureFrom('rgba(255, 255, 255, 1)');
      return texture;
    };

    const [cubeTexture, texture] = await assetLoader.loadAll([
      Rn.CubeTexture.fromUrl({
        baseUrl: basePathIBL + '/environment/environment',
        mipmapLevelNumber: 1,
        isNamePosNeg: true,
        hdriFormat: Rn.HdriFormat.HDR_LINEAR,
      }),
      createTexturePromise()
    ]);
    console.log('Mixed assets loaded:', cubeTexture, texture);

    // 方法4: リトライファクトリ付きで読み込み
    console.log('方法4: リトライファクトリ付きで読み込み');
    const texturesWithRetry = await assetLoader.loadAllWithRetry([
      () => Rn.CubeTexture.fromUrl({
        baseUrl: basePathIBL + '/environment/environment',
        mipmapLevelNumber: 1,
        isNamePosNeg: true,
        hdriFormat: Rn.HdriFormat.HDR_LINEAR,
      }),
      () => Rn.CubeTexture.fromUrl({
        baseUrl: basePathIBL + '/specular/specular',
        mipmapLevelNumber: 10,
        isNamePosNeg: true,
        hdriFormat: Rn.HdriFormat.RGBE_PNG,
      })
    ]);
    console.log('Textures with retry loaded:', texturesWithRetry);

    // 読み込み状況の監視
    console.log('読み込み状況:', assetLoader.getLoadingStatus());

    // すべての読み込み完了を待機
    await assetLoader.waitForAllLoads();
    console.log('すべてのアセットの読み込みが完了しました');

    return {
      environment: environmentTexture,
      specular: specularTexture,
      diffuse: diffuseTexture,
    };

  } catch (error) {
    console.error('アセットの読み込みに失敗しました:', error);
    throw error;
  }
}

// メイン実行関数
async function main() {
  try {
    console.log('=== AssetLoader使用例 ===');

    // AssetLoaderを使用した読み込み
    const assetsWithLoader = await loadAssetsWithAssetLoader();

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// 実行
main();
