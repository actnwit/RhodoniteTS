import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { AlphaMode } from '../../definitions/AlphaMode';
import { CameraComponent } from '../../components/Camera/CameraComponent';
import { CGAPIResourceRepository } from '../../renderer/CGAPIResourceRepository';
import { ComponentRepository } from '../../core/ComponentRepository';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { Config } from '../../core/Config';
import { Material } from '../core/Material';
import { Scalar } from '../../math/Scalar';
import { ShaderSemantics, ShaderSemanticsClass } from '../../definitions/ShaderSemantics';
import { ShaderType } from '../../definitions/ShaderType';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { VectorN } from '../../math/VectorN';
import { Array3, Array4, Count } from '../../../types/CommonTypes';
import { Texture } from '../../textures/Texture';
import mToonSingleShaderVertex from '../../../webgl/shaderity_shaders/MToonSingleShader/MToonSingleShader.vert';
import mToonSingleShaderFragment from '../../../webgl/shaderity_shaders/MToonSingleShader/MToonSingleShader.frag';
import mToonSingleShaderVertexWebGpu from '../../../webgpu/shaderity_shaders/MToonSingleShader/MToonSingleShader.vert';
import mToonSingleShaderFragmentWebGpu from '../../../webgpu/shaderity_shaders/MToonSingleShader/MToonSingleShader.frag';
import { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
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
  Vrm0xMaterialProperty,
} from '../../../types';
import { Sampler } from '../../textures/Sampler';
import { Blend } from '../../definitions/Blend';
import { dummyBlackTexture, dummyWhiteTexture } from '../core/DummyTextures';
import { SystemState } from '../../system/SystemState';
import { ProcessApproach, ProcessApproachClass } from '../../definitions';
import { WellKnownComponentTIDs } from '../../components/WellKnownComponentTIDs';

export class MToonMaterialContent extends AbstractMaterialContent {
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
  // static readonly _IndirectLightIntensity = new ShaderSemanticsClass({ str: 'indirectLightIntensity' });
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

  constructor(
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
    materialName: string
  ) {
    super(null, materialName, {
      isMorphing: isMorphing,
      isSkinning: isSkinning,
      isLighting: isLighting,
    });

    const shaderSemanticsInfoArray: ShaderSemanticsInfo[] = this.doShaderReflection(
      mToonSingleShaderVertex,
      mToonSingleShaderFragment,
      mToonSingleShaderVertexWebGpu,
      mToonSingleShaderFragmentWebGpu
    );

    if (materialProperties != null) {
      this.__floatProperties = materialProperties.floatProperties;
      this.__vectorProperties = materialProperties.vectorProperties;
      this.__textureProperties = materialProperties.textureProperties;
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
      // this.__floatProperties._UvAnimScrollX = 0.0;
      // this.__floatProperties._UvAnimScrollY = 0.0;
      // this.__floatProperties._UvAnimRotation = 0.0;

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

      this.__textureProperties._BumpMap = 0;
      this.__textureProperties._EmissionMap = 1;
      this.__textureProperties._MainTex = 0;
      this.__textureProperties._OutlineWidthTexture = 0;
      this.__textureProperties._ReceiveShadowTexture = 0;
      this.__textureProperties._RimTexture = 1;
      this.__textureProperties._ShadeTexture = 0;
      this.__textureProperties._ShadingGradeTexture = 0;
      this.__textureProperties._SphereAdd = 1;
      // this.__textureProperties._UvAnimMaskTexture = 0;

      textures = [dummyWhiteTexture, dummyBlackTexture];
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
        semantic: 'color',
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
        semantic: 'ambientColor',
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader,
        initialValue: Vector3.fromCopyArray([0.5785, 0.5785, 0.5785]),
        min: 0,
        max: 1,
      },
      // {
      //   semantic: MToonMaterialContent._IndirectLightIntensity, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
      //   stage: ShaderType.PixelShader, isInternalSetting: false, updateInterval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
      //   initialValue: Scalar.fromCopyNumber(this.floatPropertiesArray._IndirectLightIntensity), min: 0, max: 1
      // },
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
        initialValue: Vector3.fromCopyArray(
          this.__vectorProperties._EmissionColor as Array3<number>
        ),
        min: 0,
        max: 1,
      },
      // {
      //   semantic: MToonMaterialContent._UvAnimScrollX, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
      //   stage: ShaderType.PixelShader, isInternalSetting: false, updateInterval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
      //   initialValue: Scalar.fromCopyNumber(this.floatPropertiesArray._UvAnimScrollX), min: 0, max: 1
      // },
      // {
      //   semantic: MToonMaterialContent._UvAnimScrollY, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
      //   stage: ShaderType.PixelShader, isInternalSetting: false, updateInterval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
      //   initialValue:  Scalar.fromCopyNumber(this.floatPropertiesArray._UvAnimScrollY), min: 0, max: 1
      // },
      // {
      //   semantic: MToonMaterialContent._UvAnimRotation, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
      //   stage: ShaderType.PixelShader, isInternalSetting: false, updateInterval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
      //   initialValue: Scalar.fromCopyNumber(this.floatPropertiesArray._UvAnimRotation), min: 0, max: 1
      // },

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
          initialValue: Vector3.fromCopyArray(
            this.__vectorProperties._OutlineColor as Array3<number>
          ),
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

      shaderSemanticsInfoArray.push(
        {
          semantic: 'dataTextureMorphOffsetPosition',
          componentType: ComponentType.Int,
          compositionType: CompositionType.ScalarArray,
          arrayLength: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader,
          isInternalSetting: true,
          initialValue: new VectorN(new Int32Array(Config.maxVertexMorphNumberInShader)),
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
          needUniformInDataTextureMode: true,
        },
        {
          semantic: 'morphWeights',
          componentType: ComponentType.Float,
          compositionType: CompositionType.ScalarArray,
          arrayLength: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader,
          isInternalSetting: true,
          initialValue: new VectorN(new Float32Array(Config.maxVertexMorphNumberInShader)),
          min: -Number.MAX_VALUE,
          max: Number.MAX_VALUE,
          needUniformInDataTextureMode: true,
        }
      );
    }

    if (useTangentAttribute) {
      this.__definitions += '#define RN_USE_TANGENT_ATTRIBUTE\n';
    }

    // Texture
    this.__setTextures(textures, samplers, shaderSemanticsInfoArray, isOutline);

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  private __setTextures(
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
        initialValue: [
          0,
          textures[this.__textureProperties._MainTex],
          samplers[this.__textureProperties._MainTex],
        ],
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
        initialValue: [
          5,
          textures[this.__textureProperties._SphereAdd],
          samplers[this.__textureProperties._SphereAdd],
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: 'emissionTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [
          6,
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
        initialValue: [
          8,
          textures[this.__textureProperties._BumpMap],
          samplers[this.__textureProperties._BumpMap],
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      }
      // {
      //   semantic: MToonMaterialContent._UvAnimMaskTexture, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
      //   stage: ShaderType.PixelShader, isInternalSetting: false, updateInterval: ShaderVariableUpdateInterval.EveryTime,
      //   initialValue: [10, texturePropertiesArray._UvAnimMaskTexture], min: 0, max: Number.MAX_SAFE_INTEGER,
      // }
    );

    if (this.__textureProperties._BumpMap !== textures.length - 2) {
      //textures.length - 2 is dummyTexture
      this.__definitions += '#define RN_MTOON_HAS_BUMPMAP\n';
    }

    if (isOutline) {
      shaderSemanticsInfoArray.push({
        semantic: 'outlineWidthTexture',
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.VertexShader,
        initialValue: [
          9,
          textures[this.__textureProperties._OutlineWidthTexture],
          samplers[this.__textureProperties._OutlineWidthTexture],
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
      });

      if (this.__textureProperties._OutlineWidthTexture !== textures.length - 2) {
        //textures.length - 2 is dummyTexture
        this.__definitions += '#define RN_MTOON_HAS_OUTLINE_WIDTH_TEXTURE\n';
      }
    }
  }

  setMaterialParameters(material: Material, isOutline: boolean) {
    if (MToonMaterialContent.usableBlendEquationModeAlpha == null) {
      MToonMaterialContent.__initializeUsableBlendEquationModeAlpha();
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
      const blendEquationModeAlpha = MToonMaterialContent.usableBlendEquationModeAlpha;
      const blendFuncSrcFactor = MToonMaterialContent.unityBlendEnumCorrespondence(
        this.__floatProperties._SrcBlend
      );
      const blendFuncDstFactor = MToonMaterialContent.unityBlendEnumCorrespondence(
        this.__floatProperties._DstBlend
      );

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
          material.cullFrontFaceCCW = false;
          break;
        case 2:
          material.cullFace = true;
          material.cullFrontFaceCCW = true;
          break;
      }
    } else {
      switch (this.__floatProperties._CullMode) {
        case 0:
          material.cullFace = false;
          break;
        case 1:
          material.cullFace = true;
          material.cullFrontFaceCCW = false;
          break;
        case 2:
          material.cullFace = true;
          material.cullFrontFaceCCW = true;
          break;
      }
    }
  }

  private static __initializeUsableBlendEquationModeAlpha() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      MToonMaterialContent.usableBlendEquationModeAlpha = 32776; // gl.MAX
    } else {
      const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      const glw = webGLResourceRepository.currentWebGLContextWrapper;
      const gl = glw!.getRawContextAsWebGL2();
      if (glw!.isWebGL2) {
        MToonMaterialContent.usableBlendEquationModeAlpha = gl.MAX;
      } else if (glw!.webgl1ExtBM) {
        MToonMaterialContent.usableBlendEquationModeAlpha = glw!.webgl1ExtBM.MAX_EXT;
      } else {
        MToonMaterialContent.usableBlendEquationModeAlpha = gl.FUNC_ADD;
      }
    }
  }
  _setInternalSettingParametersToGpuWebGpu({
    material,
    args,
  }: {
    material: Material;
    args: RenderingArgWebGpu;
  }) {
    let cameraComponent = ComponentRepository.getComponentFromComponentTID(
      WellKnownComponentTIDs.CameraComponentTID,
      args.cameraComponentSid
    ) as CameraComponent;
    material.setParameter('cameraUp', cameraComponent.upInner);

    if (this.__OutlineWidthModeIsScreen) {
      material.setParameter('aspect', cameraComponent.aspect);
    }
  }

  _setInternalSettingParametersToGpuWebGL({
    material,
    shaderProgram,
    firstTime,
    args,
  }: {
    material: Material;
    shaderProgram: WebGLProgram;
    firstTime: boolean;
    args: RenderingArgWebGL;
  }) {
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getComponent(
        CameraComponent,
        CameraComponent.current
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

      (shaderProgram as any)._gl.uniform3fv(
        (shaderProgram as any).cameraUp,
        cameraComponent.upInner._v
      );

      if (this.__OutlineWidthModeIsScreen) {
        (shaderProgram as any)._gl.uniform1f((shaderProgram as any).aspect, cameraComponent.aspect);
      }
    } else {
      material.setParameter('cameraUp', cameraComponent.upInner);

      if (this.__OutlineWidthModeIsScreen) {
        material.setParameter('aspect', cameraComponent.aspect);
      }
    }

    // Morph
    const blendShapeComponent = args.entity.tryToGetBlendShape();
    this.setMorphInfo(shaderProgram, args.entity.getMesh(), args.primitive, blendShapeComponent);
  }

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
}
