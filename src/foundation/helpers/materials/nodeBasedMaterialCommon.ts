import { ProcessApproach, TextureParameter } from '../../definitions';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType, type ShaderTypeEnum } from '../../definitions/ShaderType';
import { CustomMaterialContent } from '../../materials/contents/CustomMaterialContent';
import type { Material } from '../../materials/core/Material';
import { Scalar } from '../../math/Scalar';
import { Vector2 } from '../../math/Vector2';
import { Vector4 } from '../../math/Vector4';
import { VectorN } from '../../math/VectorN';
import { DataUtil } from '../../misc/DataUtil';
import type { Engine } from '../../system/Engine';
import { getSharedSampler } from '../../textures/Sampler';
import { reuseOrRecreateMaterial } from './createMaterial';
import type { PbrUberMaterialOptions } from './createPbrUberMaterial';

/**
 * Reuses an existing custom material or recreates it with new shader code.
 * This function optimizes performance by reusing materials when possible while allowing shader updates.
 *
 * @param currentMaterial - The existing material to potentially reuse
 * @param vertexShaderStr - Vertex shader source code string
 * @param pixelShaderStr - Pixel/fragment shader source code string
 * @param options - Configuration object for the custom material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @param options.isSkinning - Enable skeletal animation support
 * @param options.isLighting - Enable lighting calculations
 * @param options.isMorphing - Enable morph target animation support
 * @param options.additionalShaderSemanticInfo - Additional shader semantic info for textures etc.
 * @returns A reused or newly created Custom Material instance
 */
export function reuseOrRecreateCustomMaterial(
  engine: Engine,
  vertexShaderStr: string,
  pixelShaderStr: string,
  options: PbrUberMaterialOptions = {},
  currentMaterial?: Material
) {
  const hash = DataUtil.toCRC32(vertexShaderStr + pixelShaderStr);
  const materialName = `Custom_${hash}`;

  // Create a copy of the Set to avoid mutating the original material's shader defines
  // if the material is not compatible and a new one needs to be created
  const definitions = currentMaterial ? new Set(currentMaterial.getShaderDefines()) : new Set<string>();
  if (options.isPbr) {
    definitions.add('RN_USE_PBR');
  } else {
    definitions.delete('RN_USE_PBR');
  }
  // Create a local copy of additionalShaderSemanticInfo to avoid mutating the input options object.
  // This prevents accumulation of duplicate shadow entries when the same options object is reused.
  let additionalShaderSemanticInfo = options.additionalShaderSemanticInfo
    ? [...options.additionalShaderSemanticInfo]
    : [];

  if (options.isLighting) {
    definitions.add('RN_IS_LIGHTING');
    if (options.isShadow && engine.config.maxLightNumber > 0) {
      definitions.add('RN_USE_SHADOW_MAPPING');

      const sampler = getSharedSampler(engine, {
        minFilter: TextureParameter.Linear,
        magFilter: TextureParameter.Linear,
        wrapS: TextureParameter.ClampToEdge,
        wrapT: TextureParameter.ClampToEdge,
      });

      additionalShaderSemanticInfo.push({
        semantic: 'depthTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2DArray,
        stage: ShaderType.VertexAndPixelShader,
        initialValue: [-1, engine.dummyTextures.dummyDepthMomentTextureArray, sampler],
        min: 0,
        max: Number.MAX_VALUE,
      });
      additionalShaderSemanticInfo.push({
        semantic: 'paraboloidDepthTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2DArray,
        stage: ShaderType.VertexAndPixelShader,
        initialValue: [-1, engine.dummyTextures.dummyDepthMomentTextureArray, sampler],
        min: 0,
        max: Number.MAX_VALUE,
      });
      additionalShaderSemanticInfo.push({
        semantic: 'depthTextureIndexList',
        componentType: ComponentType.Int,
        compositionType: CompositionType.ScalarArray,
        arrayLength: engine.config.maxLightNumber,
        stage: ShaderType.VertexAndPixelShader,
        initialValue: new VectorN(new Int32Array(engine.config.maxLightNumber)),
        min: 0,
        max: Number.MAX_VALUE,
      });
      // BiasMatrix * LightProjectionMatrix * LightViewMatrix, See: http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-16-shadow-mapping/#basic-shader
      additionalShaderSemanticInfo.push({
        semantic: 'depthBiasPV',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Mat4Array,
        arrayLength: engine.config.maxLightNumber,
        stage: ShaderType.VertexAndPixelShader,
        initialValue: new VectorN(new Float32Array(engine.config.maxLightNumber * 16)),
        min: 0,
        max: Number.MAX_VALUE,
      });
      additionalShaderSemanticInfo.push({
        semantic: 'pointLightFarPlane',
        componentType: ComponentType.Float,
        compositionType: CompositionType.ScalarArray,
        arrayLength: engine.config.maxLightNumber,
        stage: ShaderType.VertexAndPixelShader,
        initialValue: new VectorN(new Float32Array(engine.config.maxLightNumber).fill(1000.0)),
        min: 0,
        max: Number.MAX_VALUE,
      });
      additionalShaderSemanticInfo.push({
        semantic: 'pointLightShadowMapUvScale',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.VertexAndPixelShader,
        initialValue: Scalar.fromCopyNumber(0.93),
        min: 0,
        max: Number.MAX_VALUE,
      });
    } else {
      definitions.delete('RN_USE_SHADOW_MAPPING');
    }
  } else {
    definitions.delete('RN_IS_LIGHTING');
    definitions.delete('RN_USE_SHADOW_MAPPING');
  }
  if (options.isSkinning) {
    definitions.add('RN_IS_SKINNING');
  }
  if (options.isMorphing) {
    definitions.add('RN_IS_MORPHING');
  }
  if (options.isOcclusion) {
    definitions.add('RN_USE_OCCLUSION_TEXTURE');
  } else {
    definitions.delete('RN_USE_OCCLUSION_TEXTURE');
  }
  if (options.useNormalTexture) {
    definitions.add('RN_USE_NORMAL_TEXTURE');
  } else {
    definitions.delete('RN_USE_NORMAL_TEXTURE');
  }
  if (options.isSpecular) {
    definitions.add('RN_USE_SPECULAR');
  } else {
    definitions.delete('RN_USE_SPECULAR');
  }
  if (options.isSheen) {
    definitions.add('RN_USE_SHEEN');
  } else {
    definitions.delete('RN_USE_SHEEN');
  }
  if (options.isIridescence) {
    definitions.add('RN_USE_IRIDESCENCE');
  } else {
    definitions.delete('RN_USE_IRIDESCENCE');
  }
  if (options.isClearcoat) {
    definitions.add('RN_USE_CLEARCOAT');
  } else {
    definitions.delete('RN_USE_CLEARCOAT');
  }
  if (options.isTransmission) {
    definitions.add('RN_USE_TRANSMISSION');
  } else {
    definitions.delete('RN_USE_TRANSMISSION');
  }
  if (options.isVolume) {
    definitions.add('RN_USE_VOLUME');
  } else {
    definitions.delete('RN_USE_VOLUME');
  }
  if (options.isAnisotropy) {
    definitions.add('RN_USE_ANISOTROPY');
  } else {
    definitions.delete('RN_USE_ANISOTROPY');
  }
  if (options.isDiffuseTransmission) {
    definitions.add('RN_USE_DIFFUSE_TRANSMISSION');
  } else {
    definitions.delete('RN_USE_DIFFUSE_TRANSMISSION');
  }
  if (options.isDispersion) {
    definitions.add('RN_USE_DISPERSION');
  } else {
    definitions.delete('RN_USE_DISPERSION');
  }

  let materialContent: CustomMaterialContent;
  if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
    materialContent = new CustomMaterialContent(engine, {
      name: materialName,
      isSkinning: options.isSkinning ?? true,
      isLighting: options.isLighting ?? true,
      isMorphing: options.isMorphing ?? true,
      vertexShaderWebGpu: {
        code: vertexShaderStr,
        shaderStage: 'vertex',
        isFragmentShader: false,
      },
      pixelShaderWebGpu: {
        code: pixelShaderStr,
        shaderStage: 'fragment',
        isFragmentShader: true,
      },
      additionalShaderSemanticInfo,
      definitions: Array.from(definitions),
    });
  } else {
    materialContent = new CustomMaterialContent(engine, {
      name: materialName,
      isSkinning: options.isSkinning ?? true,
      isLighting: options.isLighting ?? true,
      isMorphing: options.isMorphing ?? true,
      vertexShader: {
        code: vertexShaderStr,
        shaderStage: 'vertex',
        isFragmentShader: false,
      },
      pixelShader: {
        code: pixelShaderStr,
        shaderStage: 'fragment',
        isFragmentShader: true,
      },
      additionalShaderSemanticInfo,
      definitions: Array.from(definitions),
    });
  }

  const material = reuseOrRecreateMaterial(engine, materialContent, options.maxInstancesNumber ?? 1, currentMaterial);

  for (const definition of definitions) {
    material.addShaderDefine(definition);
  }

  return material;
}

/**
 * Result of creating a node-based custom material
 */
export interface NodeBasedMaterialResult {
  /** The created or reused material */
  material: Material;
  /** Whether the shader node graph contains a PbrShader node */
  hasPbrShaderNode: boolean;
  /** Whether the shader node graph contains a ClassicShader node */
  hasClassicShaderNode: boolean;
}

/**
 * Builds ShaderSemanticInfo array for textures used in the shader node graph.
 *
 * @param engine - The engine instance
 * @param textureInfos - Array of texture info objects containing name, stage, and defaultTexture
 * @returns Array of ShaderSemanticsInfo for textures
 */
export function buildTextureSemanticInfo(
  engine: Engine,
  textureInfos: { name: string; stage: string; defaultTexture: string }[]
): ShaderSemanticsInfo[] {
  const additionalShaderSemanticInfo: ShaderSemanticsInfo[] = [];

  // Create a default sampler for textures
  const sampler = getSharedSampler(engine, {
    minFilter: TextureParameter.LinearMipmapLinear,
    magFilter: TextureParameter.Linear,
    wrapS: TextureParameter.Repeat,
    wrapT: TextureParameter.Repeat,
  });

  for (const textureInfo of textureInfos) {
    // Map shader stage string to Rhodonite ShaderType
    let shaderStage: (typeof ShaderType)[keyof typeof ShaderType];
    switch (textureInfo.stage) {
      case 'Vertex':
        shaderStage = ShaderType.VertexShader;
        break;
      case 'Fragment':
        shaderStage = ShaderType.PixelShader;
        break;
      default: // Neutral
        shaderStage = ShaderType.VertexAndPixelShader;
        break;
    }

    // Select the appropriate dummy texture based on the defaultTexture setting
    let dummyTexture = engine.dummyTextures.dummyWhiteTexture;
    switch (textureInfo.defaultTexture) {
      case 'dummyBlackTexture':
        dummyTexture = engine.dummyTextures.dummyBlackTexture;
        break;
      case 'dummyBlueTexture':
        dummyTexture = engine.dummyTextures.dummyBlueTexture;
        break;
      default: // dummyWhiteTexture
        dummyTexture = engine.dummyTextures.dummyWhiteTexture;
        break;
    }

    additionalShaderSemanticInfo.push({
      semantic: textureInfo.name,
      componentType: ComponentType.Int,
      compositionType: CompositionType.Texture2D,
      stage: shaderStage,
      initialValue: [-1, dummyTexture, sampler],
      min: 0,
      max: Number.MAX_VALUE,
    });
  }

  return additionalShaderSemanticInfo;
}

/**
 * Adds IBL (Image-Based Lighting) related semantic info for PBR shading.
 *
 * @param engine - The engine instance
 * @param additionalShaderSemanticInfo - Array to add semantic info to
 */
export function addPbrIblSemanticInfo(engine: Engine, additionalShaderSemanticInfo: ShaderSemanticsInfo[]) {
  // Create a sampler for cube textures
  const sampler = getSharedSampler(engine, {
    minFilter: TextureParameter.LinearMipmapLinear,
    magFilter: TextureParameter.Linear,
    wrapS: TextureParameter.ClampToEdge,
    wrapT: TextureParameter.ClampToEdge,
    wrapR: TextureParameter.ClampToEdge,
  });

  const shaderStage = ShaderType.VertexAndPixelShader;

  additionalShaderSemanticInfo.push({
    semantic: 'diffuseEnvTexture',
    componentType: ComponentType.Int,
    compositionType: CompositionType.TextureCube,
    stage: shaderStage,
    initialValue: [-1, engine.dummyTextures.dummyBlackCubeTexture, sampler],
    min: 0,
    max: Number.MAX_VALUE,
    isInternalSetting: true,
  });

  additionalShaderSemanticInfo.push({
    semantic: 'specularEnvTexture',
    componentType: ComponentType.Int,
    compositionType: CompositionType.TextureCube,
    stage: shaderStage,
    initialValue: [-1, engine.dummyTextures.dummyBlackCubeTexture, sampler],
    min: 0,
    max: Number.MAX_VALUE,
    isInternalSetting: true,
  });

  additionalShaderSemanticInfo.push({
    semantic: 'inverseEnvironment',
    componentType: ComponentType.Bool,
    compositionType: CompositionType.Scalar,
    stage: shaderStage,
    initialValue: Scalar.fromCopyNumber(0),
    min: 0,
    max: Number.MAX_VALUE,
  });

  additionalShaderSemanticInfo.push({
    semantic: 'iblParameter',
    componentType: ComponentType.Float,
    compositionType: CompositionType.Vec4,
    stage: shaderStage,
    initialValue: Vector4.fromCopy4(1, 1, 1, 1),
    min: 0,
    max: Number.MAX_VALUE,
    isInternalSetting: true,
  });

  additionalShaderSemanticInfo.push({
    semantic: 'hdriFormat',
    componentType: ComponentType.Int,
    compositionType: CompositionType.Vec2,
    stage: shaderStage,
    initialValue: Vector2.fromCopy2(0, 0),
    min: 0,
    max: Number.MAX_VALUE,
    isInternalSetting: true,
  });
  addBackBufferTextureSemanticInfo(engine, additionalShaderSemanticInfo, shaderStage);
}

/**
 * Adds the transmission back buffer texture semantic.
 *
 * The texture is the resolved scene color supplied by ForwardRenderPipeline on each
 * frame (see ForwardRenderPipeline.__setupRaymarchingExpression and
 * __setTransparentExpressionsForTransmission), so this is not an internal setting:
 * the pipeline assigns it through setTextureParameter and the material auto-binds it
 * on every draw.
 *
 * @param engine - The engine instance
 * @param additionalShaderSemanticInfo - Array to add semantic info to
 * @param stage - Shader stage that declares the texture
 */
export function addBackBufferTextureSemanticInfo(
  engine: Engine,
  additionalShaderSemanticInfo: ShaderSemanticsInfo[],
  stage: ShaderTypeEnum
) {
  const sampler = getSharedSampler(engine, {
    minFilter: TextureParameter.LinearMipmapLinear,
    magFilter: TextureParameter.Linear,
    wrapS: TextureParameter.ClampToEdge,
    wrapT: TextureParameter.ClampToEdge,
  });
  additionalShaderSemanticInfo.push({
    semantic: 'backBufferTexture',
    componentType: ComponentType.Int,
    compositionType: CompositionType.Texture2D,
    stage,
    initialValue: [-1, engine.dummyTextures.dummyBlackTexture, sampler],
    min: 0,
    max: Number.MAX_VALUE,
  });
}

/**
 * Adds Sheen related semantic info for PBR shading with sheen.
 * This adds the sheenLutTexture needed for sheen BRDF calculations.
 *
 * @param engine - The engine instance
 * @param additionalShaderSemanticInfo - Array to add semantic info to
 */
export function addPbrSheenSemanticInfo(
  engine: Engine,
  additionalShaderSemanticInfo: ShaderSemanticsInfo[],
  { sheenEnvIsInternalSetting = true }: { sheenEnvIsInternalSetting?: boolean } = {}
) {
  // Create a sampler for sheen LUT texture
  const sampler = getSharedSampler(engine, {
    minFilter: TextureParameter.Linear,
    magFilter: TextureParameter.Linear,
    wrapS: TextureParameter.ClampToEdge,
    wrapT: TextureParameter.ClampToEdge,
  });

  additionalShaderSemanticInfo.push({
    semantic: 'sheenLutTexture',
    componentType: ComponentType.Int,
    compositionType: CompositionType.Texture2D,
    stage: ShaderType.VertexAndPixelShader,
    initialValue: [-1, engine.dummyTextures.sheenLutTexture, sampler],
    min: 0,
    max: Number.MAX_VALUE,
  });

  // Create a sampler for sheen environment texture (cube map)
  const cubeSampler = getSharedSampler(engine, {
    minFilter: TextureParameter.LinearMipmapLinear,
    magFilter: TextureParameter.Linear,
    wrapS: TextureParameter.ClampToEdge,
    wrapT: TextureParameter.ClampToEdge,
    wrapR: TextureParameter.ClampToEdge,
  });

  // Add sheenEnvTexture for IBL sheen calculations
  additionalShaderSemanticInfo.push({
    semantic: 'sheenEnvTexture',
    componentType: ComponentType.Int,
    compositionType: CompositionType.TextureCube,
    stage: ShaderType.VertexAndPixelShader,
    isInternalSetting: sheenEnvIsInternalSetting,
    initialValue: [-1, engine.dummyTextures.dummyBlackCubeTexture, cubeSampler],
    min: 0,
    max: Number.MAX_VALUE,
  });
}
