import {
  GL_DST_ALPHA,
  GL_DST_COLOR,
  GL_ONE,
  GL_ONE_MINUS_DST_ALPHA,
  GL_ONE_MINUS_DST_COLOR,
  GL_ONE_MINUS_SRC_ALPHA,
  GL_ONE_MINUS_SRC_COLOR,
  GL_SRC_ALPHA,
  GL_SRC_ALPHA_SATURATE,
  GL_SRC_COLOR,
  GL_ZERO,
  type Vrm0xMaterialProperty,
} from '../../../types';
import type { Array3, Array4, Count } from '../../../types/CommonTypes';
import mToonSingleShaderFragment from '../../../webgl/shaderity_shaders/MToon0xSingleShader/MToon0xSingleShader.frag.glsl';
import mToonSingleShaderVertex from '../../../webgl/shaderity_shaders/MToon0xSingleShader/MToon0xSingleShader.vert.glsl';
import type { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import mToonSingleShaderFragmentWebGpu from '../../../webgpu/shaderity_shaders/MToon0xSingleShader/MToon0xSingleShader.frag.wgsl';
import mToonSingleShaderVertexWebGpu from '../../../webgpu/shaderity_shaders/MToon0xSingleShader/MToon0xSingleShader.vert.wgsl';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { WellKnownComponentTIDs } from '../../components/WellKnownComponentTIDs';
import { ComponentRepository } from '../../core/ComponentRepository';
import { Config } from '../../core/Config';
import { HdriFormat, ProcessApproach, ProcessApproachClass, TextureParameter } from '../../definitions';
import { AlphaMode } from '../../definitions/AlphaMode';
import { Blend } from '../../definitions/Blend';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ShaderSemantics, ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { ShaderType } from '../../definitions/ShaderType';
import { MutableVector2 } from '../../math/MutableVector2';
import { MutableVector4 } from '../../math/MutableVector4';
import { Scalar } from '../../math/Scalar';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { VectorN } from '../../math/VectorN';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import type { Engine } from '../../system/Engine';
import { EngineState } from '../../system/EngineState';
import { Sampler } from '../../textures/Sampler';
import type { Texture } from '../../textures/Texture';
import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import type { Material } from '../core/Material';

/**
 * Material content implementation for MToon 0.x shader.
 * This class handles the creation and configuration of MToon materials,
 * which are commonly used for toon-style rendering in VRM models.
 */
export class MToon0xMaterialContent extends AbstractMaterialContent {
  private __diffuseIblCubeMapSampler: Sampler;
  private __specularIblCubeMapSampler: Sampler;
  static readonly _Cutoff = new ShaderSemanticsClass({ str: 'cutoff' });
  static readonly _Color = new ShaderSemanticsClass({ str: 'litColor' });
  static readonly _ShadeColor = new ShaderSemanticsClass({ str: 'shadeColor' });
  public static readonly _litColorTexture = new ShaderSemanticsClass({ str: 'litColorTexture' });
  public static readonly _shadeColorTexture = new ShaderSemanticsClass({
    str: 'shadeColorTexture',
  });
  static readonly _BumpScale = new ShaderSemanticsClass({ str: 'normalScale' });
  public static readonly _normalTexture = new ShaderSemanticsClass({ str: 'normalTexture' });
  static readonly _ReceiveShadowRate = new ShaderSemanticsClass({
    str: 'receiveShadowRate',
  });
  public static readonly _receiveShadowTexture = new ShaderSemanticsClass({
    str: 'receiveShadowTexture',
  });
  static readonly _ShadingGradeRate = new ShaderSemanticsClass({
    str: 'shadingGradeRate',
  });
  public static readonly _shadingGradeTexture = new ShaderSemanticsClass({
    str: 'shadingGradeTexture',
  });
  static readonly _ShadeShift = new ShaderSemanticsClass({ str: 'shadeShift' });
  static readonly _ShadeToony = new ShaderSemanticsClass({ str: 'shadeToony' });
  static readonly _LightColorAttenuation = new ShaderSemanticsClass({
    str: 'lightColorAttenuation',
  });
  static readonly _AmbientColor = new ShaderSemanticsClass({
    str: 'ambientColor',
  });
  static readonly _IndirectLightIntensity = new ShaderSemanticsClass({
    str: 'indirectLightIntensity',
  });
  public static readonly _rimTexture = new ShaderSemanticsClass({ str: 'rimTexture' });
  static readonly _RimColor = new ShaderSemanticsClass({ str: 'rimColor' });
  static readonly _RimLightingMix = new ShaderSemanticsClass({
    str: 'rimLightingMix',
  });
  static readonly _RimFresnelPower = new ShaderSemanticsClass({
    str: 'rimFresnelPower',
  });
  static readonly _RimLift = new ShaderSemanticsClass({ str: 'rimLift' });
  public static readonly _matCapTexture = new ShaderSemanticsClass({ str: 'matCapTexture' });
  static readonly _EmissionColor = new ShaderSemanticsClass({
    str: 'emissionColor',
  });
  public static readonly _emissionTexture = new ShaderSemanticsClass({
    str: 'emissionTexture',
  });
  public static readonly _OutlineWidthTexture = new ShaderSemanticsClass({
    str: 'outlineWidthTexture',
  });
  static readonly _OutlineWidth = new ShaderSemanticsClass({
    str: 'outlineWidth',
  });
  static readonly _OutlineScaledMaxDistance = new ShaderSemanticsClass({
    str: 'outlineScaledMaxDistance',
  });
  static readonly _OutlineColor = new ShaderSemanticsClass({
    str: 'outlineColor',
  });
  static readonly _OutlineLightingMix = new ShaderSemanticsClass({
    str: 'outlineLightingMix',
  });

  static readonly Aspect = new ShaderSemanticsClass({ str: 'aspect' });
  static readonly CameraUp = new ShaderSemanticsClass({ str: 'cameraUp' });

  static usableBlendEquationModeAlpha?: number;
  private __OutlineWidthModeIsScreen = false;

  private __floatProperties: {
    [s: string]: number;
  } = {};
  private __vectorProperties: {
    [s: string]: Array3<number> | Array4<number>;
  } = {};
  private __textureProperties: any = {};

  /**
   * Creates a new MToon 0.x material content instance.
   *
   * @param engine - The engine instance
   * @param isOutline - Whether this material is for outline rendering
   * @param materialProperties - VRM material properties from the glTF file
   * @param textures - Array of textures used by the material
   * @param samplers - Array of samplers for texture sampling configuration
   * @param isMorphing - Whether morphing (blend shapes) is enabled
   * @param isSkinning - Whether skeletal animation is enabled
   * @param isLighting - Whether lighting calculations are enabled
   * @param useTangentAttribute - Whether to use tangent attributes for normal mapping
   * @param debugMode - Debug visualization mode (optional)
   * @param makeOutputSrgb - Whether to convert output to sRGB color space
   * @param materialName - Name identifier for the material
   * @param definitions - Additional shader preprocessor definitions
   */
  constructor(
    engine: Engine,
    isOutline: boolean,
    materialProperties: Vrm0xMaterialProperty | undefined,
    textures: any,
    samplers: Sampler[],
    isMorphing: boolean,
    isSkinning: boolean,
    isLighting: boolean,
    useTangentAttribute: boolean,
    debugMode: Count | undefined,
    makeOutputSrgb: boolean,
    materialName: string,
    definitions: string[]
  ) {
    super(materialName, {
      isMorphing: isMorphing,
      isSkinning: isSkinning,
      isLighting: isLighting,
    });

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = this.doShaderReflection(
      engine,
      mToonSingleShaderVertex,
      mToonSingleShaderFragment,
      mToonSingleShaderVertexWebGpu,
      mToonSingleShaderFragmentWebGpu,
      definitions
    );

    this.__diffuseIblCubeMapSampler = new Sampler(engine, {
      minFilter: TextureParameter.Linear,
      magFilter: TextureParameter.Linear,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
      wrapR: TextureParameter.ClampToEdge,
    });
    this.__specularIblCubeMapSampler = new Sampler(engine, {
      minFilter: TextureParameter.LinearMipmapLinear,
      magFilter: TextureParameter.Linear,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
      wrapR: TextureParameter.ClampToEdge,
    });
    if (!this.__diffuseIblCubeMapSampler.created) {
      this.__diffuseIblCubeMapSampler.create();
    }

    if (!this.__specularIblCubeMapSampler.created) {
      this.__specularIblCubeMapSampler.create();
    }

    if (materialProperties != null) {
      this.__floatProperties = materialProperties.floatProperties;
      this.__vectorProperties = materialProperties.vectorProperties;
      this.__textureProperties = JSON.parse(JSON.stringify(materialProperties.textureProperties));
    } else {
      this.__floatProperties._BlendMode = 0.0;
      this.__floatProperties._BumpScale = 1.0;
      this.__floatProperties._CullMode = 2.0;
      this.__floatProperties._Cutoff = 0.5;
      this.__floatProperties._DebugMode = 0.0;
      this.__floatProperties._DstBlend = 0.0;
      this.__floatProperties._IndirectLightIntensity = 0.1;
      this.__floatProperties._LightColorAttenuation = 0.0;
      this.__floatProperties._OutlineColorMode = 0.0;
      this.__floatProperties._OutlineCullMode = 1.0;
      this.__floatProperties._OutlineLightingMix = 1.0;
      this.__floatProperties._OutlineScaledMaxDistance = 1.0;
      this.__floatProperties._OutlineWidth = 0.5;
      this.__floatProperties._OutlineWidthMode = 0.0;
      this.__floatProperties._ReceiveShadowRate = 1.0;
      this.__floatProperties._RimFresnelPower = 1.0;
      this.__floatProperties._RimLift = 0.0;
      this.__floatProperties._RimLightingMix = 0.0;
      this.__floatProperties._ShadeShift = 0.0;
      this.__floatProperties._ShadeToony = 0.9;
      this.__floatProperties._ShadingGradeRate = 1.0;
      this.__floatProperties._SrcBlend = 1.0;
      this.__floatProperties._ZWrite = 1.0;
      this.__floatProperties._UvAnimScrollX = 0.0;
      this.__floatProperties._UvAnimScrollY = 0.0;
      this.__floatProperties._UvAnimRotation = 0.0;

      this.__vectorProperties._Color = [1, 1, 1, 1];
      this.__vectorProperties._EmissionColor = [0, 0, 0];
      this.__vectorProperties._OutlineColor = [0, 0, 0, 1];
      this.__vectorProperties._ShadeColor = [0.97, 0.81, 0.86, 1];
      this.__vectorProperties._RimColor = [0, 0, 0];
      // this.__vectorProperties._BumpMap = [0, 0, 1, 1];
      // this.__vectorProperties._EmissionMap = [0, 0, 1, 1];
      // this.__vectorProperties._MainTex = [0, 0, 1, 1];
      // this.__vectorProperties._OutlineWidthTexture = [0, 0, 1, 1];
      // this.__vectorProperties._ReceiveShadowTexture = [0, 0, 1, 1];
      // this.__vectorProperties._ShadeTexture = [0, 0, 1, 1];
      // this.__vectorProperties._ShadingGradeTexture = [0, 0, 1, 1];
      // this.__vectorProperties._SphereAdd = [0, 0, 1, 1];
    }

    if (debugMode) {
      this.__floatProperties._DebugMode = debugMode;
    }

    // non-Texture
    shaderSemanticsInfoArray.push(
      {
        semantic: 'cutoff',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.__floatProperties._Cutoff),
        min: 0,
        max: 1,
      },
      {
        semantic: 'litColor',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader,
        initialValue: Vector4.fromCopyArray(this.__vectorProperties._Color as Array4<number>),
        min: 0,
        max: 1,
      },
      {
        semantic: 'shadeColor',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader,
        initialValue: Vector3.fromCopyArray(this.__vectorProperties._ShadeColor),
        min: 0,
        max: 1,
      },
      {
        semantic: 'bumpScale',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.__floatProperties._BumpScale),
        min: 0,
        max: 1,
      },
      {
        semantic: 'receiveShadowRate',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.__floatProperties._ReceiveShadowRate),
        min: 0,
        max: 1,
      },
      {
        semantic: 'shadingGradeRate',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.__floatProperties._ShadingGradeRate),
        min: 0,
        max: 1,
      },
      {
        semantic: 'shadeShift',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.__floatProperties._ShadeShift),
        min: 0,
        max: 1,
      },
      {
        semantic: 'shadeToony',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.__floatProperties._ShadeToony),
        min: 0,
        max: 1,
      },
      {
        semantic: 'lightColorAttenuation',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.__floatProperties._LightColorAttenuation),
        min: 0,
        max: 1,
      },
      {
        semantic: 'indirectLightIntensity',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.__floatProperties._IndirectLightIntensity),
        min: 0,
        max: 1,
      },
      {
        semantic: 'rimColor',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader,
        initialValue: Vector3.fromCopyArray(this.__vectorProperties._RimColor as Array3<number>),
        min: 0,
        max: 1,
      },
      {
        semantic: 'rimLightingMix',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.__floatProperties._RimLightingMix),
        min: 0,
        max: 1,
      },
      {
        semantic: 'rimFresnelPower',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.__floatProperties._RimFresnelPower),
        min: 0,
        max: 1,
      },
      {
        semantic: 'rimLift',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.__floatProperties._RimLift),
        min: 0,
        max: 1,
      },
      {
        semantic: 'cameraUp',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader,
        soloDatum: true,
        initialValue: Vector3.fromCopyArray([0, 1, 0]),
        min: 0,
        max: 1,
      },
      {
        semantic: 'emissionColor',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader,
        initialValue: Vector3.fromCopyArray(this.__vectorProperties._EmissionColor as Array3<number>),
        min: 0,
        max: 1,
      },
      {
        semantic: 'uvAnimationScrollXSpeedFactor',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isInternalSetting: false,
        initialValue: Scalar.fromCopyNumber(this.__floatProperties._UvAnimScrollX ?? 0.0),
        min: 0,
        max: 1,
      },
      {
        semantic: 'uvAnimationScrollYSpeedFactor',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isInternalSetting: false,
        initialValue: Scalar.fromCopyNumber(this.__floatProperties._UvAnimScrollY ?? 0.0),
        min: 0,
        max: 1,
      },
      {
        semantic: 'uvAnimationRotationSpeedFactor',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isInternalSetting: false,
        initialValue: Scalar.fromCopyNumber(this.__floatProperties._UvAnimRotation ?? 0.0),
        min: 0,
        max: 1,
      },

      {
        semantic: 'wireframe',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader,
        initialValue: Vector3.fromCopyArray([0, 0, 1]),
        min: 0,
        max: 10,
      },
      {
        semantic: 'makeOutputSrgb',
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Bool,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 1,
        initialValue: Scalar.fromCopyNumber(makeOutputSrgb ? 1 : 0),
      }
    );

    // _DebugMode
    switch (this.__floatProperties._DebugMode) {
      case 1:
        this.__definitions += '#define RN_MTOON_DEBUG_NORMAL\n';
        break;
      case 2:
        this.__definitions += '#define RN_MTOON_DEBUG_LITSHADERATE\n';
        break;
    }

    if (isOutline) {
      this.__definitions += '#define RN_MTOON_IS_OUTLINE\n';

      // _OutlineWidthMode
      switch (this.__floatProperties._OutlineWidthMode) {
        case 0:
          this.__definitions += '#define RN_MTOON_OUTLINE_NONE\n';
          break;
        case 1:
          this.__definitions += '#define RN_MTOON_OUTLINE_WIDTH_WORLD\n';
          break;
        case 2:
          this.__definitions += '#define RN_MTOON_OUTLINE_WIDTH_SCREEN\n';
          this.__OutlineWidthModeIsScreen = true;
          break;
      }

      // _OutlineColorMode
      switch (this.__floatProperties._OutlineColorMode) {
        case 0:
          this.__definitions += '#define RN_MTOON_OUTLINE_COLOR_FIXED\n';
          break;
        case 1:
          this.__definitions += '#define RN_MTOON_OUTLINE_COLOR_MIXED\n';
          break;
      }

      shaderSemanticsInfoArray.push(
        {
          semantic: 'outlineWidth',
          componentType: ComponentType.Float,
          compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader,
          initialValue: Scalar.fromCopyNumber(this.__floatProperties._OutlineWidth),
          min: 0,
          max: 1,
        },
        {
          semantic: 'outlineScaledMaxDistance',
          componentType: ComponentType.Float,
          compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader,
          initialValue: Scalar.fromCopyNumber(this.__floatProperties._OutlineScaledMaxDistance),
          min: 0,
          max: 1,
        },
        {
          semantic: 'outlineColor',
          componentType: ComponentType.Float,
          compositionType: CompositionType.Vec3,
          stage: ShaderType.PixelShader,
          initialValue: Vector4.fromCopyArray(this.__vectorProperties._OutlineColor as Array4<number>),
          min: 0,
          max: 1,
        },
        {
          semantic: 'outlineLightingMix',
          componentType: ComponentType.Float,
          compositionType: CompositionType.Scalar,
          stage: ShaderType.PixelShader,
          initialValue: Scalar.fromCopyNumber(this.__floatProperties._OutlineLightingMix),
          min: 0,
          max: 1,
        },
        {
          semantic: 'aspect',
          componentType: ComponentType.Float,
          compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader,
          isInternalSetting: true,
          soloDatum: true,
          initialValue: Scalar.fromCopyNumber(1.0),
          min: 0,
          max: 1,
        }
      );
    }

    if (isLighting) {
      this.__definitions += '#define RN_IS_LIGHTING\n';
    }

    if (isSkinning) {
      this.__definitions += '#define RN_IS_SKINNING\n';
    }

    if (isMorphing) {
      this.__definitions += '#define RN_IS_MORPHING\n';
    }

    if (useTangentAttribute) {
      this.__definitions += '#define RN_USE_TANGENT_ATTRIBUTE\n';
    }

    // Texture
    if (this.__textureProperties._BumpMap >= 0) {
      //textures.length - 2 is dummyTexture
      this.__definitions += '#define RN_MTOON_HAS_BUMPMAP\n';
    }
    if (this.__textureProperties._OutlineWidthTexture >= 0) {
      //textures.length - 2 is dummyTexture
      this.__definitions += '#define RN_MTOON_HAS_OUTLINE_WIDTH_TEXTURE\n';
    }
    textures = [engine.dummyTextures.dummyWhiteTexture, engine.dummyTextures.dummyBlackTexture];
    this.__textureProperties._BumpMap = 0;
    this.__textureProperties._EmissionMap = 1;
    this.__textureProperties._MainTex = 0;
    this.__textureProperties._OutlineWidthTexture = 0;
    this.__textureProperties._UvAnimMaskTexture = 0;
    this.__textureProperties._ReceiveShadowTexture = 0;
    this.__textureProperties._RimTexture = 1;
    this.__textureProperties._ShadeTexture = 0;
    this.__textureProperties._ShadingGradeTexture = 0;
    this.__textureProperties._SphereAdd = 1;
    // this.__textureProperties._UvAnimMaskTexture = 0;
    this.__setDummyTextures(textures, samplers, shaderSemanticsInfoArray, isOutline);

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  /**
   * Sets up dummy textures and their associated shader semantics information.
   * This method configures default texture bindings for various MToon texture slots
   * and adds corresponding shader semantics entries.
   *
   * @param textures - Array of available textures
   * @param samplers - Array of texture samplers
   * @param shaderSemanticsInfoArray - Array to populate with shader semantics information
   * @param isOutline - Whether outline textures should be included
   * @private
   */
  private __setDummyTextures(
    textures: Texture[],
    samplers: Sampler[],
    shaderSemanticsInfoArray: ShaderSemanticsInfo[],
    isOutline: boolean
  ) {
    shaderSemanticsInfoArray.push(
      {
        semantic: 'litColorTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [0, textures[this.__textureProperties._MainTex], samplers[this.__textureProperties._MainTex]],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'shadeColorTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [
          1,
          textures[this.__textureProperties._ShadeTexture],
          samplers[this.__textureProperties._ShadeTexture],
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'receiveShadowTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [
          2,
          textures[this.__textureProperties._ReceiveShadowTexture],
          samplers[this.__textureProperties._ReceiveShadowTexture],
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'shadingGradeTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [
          3,
          textures[this.__textureProperties._ShadingGradeTexture],
          samplers[this.__textureProperties._ShadingGradeTexture],
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'rimTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [
          4,
          textures[this.__textureProperties._RimTexture],
          samplers[this.__textureProperties._RimTexture],
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'matCapTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [8, textures[this.__textureProperties._SphereAdd], samplers[this.__textureProperties._SphereAdd]],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'emissionTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [
          9,
          textures[this.__textureProperties._EmissionMap],
          samplers[this.__textureProperties._EmissionMap],
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      }
    );

    shaderSemanticsInfoArray.push(
      {
        // number 7 of texture is the data Texture
        semantic: 'normalTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [10, textures[this.__textureProperties._BumpMap], samplers[this.__textureProperties._BumpMap]],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'uvAnimationMaskTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [
          11,
          textures[this.__textureProperties._UvAnimMaskTexture],
          samplers[this.__textureProperties._UvAnimMaskTexture],
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      }
    );

    if (isOutline) {
      shaderSemanticsInfoArray.push({
        semantic: 'outlineWidthTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.VertexShader,
        initialValue: [
          12,
          textures[this.__textureProperties._OutlineWidthTexture],
          samplers[this.__textureProperties._OutlineWidthTexture],
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      });
    }
  }

  /**
   * Configures material parameters based on MToon properties.
   * This method sets up blending modes, culling, and other rendering states
   * based on the material's MToon properties.
   *
   * @param material - The material instance to configure
   * @param isOutline - Whether this is an outline material
   */
  setMaterialParameters(engine: Engine, material: Material, isOutline: boolean) {
    if (MToon0xMaterialContent.usableBlendEquationModeAlpha == null) {
      MToon0xMaterialContent.__initializeUsableBlendEquationModeAlpha(engine);
    }

    if (this.__floatProperties._BlendMode !== 0) {
      switch (this.__floatProperties._BlendMode) {
        case 1:
          this.__definitions += '#define RN_ALPHATEST_ON\n';
          material.alphaMode = AlphaMode.Mask;
          break;
        case 2:
          this.__definitions += '#define RN_ALPHABLEND_ON\n';
          material.alphaMode = AlphaMode.Blend;
          break;
        case 3:
          this.__definitions += '#define RN_ALPHABLEND_ON\n';
          material.alphaMode = AlphaMode.Blend;
          break;
      }

      const blendEquationMode = 32774; // gl.FUNC_ADD
      const blendEquationModeAlpha = MToon0xMaterialContent.usableBlendEquationModeAlpha;
      const blendFuncSrcFactor = MToon0xMaterialContent.unityBlendEnumCorrespondence(this.__floatProperties._SrcBlend);
      const blendFuncDstFactor = MToon0xMaterialContent.unityBlendEnumCorrespondence(this.__floatProperties._DstBlend);

      material.setBlendEquationMode(
        Blend.from(blendEquationMode),
        blendEquationModeAlpha != null ? Blend.from(blendEquationModeAlpha) : undefined
      );
      material.setBlendFuncFactor(Blend.from(blendFuncSrcFactor), Blend.from(blendFuncDstFactor));
    }

    if (isOutline) {
      switch (this.__floatProperties._OutlineCullMode) {
        case 0:
          material.cullFace = false;
          break;
        case 1:
          material.cullFace = true;
          material.cullFaceBack = false;
          break;
        case 2:
          material.cullFace = true;
          material.cullFaceBack = true;
          break;
      }
    } else {
      switch (this.__floatProperties._CullMode) {
        case 0:
          material.cullFace = false;
          break;
        case 1:
          material.cullFace = true;
          material.cullFaceBack = false;
          break;
        case 2:
          material.cullFace = true;
          material.cullFaceBack = true;
          break;
      }
    }

    material.zWriteWhenBlend = this.__floatProperties._ZWrite === 1;
  }

  /**
   * Initializes the usable blend equation mode for alpha blending.
   * This method determines the appropriate blend equation mode based on
   * the current rendering API and available extensions.
   *
   * @private
   */
  private static __initializeUsableBlendEquationModeAlpha(engine: Engine) {
    if (EngineState.currentProcessApproach === ProcessApproach.WebGPU) {
      MToon0xMaterialContent.usableBlendEquationModeAlpha = 32776; // gl.MAX
    } else {
      const webGLResourceRepository = engine.webglResourceRepository;
      const glw = webGLResourceRepository.currentWebGLContextWrapper;
      const gl = glw!.getRawContextAsWebGL2();
      if (glw!.isWebGL2) {
        MToon0xMaterialContent.usableBlendEquationModeAlpha = gl.MAX;
      } else if (glw!.webgl1ExtBM) {
        MToon0xMaterialContent.usableBlendEquationModeAlpha = glw!.webgl1ExtBM.MAX_EXT;
      } else {
        MToon0xMaterialContent.usableBlendEquationModeAlpha = gl.FUNC_ADD;
      }
    }
  }

  /**
   * Sets internal shader parameters for WebGPU rendering.
   * This method configures camera-related and IBL (Image-Based Lighting) parameters
   * that are managed internally by the material system.
   *
   * @param params - Object containing material and rendering arguments
   * @param params.material - The material instance to configure
   * @param params.args - WebGPU rendering arguments
   */
  _setInternalSettingParametersToGpuWebGpu({
    engine,
    material,
    args,
  }: {
    engine: Engine;
    material: Material;
    args: RenderingArgWebGpu;
  }) {
    let cameraComponent = engine.componentRepository.getComponentFromComponentTID(
      WellKnownComponentTIDs.CameraComponentTID,
      args.cameraComponentSid
    ) as CameraComponent;
    material.setParameter('cameraUp', cameraComponent.upInner);

    if (this.__OutlineWidthModeIsScreen) {
      material.setParameter('aspect', cameraComponent.aspect);
    }

    const { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType } =
      MToon0xMaterialContent.__setupHdriParameters(args);
    const tmp_vector4 = AbstractMaterialContent.__tmp_vector4;
    tmp_vector4.x = mipmapLevelNumber;
    tmp_vector4.y = meshRenderComponent!.diffuseCubeMapContribution;
    tmp_vector4.z = meshRenderComponent!.specularCubeMapContribution;
    tmp_vector4.w = meshRenderComponent!.rotationOfCubeMap;
    material.setParameter('iblParameter', tmp_vector4);
    const tmp_vector2 = AbstractMaterialContent.__tmp_vector2;
    tmp_vector2.x = diffuseHdriType;
    tmp_vector2.y = specularHdriType;
    material.setParameter('hdriFormat', tmp_vector2);

    const meshRendererComponent = args.entity.tryToGetMeshRenderer();
    if (
      meshRendererComponent != null &&
      meshRendererComponent.diffuseCubeMap != null &&
      meshRendererComponent.specularCubeMap != null
    ) {
      const iblParameterVec4 = MutableVector4.zero();
      const hdriFormatVec2 = MutableVector2.zero();

      iblParameterVec4.x = meshRendererComponent.specularCubeMap.mipmapLevelNumber;
      iblParameterVec4.y = meshRendererComponent.diffuseCubeMapContribution;
      iblParameterVec4.z = meshRendererComponent.specularCubeMapContribution;
      iblParameterVec4.w = meshRendererComponent.rotationOfCubeMap;
      material.setParameter('iblParameter', iblParameterVec4);

      hdriFormatVec2.x = meshRendererComponent.diffuseCubeMap.hdriFormat.index;
      hdriFormatVec2.y = meshRendererComponent.specularCubeMap.hdriFormat.index;
      material.setParameter('hdriFormat', hdriFormatVec2);
    }
  }

  /**
   * Sets shader-specific internal parameters for WebGL rendering.
   * This method is called once per shader program and sets up
   * IBL environment textures and other program-level uniforms.
   *
   * @param params - Object containing rendering parameters
   * @param params.shaderProgram - The WebGL shader program
   * @param params.args - WebGL rendering arguments
   */
  _setInternalSettingParametersToGpuWebGLPerShaderProgram({
    engine,
    shaderProgram,
    args,
  }: {
    engine: Engine;
    shaderProgram: WebGLProgram;
    args: RenderingArgWebGL;
  }) {
    const webglResourceRepository = engine.webglResourceRepository;
    // IBL Env map
    if (args.diffuseCube?.isTextureReady) {
      webglResourceRepository.setUniform1iForTexture(shaderProgram, ShaderSemantics.DiffuseEnvTexture.str, [
        5,
        args.diffuseCube,
        this.__diffuseIblCubeMapSampler,
      ]);
    } else {
      webglResourceRepository.setUniform1iForTexture(shaderProgram, ShaderSemantics.DiffuseEnvTexture.str, [
        5,
        engine.dummyTextures.dummyBlackCubeTexture,
      ]);
    }
    // if (args.specularCube && args.specularCube.isTextureReady) {
    //   webglResourceRepository.setUniform1iForTexture(
    //     shaderProgram,
    //     ShaderSemantics.SpecularEnvTexture.str,
    //     [6, args.specularCube, MToon0xMaterialContent.__specularIblCubeMapSampler]
    //   );
    // } else {
    //   webglResourceRepository.setUniform1iForTexture(
    //     shaderProgram,
    //     ShaderSemantics.SpecularEnvTexture.str,
    //     [6, dummyBlackCubeTexture]
    //   );
    // }
  }

  /**
   * Sets material-specific internal parameters for WebGL rendering.
   * This method is called per material and configures matrices, lighting,
   * morphing, skinning, and other per-material uniforms.
   *
   * @param params - Object containing rendering parameters
   * @param params.engine - The engine instance
   * @param params.material - The material instance
   * @param params.shaderProgram - The WebGL shader program
   * @param params.firstTime - Whether this is the first time setup
   * @param params.args - WebGL rendering arguments
   */
  _setInternalSettingParametersToGpuWebGLPerMaterial({
    engine,
    material,
    shaderProgram,
    firstTime,
    args,
  }: {
    engine: Engine;
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArgWebGL;
  }) {
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = engine.componentRepository.getComponent(
        CameraComponent,
        CameraComponent.getCurrent(engine)
      ) as CameraComponent;
    }

    if (args.setUniform) {
      /// Matrices
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
      this.setViewInfo(shaderProgram, cameraComponent, args.isVr, args.displayIdx);
      this.setProjection(shaderProgram, cameraComponent, args.isVr, args.displayIdx);

      /// Skinning
      const skeletalComponent = args.entity.tryToGetSkeletal();
      this.setSkinning(shaderProgram, args.setUniform, skeletalComponent);

      // Lights
      this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);

      (shaderProgram as any)._gl.uniform3fv((shaderProgram as any).cameraUp, cameraComponent.upInner._v);

      if (this.__OutlineWidthModeIsScreen) {
        (shaderProgram as any)._gl.uniform1f((shaderProgram as any).aspect, cameraComponent.aspect);
      }
    } else {
      material.setParameter('cameraUp', cameraComponent.upInner);

      if (this.__OutlineWidthModeIsScreen) {
        material.setParameter('aspect', cameraComponent.aspect);
      }
    }

    const webglResourceRepository = engine.webglResourceRepository;
    // IBL Parameters
    if (args.setUniform) {
      if (firstTime) {
        const { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType } =
          MToon0xMaterialContent.__setupHdriParameters(args);
        webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.IBLParameter.str, firstTime, {
          x: mipmapLevelNumber,
          y: meshRenderComponent!.diffuseCubeMapContribution,
          z: meshRenderComponent!.specularCubeMapContribution,
          w: meshRenderComponent!.rotationOfCubeMap,
        });
        webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.HDRIFormat.str, firstTime, {
          x: diffuseHdriType,
          y: specularHdriType,
        });
      }
    } else {
      const { mipmapLevelNumber, meshRenderComponent, diffuseHdriType, specularHdriType } =
        MToon0xMaterialContent.__setupHdriParameters(args);
      const tmp_vector4 = AbstractMaterialContent.__tmp_vector4;
      tmp_vector4.x = mipmapLevelNumber;
      tmp_vector4.y = meshRenderComponent!.diffuseCubeMapContribution;
      tmp_vector4.z = meshRenderComponent!.specularCubeMapContribution;
      tmp_vector4.w = meshRenderComponent!.rotationOfCubeMap;
      material.setParameter('iblParameter', tmp_vector4);
      const tmp_vector2 = AbstractMaterialContent.__tmp_vector2;
      tmp_vector2.x = diffuseHdriType;
      tmp_vector2.y = specularHdriType;
      material.setParameter('hdriFormat', tmp_vector2);
    }

    // Morph
    const blendShapeComponent = args.entity.tryToGetBlendShape();
    this.setMorphInfo(shaderProgram, args.entity.getMesh(), args.primitive, blendShapeComponent);
  }

  /**
   * Converts Unity blend mode enum values to corresponding WebGL blend constants.
   * This method maps Unity's blend mode enumeration to the appropriate
   * WebGL blend function constants for proper alpha blending.
   *
   * @param enumNumber - Unity blend mode enum value
   * @returns Corresponding WebGL blend constant
   */
  static unityBlendEnumCorrespondence(enumNumber: number) {
    let result = GL_ZERO as number; // gl.ZERO
    switch (enumNumber) {
      case 0:
        result = GL_ZERO;
        break;
      case 1:
        result = GL_ONE;
        break;
      case 2:
        result = GL_DST_COLOR;
        break;
      case 3:
        result = GL_SRC_COLOR;
        break;
      case 4:
        result = GL_ONE_MINUS_DST_COLOR;
        break;
      case 5:
        result = GL_SRC_ALPHA;
        break;
      case 6:
        result = GL_ONE_MINUS_SRC_COLOR;
        break;
      case 7:
        result = GL_DST_ALPHA;
        break;
      case 8:
        result = GL_ONE_MINUS_DST_ALPHA;
        break;
      case 9:
        result = GL_SRC_ALPHA_SATURATE;
        break;
      case 10:
        result = GL_ONE_MINUS_SRC_ALPHA;
        break;
    }
    return result;
  }

  /**
   * Sets up HDRI (High Dynamic Range Imaging) parameters for IBL.
   * This method extracts and prepares HDRI-related parameters from the
   * rendering arguments for use in image-based lighting calculations.
   *
   * @param args - WebGL or WebGPU rendering arguments
   * @returns Object containing HDRI parameters
   * @private
   */
  private static __setupHdriParameters(args: RenderingArgWebGL | RenderingArgWebGpu) {
    let mipmapLevelNumber = 1;
    if (args.specularCube) {
      mipmapLevelNumber = args.specularCube.mipmapLevelNumber;
    }
    const meshRenderComponent = args.entity.getMeshRenderer();
    let diffuseHdriType = HdriFormat.LDR_SRGB.index;
    let specularHdriType = HdriFormat.LDR_SRGB.index;
    if (meshRenderComponent.diffuseCubeMap) {
      diffuseHdriType = meshRenderComponent.diffuseCubeMap!.hdriFormat.index;
    }
    if (meshRenderComponent.specularCubeMap) {
      specularHdriType = meshRenderComponent.specularCubeMap!.hdriFormat.index;
    }
    return {
      mipmapLevelNumber,
      meshRenderComponent,
      diffuseHdriType,
      specularHdriType,
    };
  }
}
