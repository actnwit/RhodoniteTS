import Rn from '../../../dist/esmdev/index.js';

// Path settings same as the original code
const basePathIBL = '../../../assets/ibl/papermill';

// Create an instance of AssetLoader
const assetLoader = new Rn.AssetLoader({
  maxConcurrentLoads: 3,
  timeout: 30000,
});

async function loadAssetsWithAssetLoader(engine: Rn.Engine) {
  console.log('Loading assets using AssetLoader...');

  try {
    // Main usage: Load promises in object format
    console.log('Loading promises in object format');
    const assets = await assetLoader.load({
      environment: Rn.CubeTexture.loadFromUrl(engine, {
        baseUrl: `${basePathIBL}/environment/environment`,
        mipmapLevelNumber: 1,
        isNamePosNeg: true,
        hdriFormat: Rn.HdriFormat.HDR_LINEAR,
      }),
      specular: Rn.CubeTexture.loadFromUrl(engine, {
        baseUrl: `${basePathIBL}/specular/specular`,
        mipmapLevelNumber: 10,
        isNamePosNeg: true,
        hdriFormat: Rn.HdriFormat.RGBE_PNG,
      }),
      diffuse: Rn.CubeTexture.loadFromUrl(engine, {
        baseUrl: `${basePathIBL}/diffuse/diffuse`,
        mipmapLevelNumber: 1,
        isNamePosNeg: true,
        hdriFormat: Rn.HdriFormat.RGBE_PNG,
      }),
    });

    console.log('Environment texture loaded:', assets.environment);
    console.log('Specular texture loaded:', assets.specular);
    console.log('Diffuse texture loaded:', assets.diffuse);

    // Method 2: Load a single promise
    console.log('Method 2: Loading a single promise');
    const singleTexture = await assetLoader.loadSingle(
      Rn.CubeTexture.loadFromUrl(engine, {
        baseUrl: `${basePathIBL}/environment/environment`,
        mipmapLevelNumber: 1,
        isNamePosNeg: true,
        hdriFormat: Rn.HdriFormat.HDR_LINEAR,
      })
    );
    console.log('Single texture loaded:', singleTexture);

    // Method 2.5: Load a single promise with retry
    console.log('Method 2.5: Loading a single promise with retry');
    const singleTextureWithRetry = await assetLoader.loadWithRetrySingle([
      () =>
        Rn.CubeTexture.loadFromUrl(engine, {
          baseUrl: `${basePathIBL}/environment/environment`,
          mipmapLevelNumber: 1,
          isNamePosNeg: true,
          hdriFormat: Rn.HdriFormat.HDR_LINEAR,
        }),
      () =>
        Rn.CubeTexture.loadFromUrl(engine, {
          baseUrl: `${basePathIBL}/environment/environment`,
          mipmapLevelNumber: 2, // Retry with different parameters
          isNamePosNeg: true,
          hdriFormat: Rn.HdriFormat.HDR_LINEAR,
        }),
    ]);
    console.log('Single texture with retry loaded:', singleTextureWithRetry);

    // Method 3: Load multiple promises in array format
    console.log('Method 3: Loading multiple promises in array format');
    const [texture1, texture2] = await assetLoader.loadArray([
      Rn.CubeTexture.loadFromUrl(engine, {
        baseUrl: `${basePathIBL}/specular/specular`,
        mipmapLevelNumber: 10,
        isNamePosNeg: true,
        hdriFormat: Rn.HdriFormat.RGBE_PNG,
      }),
      Rn.CubeTexture.loadFromUrl(engine, {
        baseUrl: `${basePathIBL}/diffuse/diffuse`,
        mipmapLevelNumber: 1,
        isNamePosNeg: true,
        hdriFormat: Rn.HdriFormat.RGBE_PNG,
      }),
    ]);
    console.log('Array textures loaded:', texture1, texture2);

    // Method 4: Load different types of promises in bulk
    console.log('Method 4: Loading different types of promises in bulk');

    // Promise to create a texture
    const createTexturePromise = async () => {
      const texture = new Rn.Texture(engine);
      await texture.generate1x1TextureFrom('rgba(255, 255, 255, 1)');
      return texture;
    };

    const mixedAssets = await assetLoader.load({
      cubeTexture: Rn.CubeTexture.loadFromUrl(engine, {
        baseUrl: `${basePathIBL}/environment/environment`,
        mipmapLevelNumber: 1,
        isNamePosNeg: true,
        hdriFormat: Rn.HdriFormat.HDR_LINEAR,
      }),
      texture: createTexturePromise(),
    });
    console.log('Mixed assets loaded:', mixedAssets.cubeTexture, mixedAssets.texture);

    // Method 5: Load with retry factory in array format
    console.log('Method 5: Loading with retry factory in array format');
    const texturesWithMultipleRetries = await assetLoader.loadWithRetryArray([
      [
        // First attempt: Main server
        () =>
          Rn.CubeTexture.loadFromUrl(engine, {
            baseUrl: `${basePathIBL}/environment/environment`,
            mipmapLevelNumber: 1,
            isNamePosNeg: true,
            hdriFormat: Rn.HdriFormat.HDR_LINEAR,
          }),
        // First retry: Attempt with different parameters
        () =>
          Rn.CubeTexture.loadFromUrl(engine, {
            baseUrl: `${basePathIBL}/environment/environment`,
            mipmapLevelNumber: 2, // Different mipmap level for retry
            isNamePosNeg: true,
            hdriFormat: Rn.HdriFormat.HDR_LINEAR,
          }),
        // Second retry: Attempt with different format
        () =>
          Rn.CubeTexture.loadFromUrl(engine, {
            baseUrl: `${basePathIBL}/environment/environment`,
            mipmapLevelNumber: 1,
            isNamePosNeg: true,
            hdriFormat: Rn.HdriFormat.RGBE_PNG, // Different format
          }),
      ],
      [
        // Similar multiple retry strategies for specular texture
        () =>
          Rn.CubeTexture.loadFromUrl(engine, {
            baseUrl: `${basePathIBL}/specular/specular`,
            mipmapLevelNumber: 10,
            isNamePosNeg: true,
            hdriFormat: Rn.HdriFormat.RGBE_PNG,
          }),
        // Attempt backup path
        () =>
          Rn.CubeTexture.loadFromUrl(engine, {
            baseUrl: `${basePathIBL}/specular/specular_backup`,
            mipmapLevelNumber: 10,
            isNamePosNeg: true,
            hdriFormat: Rn.HdriFormat.RGBE_PNG,
          }),
      ],
    ]);
    console.log('Textures with multiple retries loaded:', texturesWithMultipleRetries);

    // Method 6: Load with retry factory in object format
    console.log('Method 6: Loading with retry factory in object format');
    const assetsWithRetry = await assetLoader.loadWithRetry({
      environment: [
        // First attempt
        () =>
          Rn.CubeTexture.loadFromUrl(engine, {
            baseUrl: `${basePathIBL}/environment/environment`,
            mipmapLevelNumber: 1,
            isNamePosNeg: true,
            hdriFormat: Rn.HdriFormat.HDR_LINEAR,
          }),
        // Retry 1: Different mipmap level
        () =>
          Rn.CubeTexture.loadFromUrl(engine, {
            baseUrl: `${basePathIBL}/environment/environment`,
            mipmapLevelNumber: 2,
            isNamePosNeg: true,
            hdriFormat: Rn.HdriFormat.HDR_LINEAR,
          }),
      ],
      specular: [
        // First attempt
        () =>
          Rn.CubeTexture.loadFromUrl(engine, {
            baseUrl: `${basePathIBL}/specular/specular`,
            mipmapLevelNumber: 10,
            isNamePosNeg: true,
            hdriFormat: Rn.HdriFormat.RGBE_PNG,
          }),
        // Retry 1: Backup path
        () =>
          Rn.CubeTexture.loadFromUrl(engine, {
            baseUrl: `${basePathIBL}/specular/specular_backup`,
            mipmapLevelNumber: 10,
            isNamePosNeg: true,
            hdriFormat: Rn.HdriFormat.RGBE_PNG,
          }),
        // Retry 2: Different format
        () =>
          Rn.CubeTexture.loadFromUrl(engine, {
            baseUrl: `${basePathIBL}/specular/specular`,
            mipmapLevelNumber: 10,
            isNamePosNeg: true,
            hdriFormat: Rn.HdriFormat.HDR_LINEAR,
          }),
      ],
    });
    console.log('Assets with retry loaded:', assetsWithRetry.environment, assetsWithRetry.specular);

    // Method 7: Test retry count based on the number of retry functions
    console.log('Method 7: Testing retry count based on the number of retry functions');

    // Case 1: Two retry functions = 2 retries
    console.log('Case 1: Two retry functions (2 retries)');
    try {
      const assetsCase1 = await assetLoader.loadWithRetry({
        test: [
          () => {
            console.log('  First attempt (will fail)');
            return Promise.reject(new Error('First attempt failed'));
          },
          () => {
            console.log('  First retry (will fail)');
            return Promise.reject(new Error('First retry failed'));
          },
          () => {
            console.log('  Second retry (success)');
            return Promise.resolve('Success!');
          },
        ],
      });
      console.log('Case 1 result:', assetsCase1.test);
    } catch (error) {
      console.log('Case 1 error:', error instanceof Error ? error.message : String(error));
    }

    // Case 2: No retry functions = No retries
    console.log('Case 2: No retry functions (no retries)');
    try {
      const assetsCase2 = await assetLoader.loadWithRetry({
        test: [
          () => {
            console.log('  First attempt (will fail)');
            return Promise.reject(new Error('First attempt failed'));
          },
        ],
      });
      console.log('Case 2 result:', assetsCase2.test);
    } catch (error) {
      console.log('Case 2 error:', error instanceof Error ? error.message : String(error));
    }

    // Case 3: One retry function = 1 retry
    console.log('Case 3: One retry function (1 retry)');
    try {
      const assetsCase3 = await assetLoader.loadWithRetry({
        test: [
          () => {
            console.log('  First attempt (will fail)');
            return Promise.reject(new Error('First attempt failed'));
          },
          () => {
            console.log('  First retry (success)');
            return Promise.resolve('Success!');
          },
        ],
      });
      console.log('Case 3 result:', assetsCase3.test);
    } catch (error) {
      console.log('Case 3 error:', error instanceof Error ? error.message : String(error));
    }

    // Monitor loading status
    console.log('Loading status:', assetLoader.getLoadingStatus());

    // Wait for all loads to complete
    await assetLoader.waitForAllLoads();
    console.log('All asset loading is complete');

    return assets;
  } catch (error) {
    console.error('Failed to load assets:', error);
    throw error;
  }
}

// Example of replacing original code with AssetLoader
async function replaceOriginalCodeWithAssetLoader(engine: Rn.Engine) {
  console.log('Replacing original code with AssetLoader');

  // Original code:
  // const promises = [];
  // promises.push(Rn.CubeTexture.loadFromUrl({...}));
  // promises.push(Rn.CubeTexture.loadFromUrl({...}));
  // promises.push(Rn.CubeTexture.loadFromUrl({...}));
  // const [cubeTextureEnvironment, cubeTextureSpecular, cubeTextureDiffuse] = await Promise.all(promises);

  // Replacement using AssetLoader (object format):
  const assets = await assetLoader.load({
    environment: Rn.CubeTexture.loadFromUrl(engine, {
      baseUrl: `${basePathIBL}/environment/environment`,
      mipmapLevelNumber: 1,
      isNamePosNeg: true,
      hdriFormat: Rn.HdriFormat.HDR_LINEAR,
    }),
    specular: Rn.CubeTexture.loadFromUrl(engine, {
      baseUrl: `${basePathIBL}/specular/specular`,
      mipmapLevelNumber: 10,
      isNamePosNeg: true,
      hdriFormat: Rn.HdriFormat.RGBE_PNG,
    }),
    diffuse: Rn.CubeTexture.loadFromUrl(engine, {
      baseUrl: `${basePathIBL}/diffuse/diffuse`,
      mipmapLevelNumber: 1,
      isNamePosNeg: true,
      hdriFormat: Rn.HdriFormat.RGBE_PNG,
    }),
  });

  console.log('Replacement complete:');
  console.log('Environment:', assets.environment);
  console.log('Specular:', assets.specular);
  console.log('Diffuse:', assets.diffuse);

  return assets;
}

// Demonstration of type safety
function demonstrateTypeSafety(engine: Rn.Engine) {
  console.log('Demonstration of type safety');

  // TypeScript's type inference correctly infers the return type
  assetLoader
    .load({
      environment: Rn.CubeTexture.loadFromUrl(engine, {
        baseUrl: `${basePathIBL}/environment/environment`,
        mipmapLevelNumber: 1,
        isNamePosNeg: true,
        hdriFormat: Rn.HdriFormat.HDR_LINEAR,
      }),
      texture: (async () => {
        const texture = new Rn.Texture(engine);
        await texture.generate1x1TextureFrom();
        return texture;
      })(),
    })
    .then(assets => {
      // assets.environmentはCubeTexture型、assets.textureはTexture型として推論される
      console.log(
        'Type-safe assets loaded:',
        assets.environment.mipmapLevelNumber,
        assets.texture.width,
        assets.texture.height
      );
    });
}

// Main execution function
async function main() {
  try {
    const engine = await Rn.Engine.init({
      approach: Rn.ProcessApproach.Uniform,
      canvas: document.getElementById('world') as HTMLCanvasElement,
    });
    console.log('=== AssetLoader example ===');

    // Loading using AssetLoader
    await loadAssetsWithAssetLoader(engine);

    console.log('\n=== Example of replacing original code ===');
    await replaceOriginalCodeWithAssetLoader(engine);

    console.log('\n=== Demonstration of type safety ===');
    demonstrateTypeSafety(engine);

    console.log('\nLoading complete!');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// 実行
main();
