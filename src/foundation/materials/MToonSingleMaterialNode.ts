import AbstractMaterialNode from "./AbstractMaterialNode";
import { AlphaMode } from "../definitions/AlphaMode";
import BlendShapeComponent from "../components/BlendShapeComponent";
import CameraComponent from "../components/CameraComponent";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import ComponentRepository from "../core/ComponentRepository";
import { ComponentType } from "../definitions/ComponentType";
import { CompositionType } from "../definitions/CompositionType";
import Config from "../core/Config";
import Material from "./Material";
import MeshComponent from "../components/MeshComponent";
import MToonShader from "../../webgl/shaders/MToonShader";
import MutableVector3 from "../math/MutableVector3";
import Scalar from "../math/Scalar";
import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsClass } from "../definitions/ShaderSemantics";
import { ShaderType } from "../definitions/ShaderType";
import { ShaderVariableUpdateInterval } from "../definitions/ShaderVariableUpdateInterval";
import Vector3 from "../math/Vector3";
import Vector4 from "../math/Vector4";
import VectorN from "../math/VectorN";

export default class MToonSingleMaterialNode extends AbstractMaterialNode {
  static readonly _Cutoff = new ShaderSemanticsClass({ str: 'cutoff' });
  static readonly _Color = new ShaderSemanticsClass({ str: 'litColor' });
  static readonly _ShadeColor = new ShaderSemanticsClass({ str: 'shadeColor' });
  static readonly _MainTex = new ShaderSemanticsClass({ str: 'litColorTexture' });
  static readonly _ShadeTexture = new ShaderSemanticsClass({ str: 'shadeColorTexture' });
  static readonly _BumpScale = new ShaderSemanticsClass({ str: 'normalScale' });
  static readonly _BumpMap = new ShaderSemanticsClass({ str: 'normalTexture' });
  static readonly _ReceiveShadowRate = new ShaderSemanticsClass({ str: 'receiveShadowRate' });
  static readonly _ReceiveShadowTexture = new ShaderSemanticsClass({ str: 'receiveShadowTexture' });
  static readonly _ShadingGradeRate = new ShaderSemanticsClass({ str: 'shadingGradeRate' });
  static readonly _ShadingGradeTexture = new ShaderSemanticsClass({ str: 'shadingGradeTexture' });
  static readonly _ShadeShift = new ShaderSemanticsClass({ str: 'shadeShift' });
  static readonly _ShadeToony = new ShaderSemanticsClass({ str: 'shadeToony' });
  static readonly _LightColorAttenuation = new ShaderSemanticsClass({ str: 'lightColorAttenuation' });
  static readonly _AmbientColor = new ShaderSemanticsClass({ str: 'ambientColor' });
  // static readonly _IndirectLightIntensity = new ShaderSemanticsClass({ str: 'indirectLightIntensity' });
  static readonly _RimTexture = new ShaderSemanticsClass({ str: 'rimTexture' });
  static readonly _RimColor = new ShaderSemanticsClass({ str: 'rimColor' });
  static readonly _RimLightingMix = new ShaderSemanticsClass({ str: 'rimLightingMix' });
  static readonly _RimFresnelPower = new ShaderSemanticsClass({ str: 'rimFresnelPower' });
  static readonly _RimLift = new ShaderSemanticsClass({ str: 'rimLift' });
  static readonly _SphereAdd = new ShaderSemanticsClass({ str: 'matCapTexture' });
  static readonly _EmissionColor = new ShaderSemanticsClass({ str: 'emissionColor' });
  static readonly _EmissionMap = new ShaderSemanticsClass({ str: 'emissionTexture' });
  static readonly _OutlineWidthTexture = new ShaderSemanticsClass({ str: 'outlineWidthTexture' });
  static readonly _OutlineWidth = new ShaderSemanticsClass({ str: 'outlineWidth' });
  static readonly _OutlineScaledMaxDistance = new ShaderSemanticsClass({ str: 'outlineScaledMaxDistance' });
  static readonly _OutlineColor = new ShaderSemanticsClass({ str: 'outlineColor' });
  static readonly _OutlineLightingMix = new ShaderSemanticsClass({ str: 'outlineLightingMix' });

  static readonly Aspect = new ShaderSemanticsClass({ str: 'aspect' });
  static readonly CameraUp = new ShaderSemanticsClass({ str: 'cameraUp' });

  static blendEquationModeAlpha: number | null = null;
  private __OutlineWidthModeIsScreen = false;

  private __floatPropertiesArray: any[] = [];
  private __vectorPropertiesArray: any[] = [];
  private __texturePropertiesArray: any[] = [];

  constructor(isOutline: boolean, materialPropertiesArray: any, textures: any, isMorphing: boolean, isSkinning: boolean, isLighting: boolean) {
    super(MToonShader.getInstance(), 'MToonShading'
      + (isMorphing ? '+morphing' : '')
      + (isSkinning ? '+skinning' : '')
      + (isLighting ? '' : '-lighting'),
      { isMorphing: isMorphing, isSkinning: isSkinning, isLighting: isLighting }
    );

    let shaderSemanticsInfoArray: ShaderSemanticsInfo[] = [];

    if (materialPropertiesArray != null) {
      this.__floatPropertiesArray = materialPropertiesArray[0];
      this.__vectorPropertiesArray = materialPropertiesArray[1];
      this.__texturePropertiesArray = materialPropertiesArray[2];
    } else {
      this.__floatPropertiesArray[0] = 0.0;  // _BlendMode
      this.__floatPropertiesArray[1] = 1.0;  // _BumpScale
      this.__floatPropertiesArray[2] = 2.0;  // _CullMode
      this.__floatPropertiesArray[3] = 0.5;  // _Cutoff
      this.__floatPropertiesArray[4] = 0.0;  // _DebugMode
      this.__floatPropertiesArray[5] = 0.0;  // _DstBlend
      this.__floatPropertiesArray[6] = 0.1;  // _IndirectLightIntensity
      this.__floatPropertiesArray[7] = 0.0;  // _LightColorAttenuation
      this.__floatPropertiesArray[8] = 0.0;  // _OutlineColorMode
      this.__floatPropertiesArray[9] = 1.0;  // _OutlineCullMode
      this.__floatPropertiesArray[10] = 1.0; // _OutlineLightingMix
      this.__floatPropertiesArray[11] = 1.0; // _OutlineScaledMaxDistance
      this.__floatPropertiesArray[12] = 0.5; // _OutlineWidth
      this.__floatPropertiesArray[13] = 0.0; // _OutlineWidthMode
      this.__floatPropertiesArray[14] = 1.0; // _ReceiveShadowRate
      this.__floatPropertiesArray[15] = 1.0; // _RimFresnelPower
      this.__floatPropertiesArray[16] = 0.0; // _RimLift
      this.__floatPropertiesArray[17] = 0.0; // _RimLightingMix
      this.__floatPropertiesArray[18] = 0.0; // _ShadeShift
      this.__floatPropertiesArray[19] = 0.9; // _ShadeToony
      this.__floatPropertiesArray[20] = 1.0; // _ShadingGradeRate
      this.__floatPropertiesArray[21] = 1.0; // _SrcBlend
      this.__floatPropertiesArray[22] = 1.0; // _ZWrite
      // this.floatPropertiesArray[23] = 0.0; // _UvAnimScrollX
      // this.floatPropertiesArray[24] = 0.0; // _UvAnimScrollY
      // this.floatPropertiesArray[25] = 0.0; // _UvAnimRotation

      this.__vectorPropertiesArray[0] = [1, 1, 1, 1]          // _Color
      this.__vectorPropertiesArray[1] = [0, 0, 0]             // _EmissionColor
      this.__vectorPropertiesArray[2] = [0, 0, 0, 1]          // _OutlineColor
      this.__vectorPropertiesArray[3] = [0.97, 0.81, 0.86, 1] // _ShadeColor
      this.__vectorPropertiesArray[4] = [0, 0, 0]             // _RimColor
      // this.vectorPropertiesArray[5] = [0, 0, 1, 1]          // _BumpMap
      // this.vectorPropertiesArray[6] = [0, 0, 1, 1]          // _EmissionMap
      // this.vectorPropertiesArray[7] = [0, 0, 1, 1]          // _MainTex
      // this.vectorPropertiesArray[8] = [0, 0, 1, 1]          // _OutlineWidthTexture
      // this.vectorPropertiesArray[9] = [0, 0, 1, 1]          // _ReceiveShadowTexture
      // this.vectorPropertiesArray[10] = [0, 0, 1, 1]         // _ShadeTexture
      // this.vectorPropertiesArray[11] = [0, 0, 1, 1]         // _ShadingGradeTexture
      // this.vectorPropertiesArray[12] = [0, 0, 1, 1]         // _SphereAdd

      this.__texturePropertiesArray[0] = 0 // _BumpMap
      this.__texturePropertiesArray[1] = 1 // _EmissionMap
      this.__texturePropertiesArray[2] = 0 // _MainTex
      this.__texturePropertiesArray[3] = 0 // _OutlineWidthTexture
      this.__texturePropertiesArray[4] = 0 // _ReceiveShadowTexture
      this.__texturePropertiesArray[5] = 1 // _RimTexture
      this.__texturePropertiesArray[6] = 0 // _ShadeTexture
      this.__texturePropertiesArray[7] = 0 // _ShadingGradeTexture
      this.__texturePropertiesArray[8] = 1 // _SphereAdd
      // this.texturePropertiesArray[9] = 0 // _UvAnimMaskTexture

      textures = [
        AbstractMaterialNode.__dummyWhiteTexture,
        AbstractMaterialNode.__dummyBlackTexture
      ]
    }


    shaderSemanticsInfoArray.push(
      {
        semantic: MToonSingleMaterialNode._Cutoff, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(this.__floatPropertiesArray[3]), min: 0, max: 1
      },
      {
        semantic: MToonSingleMaterialNode._Color, componentType: ComponentType.Float, compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Vector4(this.__vectorPropertiesArray[0]), min: 0, max: 1,
      },
      {
        semantic: MToonSingleMaterialNode._ShadeColor, componentType: ComponentType.Float, compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Vector3(this.__vectorPropertiesArray[3]), min: 0, max: 1,
      },
      {
        semantic: MToonSingleMaterialNode._MainTex, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [0, textures[materialPropertiesArray[2][2]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: MToonSingleMaterialNode._ShadeTexture, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [1, textures[materialPropertiesArray[2][6]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: MToonSingleMaterialNode._BumpScale, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(this.__floatPropertiesArray[1]), min: 0, max: 1
      },
      {
        semantic: MToonSingleMaterialNode._BumpMap, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [2, textures[materialPropertiesArray[2][0]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: MToonSingleMaterialNode._ReceiveShadowRate, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(this.__floatPropertiesArray[14]), min: 0, max: 1
      },
      {
        semantic: MToonSingleMaterialNode._ReceiveShadowTexture, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [3, textures[materialPropertiesArray[2][4]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: MToonSingleMaterialNode._ShadingGradeRate, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(this.__floatPropertiesArray[20]), min: 0, max: 1
      },
      {
        semantic: MToonSingleMaterialNode._ShadingGradeTexture, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [4, textures[materialPropertiesArray[2][7]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: MToonSingleMaterialNode._ShadeShift, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(this.__floatPropertiesArray[18]), min: 0, max: 1
      },
      {
        semantic: MToonSingleMaterialNode._ShadeToony, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(this.__floatPropertiesArray[19]), min: 0, max: 1
      },
      {
        semantic: MToonSingleMaterialNode._LightColorAttenuation, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(this.__floatPropertiesArray[7]), min: 0, max: 1
      },
      {
        semantic: MToonSingleMaterialNode._AmbientColor, componentType: ComponentType.Float, compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Vector3(0.5785, 0.5785, 0.5785), min: 0, max: 1,
      },
      // {
      //   semantic: MToonSingleMaterialNode._IndirectLightIntensity, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
      //   stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
      //   initialValue: new Scalar(this.floatPropertiesArray[6]), min: 0, max: 1
      // },
      {
        semantic: MToonSingleMaterialNode._RimColor, componentType: ComponentType.Float, compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Vector3(this.__vectorPropertiesArray[4]), min: 0, max: 1,
      },
      {
        semantic: MToonSingleMaterialNode._RimTexture, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [5, textures[materialPropertiesArray[2][5]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: MToonSingleMaterialNode._RimLightingMix, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(this.__floatPropertiesArray[17]), min: 0, max: 1
      },
      {
        semantic: MToonSingleMaterialNode._RimFresnelPower, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(this.__floatPropertiesArray[15]), min: 0, max: 1
      },
      {
        semantic: MToonSingleMaterialNode._RimLift, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Scalar(this.__floatPropertiesArray[16]), min: 0, max: 1
      },
      {
        semantic: MToonSingleMaterialNode.CameraUp, componentType: ComponentType.Float, compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader, isSystem: true, soloDatum: true,
        initialValue: new Vector3(0, 1, 0), min: 0, max: 1,
      },
      {
        semantic: MToonSingleMaterialNode._SphereAdd, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [6, textures[materialPropertiesArray[2][8]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      {
        semantic: MToonSingleMaterialNode._EmissionColor, componentType: ComponentType.Float, compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Vector3(this.__vectorPropertiesArray[1]), min: 0, max: 1,
      },
      {
        semantic: MToonSingleMaterialNode._EmissionMap, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
        initialValue: [8, textures[materialPropertiesArray[2][1]]], min: 0, max: Number.MAX_SAFE_INTEGER,
      },
      // {
      //   semantic: MToonSingleMaterialNode._UvAnimMaskTexture, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
      //   stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
      //   initialValue: [9, texturePropertiesArray[9]], min: 0, max: Number.MAX_SAFE_INTEGER,
      // },
      // {
      //   semantic: MToonSingleMaterialNode._UvAnimScrollX, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
      //   stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
      //   initialValue: new Scalar(this.floatPropertiesArray[23]), min: 0, max: 1
      // },
      // {
      //   semantic: MToonSingleMaterialNode._UvAnimScrollY, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
      //   stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
      //   initialValue:  new Scalar(this.floatPropertiesArray[24]), min: 0, max: 1
      // },
      // {
      //   semantic: MToonSingleMaterialNode._UvAnimRotation, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
      //   stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
      //   initialValue: new Scalar(this.floatPropertiesArray[25]), min: 0, max: 1
      // },

      {
        semantic: ShaderSemantics.Wireframe, componentType: ComponentType.Float, compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
        initialValue: new Vector3(0, 0, 1), min: 0, max: 10,
      },

    );

    // _DebugMode
    switch (this.__floatPropertiesArray[4]) {
      case 1: this.__definitions += '#define RN_MTOON_DEBUG_NORMAL\n'; break;
      case 2: this.__definitions += '#define RN_MTOON_DEBUG_LITSHADERATE\n'; break;
    }

    if (materialPropertiesArray[2][0] !== textures.length - 2) {
      this.__definitions += '#define RN_MTOON_HAS_NORMALMAP\n';
    }

    if (isOutline) {
      this.__definitions += '#define RN_MTOON_IS_OUTLINE\n';

      // _OutlineWidthMode
      switch (this.__floatPropertiesArray[13]) {
        case 0: this.__definitions += '#define RN_MTOON_OUTLINE_NONE\n'; break;
        case 1: this.__definitions += '#define RN_MTOON_OUTLINE_WIDTH_WORLD\n'; break;
        case 2:
          this.__definitions += '#define RN_MTOON_OUTLINE_WIDTH_SCREEN\n';
          this.__OutlineWidthModeIsScreen = true;
          break;
      }

      // _OutlineColorMode
      switch (this.__floatPropertiesArray[8]) {
        case 0: this.__definitions += '#define RN_MTOON_OUTLINE_COLOR_FIXED\n'; break;
        case 1: this.__definitions += '#define RN_MTOON_OUTLINE_COLOR_MIXED\n'; break;
      }

      shaderSemanticsInfoArray.push(
        {
          semantic: MToonSingleMaterialNode._OutlineWidthTexture, componentType: ComponentType.Int, compositionType: CompositionType.Texture2D,
          stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime,
          initialValue: [9, textures[materialPropertiesArray[2][3]]], min: 0, max: Number.MAX_SAFE_INTEGER,
        },
        {
          semantic: MToonSingleMaterialNode._OutlineWidth, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
          initialValue: new Scalar(this.__floatPropertiesArray[12]), min: 0, max: 1
        },
        {
          semantic: MToonSingleMaterialNode._OutlineScaledMaxDistance, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
          initialValue: new Scalar(this.__floatPropertiesArray[11]), min: 0, max: 1
        },
        {
          semantic: MToonSingleMaterialNode._OutlineColor, componentType: ComponentType.Float, compositionType: CompositionType.Vec3,
          stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
          initialValue: new Vector3(this.__vectorPropertiesArray[2]), min: 0, max: 1,
        },
        {
          semantic: MToonSingleMaterialNode._OutlineLightingMix, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
          stage: ShaderType.PixelShader, isSystem: false, updateInteval: ShaderVariableUpdateInterval.EveryTime, soloDatum: false,
          initialValue: new Scalar(this.__floatPropertiesArray[10]), min: 0, max: 1
        },
        {
          semantic: MToonSingleMaterialNode.Aspect, componentType: ComponentType.Float, compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader, isSystem: true, soloDatum: true,
          initialValue: new Scalar(1.0), min: 0, max: 1,
        },
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
          semantic: ShaderSemantics.MorphTargetNumber, componentType: ComponentType.Int, compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader, isSystem: true, soloDatum: true,
          initialValue: new Scalar(0), min: 0, max: Config.maxVertexMorphNumberInShader, needUniformInFastest: true
        },
        {
          semantic: ShaderSemantics.DataTextureMorphOffsetPosition, componentType: ComponentType.Float, compositionType: CompositionType.ScalarArray, maxIndex: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader, isSystem: true, soloDatum: true,
          initialValue: new VectorN(new Float32Array(Config.maxVertexMorphNumberInShader)), min: -Number.MAX_VALUE, max: Number.MAX_VALUE, needUniformInFastest: true
        },
        {
          semantic: ShaderSemantics.MorphWeights, componentType: ComponentType.Float, compositionType: CompositionType.ScalarArray, maxIndex: Config.maxVertexMorphNumberInShader,
          stage: ShaderType.VertexShader, isSystem: true, soloDatum: true,
          initialValue: new VectorN(new Float32Array(Config.maxVertexMorphNumberInShader)), min: -Number.MAX_VALUE, max: Number.MAX_VALUE, needUniformInFastest: true
        }
      );
    }

    this.setShaderSemanticsInfoArray(shaderSemanticsInfoArray);
  }

  setMaterialParameters(material: Material, isOutline: boolean) {

    if (MToonSingleMaterialNode.blendEquationModeAlpha === undefined) {
      MToonSingleMaterialNode.__initializeBlendEquationModeAlpha();
    }

    // _BlendMode
    if (this.__floatPropertiesArray[0] !== 0) {
      switch (this.__floatPropertiesArray[0]) {
        case 1: this.__definitions += '#define RN_ALPHATEST_ON\n'; material.alphaMode = AlphaMode.Mask; break;
        case 2: this.__definitions += '#define RN_ALPHABLEND_ON\n'; material.alphaMode = AlphaMode.Blend; break;
        case 3: this.__definitions += '#define RN_ALPHABLEND_ON\n'; material.alphaMode = AlphaMode.Blend; break;
      }

      const blendEquationMode = 32774; // gl.FUNC_ADD
      const blendEquationModeAlpha = MToonSingleMaterialNode.blendEquationModeAlpha;
      const blendFuncSrcFactor = MToonSingleMaterialNode.unityBlendEnumCorrespondence(this.__floatPropertiesArray[21]);
      const blendFuncDstFactor = MToonSingleMaterialNode.unityBlendEnumCorrespondence(this.__floatPropertiesArray[5]);

      material.setBlendEquationMode(blendEquationMode, blendEquationModeAlpha);
      material.setBlendFuncFactor(blendFuncSrcFactor, blendFuncDstFactor);
    }

    if (isOutline) {
      // _OutlineCullMode
      switch (this.__floatPropertiesArray[9]) {
        case 0: material.cullface = false; break;
        case 1: material.cullface = true; material.cullFrontFaceCCW = false; break;
        case 2: material.cullface = true; material.cullFrontFaceCCW = true; break;
      }
    } else {
      // _CullMode
      switch (this.__floatPropertiesArray[2]) {
        case 0: material.cullface = false; break;
        case 1: material.cullface = true; material.cullFrontFaceCCW = false; break;
        case 2: material.cullface = true; material.cullFrontFaceCCW = true; break;
      }
    }
    this.__floatPropertiesArray = [];
    this.__vectorPropertiesArray = [];
    this.__texturePropertiesArray = [];
  }

  private static __initializeBlendEquationModeAlpha() {
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const glw = webGLResourceRepository.currentWebGLContextWrapper;
    const gl = glw!.getRawContext();
    if (glw!.isWebGL2) {
      MToonSingleMaterialNode.blendEquationModeAlpha = gl.MAX;
    } else if (glw!.webgl1ExtBM) {
      MToonSingleMaterialNode.blendEquationModeAlpha = glw!.webgl1ExtBM.MAX_EXT;
    } else {
      MToonSingleMaterialNode.blendEquationModeAlpha = gl.FUNC_ADD;
    }
  }

  setParametersForGPU({ material, shaderProgram, firstTime, args }: { material: Material, shaderProgram: WebGLProgram, firstTime: boolean, args?: any }) {

    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
    }

    if (args.setUniform) {
      /// Matrices
      this.setWorldMatrix(shaderProgram, args.worldMatrix);
      this.setNormalMatrix(shaderProgram, args.normalMatrix);
      this.setViewInfo(shaderProgram, cameraComponent, material, args.setUniform);
      this.setProjection(shaderProgram, cameraComponent, material, args.setUniform);

      /// Skinning
      const skeletalComponent = args.entity.getSkeletal();
      this.setSkinning(shaderProgram, skeletalComponent, args.setUniform);

      // Lights
      this.setLightsInfo(shaderProgram, args.lightComponents, material, args.setUniform);

      (shaderProgram as any)._gl.uniform3fv((shaderProgram as any).cameraUp, cameraComponent.upInner.v);

      if (this.__OutlineWidthModeIsScreen) {
        (shaderProgram as any)._gl.uniform1f((shaderProgram as any).aspect, cameraComponent.aspect);
      }

    } else {
      material.setParameter(MToonSingleMaterialNode.CameraUp, cameraComponent.upInner);

      if (this.__OutlineWidthModeIsScreen) {
        material.setParameter(MToonSingleMaterialNode.Aspect, cameraComponent.aspect);
      }
    }

    // Morph
    this.setMorphInfo(shaderProgram, args.entity.getComponent(MeshComponent), args.entity.getComponent(BlendShapeComponent), args.primitive);
  }

  static unityBlendEnumCorrespondence(enumNumber: number) {
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const glw = webGLResourceRepository.currentWebGLContextWrapper;
    const gl = glw!.getRawContext();

    let result;
    switch (enumNumber) {
      case 0: result = gl.ZERO; break;
      case 1: result = gl.ONE; break;
      case 2: result = gl.DST_COLOR; break;
      case 3: result = gl.SRC_COLOR; break;
      case 4: result = gl.ONE_MINUS_DST_COLOR; break;
      case 5: result = gl.SRC_ALPHA; break;
      case 6: result = gl.ONE_MINUS_SRC_COLOR; break;
      case 7: result = gl.DST_ALPHA; break;
      case 8: result = gl.ONE_MINUS_DST_ALPHA; break;
      case 9: result = gl.SRC_ALPHA_SATURATE; break;
      case 10: result = gl.ONE_MINUS_SRC_ALPHA; break;
    }
    return result;
  }

}
