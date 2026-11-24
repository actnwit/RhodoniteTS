// src/foundation/materials/contents/MToon0xMaterialContent.ts
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
  GL_ZERO
} from "../../../types/index.js";
import mToonSingleShaderFragment_ from "../../../webgl/shaderity_shaders/MToon0xSingleShader/MToon0xSingleShader.frag.glsl.js";
import mToonSingleShaderVertex_ from "../../../webgl/shaderity_shaders/MToon0xSingleShader/MToon0xSingleShader.vert.glsl.js";
import mToonSingleShaderFragmentWebGpu_ from "../../../webgpu/shaderity_shaders/MToon0xSingleShader/MToon0xSingleShader.frag.wgsl.js";
import mToonSingleShaderVertexWebGpu_ from "../../../webgpu/shaderity_shaders/MToon0xSingleShader/MToon0xSingleShader.vert.wgsl.js";
import { CameraComponent } from "../../components/Camera/CameraComponent.js";
import { WellKnownComponentTIDs } from "../../components/WellKnownComponentTIDs.js";
import { HdriFormat, ProcessApproach, TextureParameter } from "../../definitions/index.js";
import { AlphaMode } from "../../definitions/AlphaMode.js";
import { Blend } from "../../definitions/Blend.js";
import { ComponentType } from "../../definitions/ComponentType.js";
import { CompositionType } from "../../definitions/CompositionType.js";
import { ShaderSemantics, ShaderSemanticsClass } from "../../definitions/ShaderSemantics.js";
import { ShaderType } from "../../definitions/ShaderType.js";
import { MutableVector2 } from "../../math/MutableVector2.js";
import { MutableVector4 } from "../../math/MutableVector4.js";
import { Scalar } from "../../math/Scalar.js";
import { Vector3 } from "../../math/Vector3.js";
import { Vector4 } from "../../math/Vector4.js";
import { Sampler } from "../../textures/Sampler.js";
import { AbstractMaterialContent } from "../core/AbstractMaterialContent.js";
var mToonSingleShaderFragment = typeof __RN_WEBGL__ === "undefined" || __RN_WEBGL__ ? mToonSingleShaderFragment_ : void 0;
var mToonSingleShaderVertex = typeof __RN_WEBGL__ === "undefined" || __RN_WEBGL__ ? mToonSingleShaderVertex_ : void 0;
var mToonSingleShaderFragmentWebGpu = typeof __RN_WEBGPU__ === "undefined" || __RN_WEBGPU__ ? mToonSingleShaderFragmentWebGpu_ : void 0;
var mToonSingleShaderVertexWebGpu = typeof __RN_WEBGPU__ === "undefined" || __RN_WEBGPU__ ? mToonSingleShaderVertexWebGpu_ : void 0;
var _MToon0xMaterialContent = class _MToon0xMaterialContent extends AbstractMaterialContent {
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
  constructor(engine, isOutline, materialProperties, textures, samplers, isMorphing, isSkinning, isLighting, useTangentAttribute, debugMode, makeOutputSrgb, materialName, definitions) {
    var _a, _b, _c;
    super(materialName, {
      isMorphing,
      isSkinning,
      isLighting
    });
    this.gr = false;
    this.cr = {};
    this.fr = {};
    this.dr = {};
    const shaderSemanticsInfoArray = this.doShaderReflection(
      engine,
      mToonSingleShaderVertex,
      mToonSingleShaderFragment,
      mToonSingleShaderVertexWebGpu,
      mToonSingleShaderFragmentWebGpu,
      definitions
    );
    this.Vq = new Sampler(engine, {
      minFilter: TextureParameter.Linear,
      magFilter: TextureParameter.Linear,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
      wrapR: TextureParameter.ClampToEdge
    });
    this.Uq = new Sampler(engine, {
      minFilter: TextureParameter.LinearMipmapLinear,
      magFilter: TextureParameter.Linear,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
      wrapR: TextureParameter.ClampToEdge
    });
    if (!this.Vq.created) {
      this.Vq.create();
    }
    if (!this.Uq.created) {
      this.Uq.create();
    }
    if (materialProperties != null) {
      this.cr = materialProperties.floatProperties;
      this.fr = materialProperties.vectorProperties;
      this.dr = JSON.parse(JSON.stringify(materialProperties.textureProperties));
    } else {
      this.cr._BlendMode = 0;
      this.cr._BumpScale = 1;
      this.cr._CullMode = 2;
      this.cr._Cutoff = 0.5;
      this.cr._DebugMode = 0;
      this.cr._DstBlend = 0;
      this.cr._IndirectLightIntensity = 0.1;
      this.cr._LightColorAttenuation = 0;
      this.cr._OutlineColorMode = 0;
      this.cr._OutlineCullMode = 1;
      this.cr._OutlineLightingMix = 1;
      this.cr._OutlineScaledMaxDistance = 1;
      this.cr._OutlineWidth = 0.5;
      this.cr._OutlineWidthMode = 0;
      this.cr._ReceiveShadowRate = 1;
      this.cr._RimFresnelPower = 1;
      this.cr._RimLift = 0;
      this.cr._RimLightingMix = 0;
      this.cr._ShadeShift = 0;
      this.cr._ShadeToony = 0.9;
      this.cr._ShadingGradeRate = 1;
      this.cr._SrcBlend = 1;
      this.cr._ZWrite = 1;
      this.cr._UvAnimScrollX = 0;
      this.cr._UvAnimScrollY = 0;
      this.cr._UvAnimRotation = 0;
      this.fr._Color = [1, 1, 1, 1];
      this.fr._EmissionColor = [0, 0, 0];
      this.fr._OutlineColor = [0, 0, 0, 1];
      this.fr._ShadeColor = [0.97, 0.81, 0.86, 1];
      this.fr._RimColor = [0, 0, 0];
    }
    if (debugMode) {
      this.cr._DebugMode = debugMode;
    }
    shaderSemanticsInfoArray.push(
      {
        semantic: "cutoff",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.cr._Cutoff),
        min: 0,
        max: 1
      },
      {
        semantic: "litColor",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec4,
        stage: ShaderType.PixelShader,
        initialValue: Vector4.fromCopyArray(this.fr._Color),
        min: 0,
        max: 1
      },
      {
        semantic: "shadeColor",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader,
        initialValue: Vector3.fromCopyArray(this.fr._ShadeColor),
        min: 0,
        max: 1
      },
      {
        semantic: "bumpScale",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.cr._BumpScale),
        min: 0,
        max: 1
      },
      {
        semantic: "receiveShadowRate",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.cr._ReceiveShadowRate),
        min: 0,
        max: 1
      },
      {
        semantic: "shadingGradeRate",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.cr._ShadingGradeRate),
        min: 0,
        max: 1
      },
      {
        semantic: "shadeShift",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.cr._ShadeShift),
        min: 0,
        max: 1
      },
      {
        semantic: "shadeToony",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.cr._ShadeToony),
        min: 0,
        max: 1
      },
      {
        semantic: "lightColorAttenuation",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.cr._LightColorAttenuation),
        min: 0,
        max: 1
      },
      {
        semantic: "indirectLightIntensity",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.cr._IndirectLightIntensity),
        min: 0,
        max: 1
      },
      {
        semantic: "rimColor",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader,
        initialValue: Vector3.fromCopyArray(this.fr._RimColor),
        min: 0,
        max: 1
      },
      {
        semantic: "rimLightingMix",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.cr._RimLightingMix),
        min: 0,
        max: 1
      },
      {
        semantic: "rimFresnelPower",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.cr._RimFresnelPower),
        min: 0,
        max: 1
      },
      {
        semantic: "rimLift",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        initialValue: Scalar.fromCopyNumber(this.cr._RimLift),
        min: 0,
        max: 1
      },
      {
        semantic: "cameraUp",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader,
        soloDatum: true,
        initialValue: Vector3.fromCopyArray([0, 1, 0]),
        min: 0,
        max: 1
      },
      {
        semantic: "emissionColor",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader,
        initialValue: Vector3.fromCopyArray(this.fr._EmissionColor),
        min: 0,
        max: 1
      },
      {
        semantic: "uvAnimationScrollXSpeedFactor",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isInternalSetting: false,
        initialValue: Scalar.fromCopyNumber((_a = this.cr._UvAnimScrollX) != null ? _a : 0),
        min: 0,
        max: 1
      },
      {
        semantic: "uvAnimationScrollYSpeedFactor",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isInternalSetting: false,
        initialValue: Scalar.fromCopyNumber((_b = this.cr._UvAnimScrollY) != null ? _b : 0),
        min: 0,
        max: 1
      },
      {
        semantic: "uvAnimationRotationSpeedFactor",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Scalar,
        stage: ShaderType.PixelShader,
        isInternalSetting: false,
        initialValue: Scalar.fromCopyNumber((_c = this.cr._UvAnimRotation) != null ? _c : 0),
        min: 0,
        max: 1
      },
      {
        semantic: "wireframe",
        componentType: ComponentType.Float,
        compositionType: CompositionType.Vec3,
        stage: ShaderType.PixelShader,
        initialValue: Vector3.fromCopyArray([0, 0, 1]),
        min: 0,
        max: 10
      },
      {
        semantic: "makeOutputSrgb",
        compositionType: CompositionType.Scalar,
        componentType: ComponentType.Bool,
        stage: ShaderType.PixelShader,
        min: 0,
        max: 1,
        initialValue: Scalar.fromCopyNumber(makeOutputSrgb ? 1 : 0)
      }
    );
    switch (this.cr._DebugMode) {
      case 1:
        this.er += "#define RN_MTOON_DEBUG_NORMAL\n";
        break;
      case 2:
        this.er += "#define RN_MTOON_DEBUG_LITSHADERATE\n";
        break;
    }
    if (isOutline) {
      this.er += "#define RN_MTOON_IS_OUTLINE\n";
      switch (this.cr._OutlineWidthMode) {
        case 0:
          this.er += "#define RN_MTOON_OUTLINE_NONE\n";
          break;
        case 1:
          this.er += "#define RN_MTOON_OUTLINE_WIDTH_WORLD\n";
          break;
        case 2:
          this.er += "#define RN_MTOON_OUTLINE_WIDTH_SCREEN\n";
          this.gr = true;
          break;
      }
      switch (this.cr._OutlineColorMode) {
        case 0:
          this.er += "#define RN_MTOON_OUTLINE_COLOR_FIXED\n";
          break;
        case 1:
          this.er += "#define RN_MTOON_OUTLINE_COLOR_MIXED\n";
          break;
      }
      shaderSemanticsInfoArray.push(
        {
          semantic: "outlineWidth",
          componentType: ComponentType.Float,
          compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader,
          initialValue: Scalar.fromCopyNumber(this.cr._OutlineWidth),
          min: 0,
          max: 1
        },
        {
          semantic: "outlineScaledMaxDistance",
          componentType: ComponentType.Float,
          compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader,
          initialValue: Scalar.fromCopyNumber(this.cr._OutlineScaledMaxDistance),
          min: 0,
          max: 1
        },
        {
          semantic: "outlineColor",
          componentType: ComponentType.Float,
          compositionType: CompositionType.Vec3,
          stage: ShaderType.PixelShader,
          initialValue: Vector4.fromCopyArray(this.fr._OutlineColor),
          min: 0,
          max: 1
        },
        {
          semantic: "outlineLightingMix",
          componentType: ComponentType.Float,
          compositionType: CompositionType.Scalar,
          stage: ShaderType.PixelShader,
          initialValue: Scalar.fromCopyNumber(this.cr._OutlineLightingMix),
          min: 0,
          max: 1
        },
        {
          semantic: "aspect",
          componentType: ComponentType.Float,
          compositionType: CompositionType.Scalar,
          stage: ShaderType.VertexShader,
          isInternalSetting: true,
          soloDatum: true,
          initialValue: Scalar.fromCopyNumber(1),
          min: 0,
          max: 1
        }
      );
    }
    if (isLighting) {
      this.er += "#define RN_IS_LIGHTING\n";
    }
    if (isSkinning) {
      this.er += "#define RN_IS_SKINNING\n";
    }
    if (isMorphing) {
      this.er += "#define RN_IS_MORPHING\n";
    }
    if (useTangentAttribute) {
      this.er += "#define RN_USE_TANGENT_ATTRIBUTE\n";
    }
    if (this.dr._BumpMap >= 0) {
      this.er += "#define RN_MTOON_HAS_BUMPMAP\n";
    }
    if (this.dr._OutlineWidthTexture >= 0) {
      this.er += "#define RN_MTOON_HAS_OUTLINE_WIDTH_TEXTURE\n";
    }
    textures = [engine.dummyTextures.dummyWhiteTexture, engine.dummyTextures.dummyBlackTexture];
    this.dr._BumpMap = 0;
    this.dr._EmissionMap = 1;
    this.dr._MainTex = 0;
    this.dr._OutlineWidthTexture = 0;
    this.dr._UvAnimMaskTexture = 0;
    this.dr._ReceiveShadowTexture = 0;
    this.dr._RimTexture = 1;
    this.dr._ShadeTexture = 0;
    this.dr._ShadingGradeTexture = 0;
    this.dr._SphereAdd = 1;
    this.hr(textures, samplers, shaderSemanticsInfoArray, isOutline);
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
  hr(textures, samplers, shaderSemanticsInfoArray, isOutline) {
    shaderSemanticsInfoArray.push(
      {
        semantic: "litColorTexture",
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [1, textures[this.dr._MainTex], samplers[this.dr._MainTex]],
        min: 0,
        max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: "shadeColorTexture",
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [
          2,
          textures[this.dr._ShadeTexture],
          samplers[this.dr._ShadeTexture]
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: "receiveShadowTexture",
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [
          3,
          textures[this.dr._ReceiveShadowTexture],
          samplers[this.dr._ReceiveShadowTexture]
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: "shadingGradeTexture",
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [
          4,
          textures[this.dr._ShadingGradeTexture],
          samplers[this.dr._ShadingGradeTexture]
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: "rimTexture",
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [
          5,
          textures[this.dr._RimTexture],
          samplers[this.dr._RimTexture]
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: "matCapTexture",
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [9, textures[this.dr._SphereAdd], samplers[this.dr._SphereAdd]],
        min: 0,
        max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: "emissionTexture",
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [
          10,
          textures[this.dr._EmissionMap],
          samplers[this.dr._EmissionMap]
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER
      }
    );
    shaderSemanticsInfoArray.push(
      {
        // number 0 of texture is the data Texture
        semantic: "normalTexture",
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [11, textures[this.dr._BumpMap], samplers[this.dr._BumpMap]],
        min: 0,
        max: Number.MAX_SAFE_INTEGER
      },
      {
        semantic: "uvAnimationMaskTexture",
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.PixelShader,
        initialValue: [
          12,
          textures[this.dr._UvAnimMaskTexture],
          samplers[this.dr._UvAnimMaskTexture]
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER
      }
    );
    if (isOutline) {
      shaderSemanticsInfoArray.push({
        semantic: "outlineWidthTexture",
        componentType: ComponentType.Int,
        compositionType: CompositionType.Texture2D,
        stage: ShaderType.VertexShader,
        initialValue: [
          13,
          textures[this.dr._OutlineWidthTexture],
          samplers[this.dr._OutlineWidthTexture]
        ],
        min: 0,
        max: Number.MAX_SAFE_INTEGER
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
  setMaterialParameters(engine, material, isOutline) {
    if (this.cr._BlendMode !== 0) {
      switch (this.cr._BlendMode) {
        case 1:
          this.er += "#define RN_ALPHATEST_ON\n";
          material.alphaMode = AlphaMode.Mask;
          break;
        case 2:
          this.er += "#define RN_ALPHABLEND_ON\n";
          material.alphaMode = AlphaMode.Blend;
          break;
        case 3:
          this.er += "#define RN_ALPHABLEND_ON\n";
          material.alphaMode = AlphaMode.Blend;
          break;
      }
      const blendEquationMode = 32774;
      const blendEquationModeAlpha = _MToon0xMaterialContent.ir(engine);
      const blendFuncSrcFactor = _MToon0xMaterialContent.unityBlendEnumCorrespondence(this.cr._SrcBlend);
      const blendFuncDstFactor = _MToon0xMaterialContent.unityBlendEnumCorrespondence(this.cr._DstBlend);
      material.setBlendEquationMode(
        Blend.from(blendEquationMode),
        blendEquationModeAlpha != null ? Blend.from(blendEquationModeAlpha) : void 0
      );
      material.setBlendFuncFactor(Blend.from(blendFuncSrcFactor), Blend.from(blendFuncDstFactor));
    }
    if (isOutline) {
      switch (this.cr._OutlineCullMode) {
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
      switch (this.cr._CullMode) {
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
    material.zWriteWhenBlend = this.cr._ZWrite === 1;
  }
  /**
   * Gets the usable blend equation mode for alpha blending.
   * This method determines the appropriate blend equation mode based on
   * the current rendering API and available extensions.
   *
   * @param engine - The engine instance
   * @returns The blend equation mode for alpha channel
   * @private
   */
  static ir(engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return 32776;
    }
    const webGLResourceRepository = engine.webglResourceRepository;
    const glw = webGLResourceRepository.currentWebGLContextWrapper;
    const gl = glw.getRawContextAsWebGL2();
    if (glw.isWebGL2) {
      return gl.MAX;
    }
    if (glw.webgl1ExtBM) {
      return glw.webgl1ExtBM.MAX_EXT;
    }
    return gl.FUNC_ADD;
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
    args
  }) {
    let cameraComponent = engine.componentRepository.getComponentFromComponentTID(
      WellKnownComponentTIDs.CameraComponentTID,
      args.cameraComponentSid
    );
    material.setParameter("cameraUp", cameraComponent.upInner);
    if (this.gr) {
      material.setParameter("aspect", cameraComponent.aspect);
    }
    const {
      mipmapLevelNumber,
      meshRenderComponent,
      diffuseHdriType,
      specularHdriType,
      diffuseContribution,
      specularContribution
    } = _MToon0xMaterialContent.Yq(args);
    const tmp_vector4 = AbstractMaterialContent._q;
    tmp_vector4.x = mipmapLevelNumber;
    tmp_vector4.y = diffuseContribution;
    tmp_vector4.z = specularContribution;
    tmp_vector4.w = meshRenderComponent.rotationOfCubeMap;
    material.setParameter("iblParameter", tmp_vector4);
    const tmp_vector2 = AbstractMaterialContent.$q;
    tmp_vector2.x = diffuseHdriType;
    tmp_vector2.y = specularHdriType;
    material.setParameter("hdriFormat", tmp_vector2);
    const meshRendererComponent = args.entity.tryToGetMeshRenderer();
    if (meshRendererComponent != null && meshRendererComponent.diffuseCubeMap != null && meshRendererComponent.specularCubeMap != null) {
      const iblParameterVec4 = MutableVector4.zero();
      const hdriFormatVec2 = MutableVector2.zero();
      iblParameterVec4.x = meshRendererComponent.specularCubeMap.mipmapLevelNumber;
      iblParameterVec4.y = meshRendererComponent.diffuseCubeMapContribution;
      iblParameterVec4.z = meshRendererComponent.specularCubeMapContribution;
      iblParameterVec4.w = meshRendererComponent.rotationOfCubeMap;
      material.setParameter("iblParameter", iblParameterVec4);
      hdriFormatVec2.x = meshRendererComponent.diffuseCubeMap.hdriFormat.index;
      hdriFormatVec2.y = meshRendererComponent.specularCubeMap.hdriFormat.index;
      material.setParameter("hdriFormat", hdriFormatVec2);
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
    material,
    shaderProgram,
    args
  }) {
    var _a;
    const webglResourceRepository = engine.webglResourceRepository;
    const diffuseEnv = material.getTextureParameter(ShaderSemantics.DiffuseEnvTexture.str);
    if (diffuseEnv != null) {
      const diffuseEnvSlot = diffuseEnv[0];
      if ((_a = args.diffuseCube) == null ? void 0 : _a.isTextureReady) {
        webglResourceRepository.setUniform1iForTexture(shaderProgram, ShaderSemantics.DiffuseEnvTexture.str, [
          diffuseEnvSlot,
          args.diffuseCube,
          this.Vq
        ]);
      } else {
        webglResourceRepository.setUniform1iForTexture(shaderProgram, ShaderSemantics.DiffuseEnvTexture.str, [
          diffuseEnvSlot,
          engine.dummyTextures.dummyBlackCubeTexture
        ]);
      }
    }
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
    args
  }) {
    let cameraComponent = args.renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = engine.componentRepository.getComponent(
        CameraComponent,
        CameraComponent.getCurrent(engine)
      );
    }
    material.setParameter("cameraUp", cameraComponent.upInner);
    if (this.gr) {
      material.setParameter("aspect", cameraComponent.aspect);
    }
    const {
      mipmapLevelNumber,
      meshRenderComponent,
      diffuseHdriType,
      specularHdriType,
      diffuseContribution,
      specularContribution
    } = _MToon0xMaterialContent.Yq(args);
    const tmp_vector4 = AbstractMaterialContent._q;
    tmp_vector4.x = mipmapLevelNumber;
    tmp_vector4.y = diffuseContribution;
    tmp_vector4.z = specularContribution;
    tmp_vector4.w = meshRenderComponent.rotationOfCubeMap;
    material.setParameter("iblParameter", tmp_vector4);
    const tmp_vector2 = AbstractMaterialContent.$q;
    tmp_vector2.x = diffuseHdriType;
    tmp_vector2.y = specularHdriType;
    material.setParameter("hdriFormat", tmp_vector2);
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
  static unityBlendEnumCorrespondence(enumNumber) {
    let result = GL_ZERO;
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
  static Yq(args) {
    let mipmapLevelNumber = 1;
    if (args.specularCube) {
      mipmapLevelNumber = args.specularCube.mipmapLevelNumber;
    }
    const meshRenderComponent = args.entity.getMeshRenderer();
    let diffuseHdriType = HdriFormat.LDR_SRGB.index;
    let specularHdriType = HdriFormat.LDR_SRGB.index;
    if (meshRenderComponent.diffuseCubeMap) {
      diffuseHdriType = meshRenderComponent.diffuseCubeMap.hdriFormat.index;
    }
    if (meshRenderComponent.specularCubeMap) {
      specularHdriType = meshRenderComponent.specularCubeMap.hdriFormat.index;
    }
    const diffuseContribution = meshRenderComponent.diffuseCubeMap != null ? meshRenderComponent.diffuseCubeMapContribution : 0;
    const specularContribution = meshRenderComponent.specularCubeMap != null ? meshRenderComponent.specularCubeMapContribution : 0;
    return {
      mipmapLevelNumber,
      meshRenderComponent,
      diffuseHdriType,
      specularHdriType,
      diffuseContribution,
      specularContribution
    };
  }
};
_MToon0xMaterialContent._Cutoff = new ShaderSemanticsClass({ str: "cutoff" });
_MToon0xMaterialContent._Color = new ShaderSemanticsClass({ str: "litColor" });
_MToon0xMaterialContent._ShadeColor = new ShaderSemanticsClass({ str: "shadeColor" });
_MToon0xMaterialContent._litColorTexture = new ShaderSemanticsClass({ str: "litColorTexture" });
_MToon0xMaterialContent._shadeColorTexture = new ShaderSemanticsClass({
  str: "shadeColorTexture"
});
_MToon0xMaterialContent._BumpScale = new ShaderSemanticsClass({ str: "normalScale" });
_MToon0xMaterialContent._normalTexture = new ShaderSemanticsClass({ str: "normalTexture" });
_MToon0xMaterialContent._ReceiveShadowRate = new ShaderSemanticsClass({
  str: "receiveShadowRate"
});
_MToon0xMaterialContent._receiveShadowTexture = new ShaderSemanticsClass({
  str: "receiveShadowTexture"
});
_MToon0xMaterialContent._ShadingGradeRate = new ShaderSemanticsClass({
  str: "shadingGradeRate"
});
_MToon0xMaterialContent._shadingGradeTexture = new ShaderSemanticsClass({
  str: "shadingGradeTexture"
});
_MToon0xMaterialContent._ShadeShift = new ShaderSemanticsClass({ str: "shadeShift" });
_MToon0xMaterialContent._ShadeToony = new ShaderSemanticsClass({ str: "shadeToony" });
_MToon0xMaterialContent._LightColorAttenuation = new ShaderSemanticsClass({
  str: "lightColorAttenuation"
});
_MToon0xMaterialContent._AmbientColor = new ShaderSemanticsClass({
  str: "ambientColor"
});
_MToon0xMaterialContent._IndirectLightIntensity = new ShaderSemanticsClass({
  str: "indirectLightIntensity"
});
_MToon0xMaterialContent._rimTexture = new ShaderSemanticsClass({ str: "rimTexture" });
_MToon0xMaterialContent._RimColor = new ShaderSemanticsClass({ str: "rimColor" });
_MToon0xMaterialContent._RimLightingMix = new ShaderSemanticsClass({
  str: "rimLightingMix"
});
_MToon0xMaterialContent._RimFresnelPower = new ShaderSemanticsClass({
  str: "rimFresnelPower"
});
_MToon0xMaterialContent._RimLift = new ShaderSemanticsClass({ str: "rimLift" });
_MToon0xMaterialContent._matCapTexture = new ShaderSemanticsClass({ str: "matCapTexture" });
_MToon0xMaterialContent._EmissionColor = new ShaderSemanticsClass({
  str: "emissionColor"
});
_MToon0xMaterialContent._emissionTexture = new ShaderSemanticsClass({
  str: "emissionTexture"
});
_MToon0xMaterialContent._OutlineWidthTexture = new ShaderSemanticsClass({
  str: "outlineWidthTexture"
});
_MToon0xMaterialContent._OutlineWidth = new ShaderSemanticsClass({
  str: "outlineWidth"
});
_MToon0xMaterialContent._OutlineScaledMaxDistance = new ShaderSemanticsClass({
  str: "outlineScaledMaxDistance"
});
_MToon0xMaterialContent._OutlineColor = new ShaderSemanticsClass({
  str: "outlineColor"
});
_MToon0xMaterialContent._OutlineLightingMix = new ShaderSemanticsClass({
  str: "outlineLightingMix"
});
_MToon0xMaterialContent.Aspect = new ShaderSemanticsClass({ str: "aspect" });
_MToon0xMaterialContent.CameraUp = new ShaderSemanticsClass({ str: "cameraUp" });
var MToon0xMaterialContent = _MToon0xMaterialContent;
export {
  MToon0xMaterialContent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL2NvbnRlbnRzL01Ub29uMHhNYXRlcmlhbENvbnRlbnQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7XG4gIEdMX0RTVF9BTFBIQSxcbiAgR0xfRFNUX0NPTE9SLFxuICBHTF9PTkUsXG4gIEdMX09ORV9NSU5VU19EU1RfQUxQSEEsXG4gIEdMX09ORV9NSU5VU19EU1RfQ09MT1IsXG4gIEdMX09ORV9NSU5VU19TUkNfQUxQSEEsXG4gIEdMX09ORV9NSU5VU19TUkNfQ09MT1IsXG4gIEdMX1NSQ19BTFBIQSxcbiAgR0xfU1JDX0FMUEhBX1NBVFVSQVRFLFxuICBHTF9TUkNfQ09MT1IsXG4gIEdMX1pFUk8sXG4gIHR5cGUgVnJtMHhNYXRlcmlhbFByb3BlcnR5LFxufSBmcm9tICcuLi8uLi8uLi90eXBlcyc7XG5pbXBvcnQgdHlwZSB7IEFycmF5MywgQXJyYXk0LCBDb3VudCB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCBtVG9vblNpbmdsZVNoYWRlckZyYWdtZW50XyBmcm9tICcuLi8uLi8uLi93ZWJnbC9zaGFkZXJpdHlfc2hhZGVycy9NVG9vbjB4U2luZ2xlU2hhZGVyL01Ub29uMHhTaW5nbGVTaGFkZXIuZnJhZy5nbHNsJztcbmltcG9ydCBtVG9vblNpbmdsZVNoYWRlclZlcnRleF8gZnJvbSAnLi4vLi4vLi4vd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvTVRvb24weFNpbmdsZVNoYWRlci9NVG9vbjB4U2luZ2xlU2hhZGVyLnZlcnQuZ2xzbCc7XG5pbXBvcnQgdHlwZSB7IFJlbmRlcmluZ0FyZ1dlYkdMLCBSZW5kZXJpbmdBcmdXZWJHcHUgfSBmcm9tICcuLi8uLi8uLi93ZWJnbC90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgbVRvb25TaW5nbGVTaGFkZXJGcmFnbWVudFdlYkdwdV8gZnJvbSAnLi4vLi4vLi4vd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL01Ub29uMHhTaW5nbGVTaGFkZXIvTVRvb24weFNpbmdsZVNoYWRlci5mcmFnLndnc2wnO1xuaW1wb3J0IG1Ub29uU2luZ2xlU2hhZGVyVmVydGV4V2ViR3B1XyBmcm9tICcuLi8uLi8uLi93ZWJncHUvc2hhZGVyaXR5X3NoYWRlcnMvTVRvb24weFNpbmdsZVNoYWRlci9NVG9vbjB4U2luZ2xlU2hhZGVyLnZlcnQud2dzbCc7XG5pbXBvcnQgeyBDYW1lcmFDb21wb25lbnQgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0NhbWVyYS9DYW1lcmFDb21wb25lbnQnO1xuaW1wb3J0IHsgV2VsbEtub3duQ29tcG9uZW50VElEcyB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5pbXBvcnQgeyBIZHJpRm9ybWF0LCBQcm9jZXNzQXBwcm9hY2gsIFRleHR1cmVQYXJhbWV0ZXIgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucyc7XG5pbXBvcnQgeyBBbHBoYU1vZGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9BbHBoYU1vZGUnO1xuaW1wb3J0IHsgQmxlbmQgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9CbGVuZCc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgU2hhZGVyU2VtYW50aWNzLCBTaGFkZXJTZW1hbnRpY3NDbGFzcyB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclNlbWFudGljcyc7XG5pbXBvcnQgdHlwZSB7IFNoYWRlclNlbWFudGljc0luZm8gfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9TaGFkZXJTZW1hbnRpY3NJbmZvJztcbmltcG9ydCB7IFNoYWRlclR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9TaGFkZXJUeXBlJztcbmltcG9ydCB7IE11dGFibGVWZWN0b3IyIH0gZnJvbSAnLi4vLi4vbWF0aC9NdXRhYmxlVmVjdG9yMic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yNCB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVZlY3RvcjQnO1xuaW1wb3J0IHsgU2NhbGFyIH0gZnJvbSAnLi4vLi4vbWF0aC9TY2FsYXInO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgeyBWZWN0b3I0IH0gZnJvbSAnLi4vLi4vbWF0aC9WZWN0b3I0JztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBTYW1wbGVyIH0gZnJvbSAnLi4vLi4vdGV4dHVyZXMvU2FtcGxlcic7XG5pbXBvcnQgdHlwZSB7IFRleHR1cmUgfSBmcm9tICcuLi8uLi90ZXh0dXJlcy9UZXh0dXJlJztcbmltcG9ydCB7IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50IH0gZnJvbSAnLi4vY29yZS9BYnN0cmFjdE1hdGVyaWFsQ29udGVudCc7XG5pbXBvcnQgdHlwZSB7IE1hdGVyaWFsIH0gZnJvbSAnLi4vY29yZS9NYXRlcmlhbCc7XG5cbi8vIFNoYWRlcnMgb2YgYSBiYWNrZW5kIGV4Y2x1ZGVkIGF0IGJ1aWxkIHRpbWUgKHNlZSBzcmMvYmFja2VuZEZsYWdzLmQudHMpIGFyZSBkcm9wcGVkIGJ5IHRoZSBidW5kbGVyLlxuY29uc3QgbVRvb25TaW5nbGVTaGFkZXJGcmFnbWVudCA9XG4gIHR5cGVvZiBfX1JOX1dFQkdMX18gPT09ICd1bmRlZmluZWQnIHx8IF9fUk5fV0VCR0xfXyA/IG1Ub29uU2luZ2xlU2hhZGVyRnJhZ21lbnRfIDogdW5kZWZpbmVkO1xuY29uc3QgbVRvb25TaW5nbGVTaGFkZXJWZXJ0ZXggPVxuICB0eXBlb2YgX19STl9XRUJHTF9fID09PSAndW5kZWZpbmVkJyB8fCBfX1JOX1dFQkdMX18gPyBtVG9vblNpbmdsZVNoYWRlclZlcnRleF8gOiB1bmRlZmluZWQ7XG5jb25zdCBtVG9vblNpbmdsZVNoYWRlckZyYWdtZW50V2ViR3B1ID1cbiAgdHlwZW9mIF9fUk5fV0VCR1BVX18gPT09ICd1bmRlZmluZWQnIHx8IF9fUk5fV0VCR1BVX18gPyBtVG9vblNpbmdsZVNoYWRlckZyYWdtZW50V2ViR3B1XyA6IHVuZGVmaW5lZDtcbmNvbnN0IG1Ub29uU2luZ2xlU2hhZGVyVmVydGV4V2ViR3B1ID1cbiAgdHlwZW9mIF9fUk5fV0VCR1BVX18gPT09ICd1bmRlZmluZWQnIHx8IF9fUk5fV0VCR1BVX18gPyBtVG9vblNpbmdsZVNoYWRlclZlcnRleFdlYkdwdV8gOiB1bmRlZmluZWQ7XG5cbi8qKlxuICogTWF0ZXJpYWwgY29udGVudCBpbXBsZW1lbnRhdGlvbiBmb3IgTVRvb24gMC54IHNoYWRlci5cbiAqIFRoaXMgY2xhc3MgaGFuZGxlcyB0aGUgY3JlYXRpb24gYW5kIGNvbmZpZ3VyYXRpb24gb2YgTVRvb24gbWF0ZXJpYWxzLFxuICogd2hpY2ggYXJlIGNvbW1vbmx5IHVzZWQgZm9yIHRvb24tc3R5bGUgcmVuZGVyaW5nIGluIFZSTSBtb2RlbHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBNVG9vbjB4TWF0ZXJpYWxDb250ZW50IGV4dGVuZHMgQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQge1xuICBwcml2YXRlIF9fZGlmZnVzZUlibEN1YmVNYXBTYW1wbGVyOiBTYW1wbGVyO1xuICBwcml2YXRlIF9fc3BlY3VsYXJJYmxDdWJlTWFwU2FtcGxlcjogU2FtcGxlcjtcbiAgc3RhdGljIHJlYWRvbmx5IF9DdXRvZmYgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3MoeyBzdHI6ICdjdXRvZmYnIH0pO1xuICBzdGF0aWMgcmVhZG9ubHkgX0NvbG9yID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHsgc3RyOiAnbGl0Q29sb3InIH0pO1xuICBzdGF0aWMgcmVhZG9ubHkgX1NoYWRlQ29sb3IgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3MoeyBzdHI6ICdzaGFkZUNvbG9yJyB9KTtcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBfbGl0Q29sb3JUZXh0dXJlID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHsgc3RyOiAnbGl0Q29sb3JUZXh0dXJlJyB9KTtcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBfc2hhZGVDb2xvclRleHR1cmUgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICAgIHN0cjogJ3NoYWRlQ29sb3JUZXh0dXJlJyxcbiAgfSk7XG4gIHN0YXRpYyByZWFkb25seSBfQnVtcFNjYWxlID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHsgc3RyOiAnbm9ybWFsU2NhbGUnIH0pO1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IF9ub3JtYWxUZXh0dXJlID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHsgc3RyOiAnbm9ybWFsVGV4dHVyZScgfSk7XG4gIHN0YXRpYyByZWFkb25seSBfUmVjZWl2ZVNoYWRvd1JhdGUgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICAgIHN0cjogJ3JlY2VpdmVTaGFkb3dSYXRlJyxcbiAgfSk7XG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgX3JlY2VpdmVTaGFkb3dUZXh0dXJlID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgICBzdHI6ICdyZWNlaXZlU2hhZG93VGV4dHVyZScsXG4gIH0pO1xuICBzdGF0aWMgcmVhZG9ubHkgX1NoYWRpbmdHcmFkZVJhdGUgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICAgIHN0cjogJ3NoYWRpbmdHcmFkZVJhdGUnLFxuICB9KTtcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBfc2hhZGluZ0dyYWRlVGV4dHVyZSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gICAgc3RyOiAnc2hhZGluZ0dyYWRlVGV4dHVyZScsXG4gIH0pO1xuICBzdGF0aWMgcmVhZG9ubHkgX1NoYWRlU2hpZnQgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3MoeyBzdHI6ICdzaGFkZVNoaWZ0JyB9KTtcbiAgc3RhdGljIHJlYWRvbmx5IF9TaGFkZVRvb255ID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHsgc3RyOiAnc2hhZGVUb29ueScgfSk7XG4gIHN0YXRpYyByZWFkb25seSBfTGlnaHRDb2xvckF0dGVudWF0aW9uID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgICBzdHI6ICdsaWdodENvbG9yQXR0ZW51YXRpb24nLFxuICB9KTtcbiAgc3RhdGljIHJlYWRvbmx5IF9BbWJpZW50Q29sb3IgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICAgIHN0cjogJ2FtYmllbnRDb2xvcicsXG4gIH0pO1xuICBzdGF0aWMgcmVhZG9ubHkgX0luZGlyZWN0TGlnaHRJbnRlbnNpdHkgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICAgIHN0cjogJ2luZGlyZWN0TGlnaHRJbnRlbnNpdHknLFxuICB9KTtcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBfcmltVGV4dHVyZSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7IHN0cjogJ3JpbVRleHR1cmUnIH0pO1xuICBzdGF0aWMgcmVhZG9ubHkgX1JpbUNvbG9yID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHsgc3RyOiAncmltQ29sb3InIH0pO1xuICBzdGF0aWMgcmVhZG9ubHkgX1JpbUxpZ2h0aW5nTWl4ID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgICBzdHI6ICdyaW1MaWdodGluZ01peCcsXG4gIH0pO1xuICBzdGF0aWMgcmVhZG9ubHkgX1JpbUZyZXNuZWxQb3dlciA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gICAgc3RyOiAncmltRnJlc25lbFBvd2VyJyxcbiAgfSk7XG4gIHN0YXRpYyByZWFkb25seSBfUmltTGlmdCA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7IHN0cjogJ3JpbUxpZnQnIH0pO1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IF9tYXRDYXBUZXh0dXJlID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHsgc3RyOiAnbWF0Q2FwVGV4dHVyZScgfSk7XG4gIHN0YXRpYyByZWFkb25seSBfRW1pc3Npb25Db2xvciA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gICAgc3RyOiAnZW1pc3Npb25Db2xvcicsXG4gIH0pO1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IF9lbWlzc2lvblRleHR1cmUgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICAgIHN0cjogJ2VtaXNzaW9uVGV4dHVyZScsXG4gIH0pO1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IF9PdXRsaW5lV2lkdGhUZXh0dXJlID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgICBzdHI6ICdvdXRsaW5lV2lkdGhUZXh0dXJlJyxcbiAgfSk7XG4gIHN0YXRpYyByZWFkb25seSBfT3V0bGluZVdpZHRoID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgICBzdHI6ICdvdXRsaW5lV2lkdGgnLFxuICB9KTtcbiAgc3RhdGljIHJlYWRvbmx5IF9PdXRsaW5lU2NhbGVkTWF4RGlzdGFuY2UgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICAgIHN0cjogJ291dGxpbmVTY2FsZWRNYXhEaXN0YW5jZScsXG4gIH0pO1xuICBzdGF0aWMgcmVhZG9ubHkgX091dGxpbmVDb2xvciA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gICAgc3RyOiAnb3V0bGluZUNvbG9yJyxcbiAgfSk7XG4gIHN0YXRpYyByZWFkb25seSBfT3V0bGluZUxpZ2h0aW5nTWl4ID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgICBzdHI6ICdvdXRsaW5lTGlnaHRpbmdNaXgnLFxuICB9KTtcblxuICBzdGF0aWMgcmVhZG9ubHkgQXNwZWN0ID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHsgc3RyOiAnYXNwZWN0JyB9KTtcbiAgc3RhdGljIHJlYWRvbmx5IENhbWVyYVVwID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHsgc3RyOiAnY2FtZXJhVXAnIH0pO1xuXG4gIHByaXZhdGUgX19PdXRsaW5lV2lkdGhNb2RlSXNTY3JlZW4gPSBmYWxzZTtcblxuICBwcml2YXRlIF9fZmxvYXRQcm9wZXJ0aWVzOiB7XG4gICAgW3M6IHN0cmluZ106IG51bWJlcjtcbiAgfSA9IHt9O1xuICBwcml2YXRlIF9fdmVjdG9yUHJvcGVydGllczoge1xuICAgIFtzOiBzdHJpbmddOiBBcnJheTM8bnVtYmVyPiB8IEFycmF5NDxudW1iZXI+O1xuICB9ID0ge307XG4gIHByaXZhdGUgX190ZXh0dXJlUHJvcGVydGllczogYW55ID0ge307XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTVRvb24gMC54IG1hdGVyaWFsIGNvbnRlbnQgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBpc091dGxpbmUgLSBXaGV0aGVyIHRoaXMgbWF0ZXJpYWwgaXMgZm9yIG91dGxpbmUgcmVuZGVyaW5nXG4gICAqIEBwYXJhbSBtYXRlcmlhbFByb3BlcnRpZXMgLSBWUk0gbWF0ZXJpYWwgcHJvcGVydGllcyBmcm9tIHRoZSBnbFRGIGZpbGVcbiAgICogQHBhcmFtIHRleHR1cmVzIC0gQXJyYXkgb2YgdGV4dHVyZXMgdXNlZCBieSB0aGUgbWF0ZXJpYWxcbiAgICogQHBhcmFtIHNhbXBsZXJzIC0gQXJyYXkgb2Ygc2FtcGxlcnMgZm9yIHRleHR1cmUgc2FtcGxpbmcgY29uZmlndXJhdGlvblxuICAgKiBAcGFyYW0gaXNNb3JwaGluZyAtIFdoZXRoZXIgbW9ycGhpbmcgKGJsZW5kIHNoYXBlcykgaXMgZW5hYmxlZFxuICAgKiBAcGFyYW0gaXNTa2lubmluZyAtIFdoZXRoZXIgc2tlbGV0YWwgYW5pbWF0aW9uIGlzIGVuYWJsZWRcbiAgICogQHBhcmFtIGlzTGlnaHRpbmcgLSBXaGV0aGVyIGxpZ2h0aW5nIGNhbGN1bGF0aW9ucyBhcmUgZW5hYmxlZFxuICAgKiBAcGFyYW0gdXNlVGFuZ2VudEF0dHJpYnV0ZSAtIFdoZXRoZXIgdG8gdXNlIHRhbmdlbnQgYXR0cmlidXRlcyBmb3Igbm9ybWFsIG1hcHBpbmdcbiAgICogQHBhcmFtIGRlYnVnTW9kZSAtIERlYnVnIHZpc3VhbGl6YXRpb24gbW9kZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBtYWtlT3V0cHV0U3JnYiAtIFdoZXRoZXIgdG8gY29udmVydCBvdXRwdXQgdG8gc1JHQiBjb2xvciBzcGFjZVxuICAgKiBAcGFyYW0gbWF0ZXJpYWxOYW1lIC0gTmFtZSBpZGVudGlmaWVyIGZvciB0aGUgbWF0ZXJpYWxcbiAgICogQHBhcmFtIGRlZmluaXRpb25zIC0gQWRkaXRpb25hbCBzaGFkZXIgcHJlcHJvY2Vzc29yIGRlZmluaXRpb25zXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBpc091dGxpbmU6IGJvb2xlYW4sXG4gICAgbWF0ZXJpYWxQcm9wZXJ0aWVzOiBWcm0weE1hdGVyaWFsUHJvcGVydHkgfCB1bmRlZmluZWQsXG4gICAgdGV4dHVyZXM6IGFueSxcbiAgICBzYW1wbGVyczogU2FtcGxlcltdLFxuICAgIGlzTW9ycGhpbmc6IGJvb2xlYW4sXG4gICAgaXNTa2lubmluZzogYm9vbGVhbixcbiAgICBpc0xpZ2h0aW5nOiBib29sZWFuLFxuICAgIHVzZVRhbmdlbnRBdHRyaWJ1dGU6IGJvb2xlYW4sXG4gICAgZGVidWdNb2RlOiBDb3VudCB8IHVuZGVmaW5lZCxcbiAgICBtYWtlT3V0cHV0U3JnYjogYm9vbGVhbixcbiAgICBtYXRlcmlhbE5hbWU6IHN0cmluZyxcbiAgICBkZWZpbml0aW9uczogc3RyaW5nW11cbiAgKSB7XG4gICAgc3VwZXIobWF0ZXJpYWxOYW1lLCB7XG4gICAgICBpc01vcnBoaW5nOiBpc01vcnBoaW5nLFxuICAgICAgaXNTa2lubmluZzogaXNTa2lubmluZyxcbiAgICAgIGlzTGlnaHRpbmc6IGlzTGlnaHRpbmcsXG4gICAgfSk7XG5cbiAgICBjb25zdCBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXk6IFNoYWRlclNlbWFudGljc0luZm9bXSA9IHRoaXMuZG9TaGFkZXJSZWZsZWN0aW9uKFxuICAgICAgZW5naW5lLFxuICAgICAgbVRvb25TaW5nbGVTaGFkZXJWZXJ0ZXgsXG4gICAgICBtVG9vblNpbmdsZVNoYWRlckZyYWdtZW50LFxuICAgICAgbVRvb25TaW5nbGVTaGFkZXJWZXJ0ZXhXZWJHcHUsXG4gICAgICBtVG9vblNpbmdsZVNoYWRlckZyYWdtZW50V2ViR3B1LFxuICAgICAgZGVmaW5pdGlvbnNcbiAgICApO1xuXG4gICAgdGhpcy5fX2RpZmZ1c2VJYmxDdWJlTWFwU2FtcGxlciA9IG5ldyBTYW1wbGVyKGVuZ2luZSwge1xuICAgICAgbWluRmlsdGVyOiBUZXh0dXJlUGFyYW1ldGVyLkxpbmVhcixcbiAgICAgIG1hZ0ZpbHRlcjogVGV4dHVyZVBhcmFtZXRlci5MaW5lYXIsXG4gICAgICB3cmFwUzogVGV4dHVyZVBhcmFtZXRlci5DbGFtcFRvRWRnZSxcbiAgICAgIHdyYXBUOiBUZXh0dXJlUGFyYW1ldGVyLkNsYW1wVG9FZGdlLFxuICAgICAgd3JhcFI6IFRleHR1cmVQYXJhbWV0ZXIuQ2xhbXBUb0VkZ2UsXG4gICAgfSk7XG4gICAgdGhpcy5fX3NwZWN1bGFySWJsQ3ViZU1hcFNhbXBsZXIgPSBuZXcgU2FtcGxlcihlbmdpbmUsIHtcbiAgICAgIG1pbkZpbHRlcjogVGV4dHVyZVBhcmFtZXRlci5MaW5lYXJNaXBtYXBMaW5lYXIsXG4gICAgICBtYWdGaWx0ZXI6IFRleHR1cmVQYXJhbWV0ZXIuTGluZWFyLFxuICAgICAgd3JhcFM6IFRleHR1cmVQYXJhbWV0ZXIuQ2xhbXBUb0VkZ2UsXG4gICAgICB3cmFwVDogVGV4dHVyZVBhcmFtZXRlci5DbGFtcFRvRWRnZSxcbiAgICAgIHdyYXBSOiBUZXh0dXJlUGFyYW1ldGVyLkNsYW1wVG9FZGdlLFxuICAgIH0pO1xuICAgIGlmICghdGhpcy5fX2RpZmZ1c2VJYmxDdWJlTWFwU2FtcGxlci5jcmVhdGVkKSB7XG4gICAgICB0aGlzLl9fZGlmZnVzZUlibEN1YmVNYXBTYW1wbGVyLmNyZWF0ZSgpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5fX3NwZWN1bGFySWJsQ3ViZU1hcFNhbXBsZXIuY3JlYXRlZCkge1xuICAgICAgdGhpcy5fX3NwZWN1bGFySWJsQ3ViZU1hcFNhbXBsZXIuY3JlYXRlKCk7XG4gICAgfVxuXG4gICAgaWYgKG1hdGVyaWFsUHJvcGVydGllcyAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLmZsb2F0UHJvcGVydGllcztcbiAgICAgIHRoaXMuX192ZWN0b3JQcm9wZXJ0aWVzID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLnZlY3RvclByb3BlcnRpZXM7XG4gICAgICB0aGlzLl9fdGV4dHVyZVByb3BlcnRpZXMgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG1hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcykpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9CbGVuZE1vZGUgPSAwLjA7XG4gICAgICB0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9CdW1wU2NhbGUgPSAxLjA7XG4gICAgICB0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9DdWxsTW9kZSA9IDIuMDtcbiAgICAgIHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX0N1dG9mZiA9IDAuNTtcbiAgICAgIHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX0RlYnVnTW9kZSA9IDAuMDtcbiAgICAgIHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX0RzdEJsZW5kID0gMC4wO1xuICAgICAgdGhpcy5fX2Zsb2F0UHJvcGVydGllcy5fSW5kaXJlY3RMaWdodEludGVuc2l0eSA9IDAuMTtcbiAgICAgIHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX0xpZ2h0Q29sb3JBdHRlbnVhdGlvbiA9IDAuMDtcbiAgICAgIHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX091dGxpbmVDb2xvck1vZGUgPSAwLjA7XG4gICAgICB0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9PdXRsaW5lQ3VsbE1vZGUgPSAxLjA7XG4gICAgICB0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9PdXRsaW5lTGlnaHRpbmdNaXggPSAxLjA7XG4gICAgICB0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9PdXRsaW5lU2NhbGVkTWF4RGlzdGFuY2UgPSAxLjA7XG4gICAgICB0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9PdXRsaW5lV2lkdGggPSAwLjU7XG4gICAgICB0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9PdXRsaW5lV2lkdGhNb2RlID0gMC4wO1xuICAgICAgdGhpcy5fX2Zsb2F0UHJvcGVydGllcy5fUmVjZWl2ZVNoYWRvd1JhdGUgPSAxLjA7XG4gICAgICB0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9SaW1GcmVzbmVsUG93ZXIgPSAxLjA7XG4gICAgICB0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9SaW1MaWZ0ID0gMC4wO1xuICAgICAgdGhpcy5fX2Zsb2F0UHJvcGVydGllcy5fUmltTGlnaHRpbmdNaXggPSAwLjA7XG4gICAgICB0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9TaGFkZVNoaWZ0ID0gMC4wO1xuICAgICAgdGhpcy5fX2Zsb2F0UHJvcGVydGllcy5fU2hhZGVUb29ueSA9IDAuOTtcbiAgICAgIHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX1NoYWRpbmdHcmFkZVJhdGUgPSAxLjA7XG4gICAgICB0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9TcmNCbGVuZCA9IDEuMDtcbiAgICAgIHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX1pXcml0ZSA9IDEuMDtcbiAgICAgIHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX1V2QW5pbVNjcm9sbFggPSAwLjA7XG4gICAgICB0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9VdkFuaW1TY3JvbGxZID0gMC4wO1xuICAgICAgdGhpcy5fX2Zsb2F0UHJvcGVydGllcy5fVXZBbmltUm90YXRpb24gPSAwLjA7XG5cbiAgICAgIHRoaXMuX192ZWN0b3JQcm9wZXJ0aWVzLl9Db2xvciA9IFsxLCAxLCAxLCAxXTtcbiAgICAgIHRoaXMuX192ZWN0b3JQcm9wZXJ0aWVzLl9FbWlzc2lvbkNvbG9yID0gWzAsIDAsIDBdO1xuICAgICAgdGhpcy5fX3ZlY3RvclByb3BlcnRpZXMuX091dGxpbmVDb2xvciA9IFswLCAwLCAwLCAxXTtcbiAgICAgIHRoaXMuX192ZWN0b3JQcm9wZXJ0aWVzLl9TaGFkZUNvbG9yID0gWzAuOTcsIDAuODEsIDAuODYsIDFdO1xuICAgICAgdGhpcy5fX3ZlY3RvclByb3BlcnRpZXMuX1JpbUNvbG9yID0gWzAsIDAsIDBdO1xuICAgICAgLy8gdGhpcy5fX3ZlY3RvclByb3BlcnRpZXMuX0J1bXBNYXAgPSBbMCwgMCwgMSwgMV07XG4gICAgICAvLyB0aGlzLl9fdmVjdG9yUHJvcGVydGllcy5fRW1pc3Npb25NYXAgPSBbMCwgMCwgMSwgMV07XG4gICAgICAvLyB0aGlzLl9fdmVjdG9yUHJvcGVydGllcy5fTWFpblRleCA9IFswLCAwLCAxLCAxXTtcbiAgICAgIC8vIHRoaXMuX192ZWN0b3JQcm9wZXJ0aWVzLl9PdXRsaW5lV2lkdGhUZXh0dXJlID0gWzAsIDAsIDEsIDFdO1xuICAgICAgLy8gdGhpcy5fX3ZlY3RvclByb3BlcnRpZXMuX1JlY2VpdmVTaGFkb3dUZXh0dXJlID0gWzAsIDAsIDEsIDFdO1xuICAgICAgLy8gdGhpcy5fX3ZlY3RvclByb3BlcnRpZXMuX1NoYWRlVGV4dHVyZSA9IFswLCAwLCAxLCAxXTtcbiAgICAgIC8vIHRoaXMuX192ZWN0b3JQcm9wZXJ0aWVzLl9TaGFkaW5nR3JhZGVUZXh0dXJlID0gWzAsIDAsIDEsIDFdO1xuICAgICAgLy8gdGhpcy5fX3ZlY3RvclByb3BlcnRpZXMuX1NwaGVyZUFkZCA9IFswLCAwLCAxLCAxXTtcbiAgICB9XG5cbiAgICBpZiAoZGVidWdNb2RlKSB7XG4gICAgICB0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9EZWJ1Z01vZGUgPSBkZWJ1Z01vZGU7XG4gICAgfVxuXG4gICAgLy8gbm9uLVRleHR1cmVcbiAgICBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkucHVzaChcbiAgICAgIHtcbiAgICAgICAgc2VtYW50aWM6ICdjdXRvZmYnLFxuICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsXG4gICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICBpbml0aWFsVmFsdWU6IFNjYWxhci5mcm9tQ29weU51bWJlcih0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9DdXRvZmYpLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogMSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNlbWFudGljOiAnbGl0Q29sb3InLFxuICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWM0LFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBWZWN0b3I0LmZyb21Db3B5QXJyYXkodGhpcy5fX3ZlY3RvclByb3BlcnRpZXMuX0NvbG9yIGFzIEFycmF5NDxudW1iZXI+KSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ3NoYWRlQ29sb3InLFxuICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWMzLFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBWZWN0b3IzLmZyb21Db3B5QXJyYXkodGhpcy5fX3ZlY3RvclByb3BlcnRpZXMuX1NoYWRlQ29sb3IpLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogMSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNlbWFudGljOiAnYnVtcFNjYWxlJyxcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBTY2FsYXIuZnJvbUNvcHlOdW1iZXIodGhpcy5fX2Zsb2F0UHJvcGVydGllcy5fQnVtcFNjYWxlKSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ3JlY2VpdmVTaGFkb3dSYXRlJyxcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBTY2FsYXIuZnJvbUNvcHlOdW1iZXIodGhpcy5fX2Zsb2F0UHJvcGVydGllcy5fUmVjZWl2ZVNoYWRvd1JhdGUpLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogMSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNlbWFudGljOiAnc2hhZGluZ0dyYWRlUmF0ZScsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX1NoYWRpbmdHcmFkZVJhdGUpLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogMSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNlbWFudGljOiAnc2hhZGVTaGlmdCcsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX1NoYWRlU2hpZnQpLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogMSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNlbWFudGljOiAnc2hhZGVUb29ueScsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX1NoYWRlVG9vbnkpLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogMSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNlbWFudGljOiAnbGlnaHRDb2xvckF0dGVudWF0aW9uJyxcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBTY2FsYXIuZnJvbUNvcHlOdW1iZXIodGhpcy5fX2Zsb2F0UHJvcGVydGllcy5fTGlnaHRDb2xvckF0dGVudWF0aW9uKSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ2luZGlyZWN0TGlnaHRJbnRlbnNpdHknLFxuICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsXG4gICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICBpbml0aWFsVmFsdWU6IFNjYWxhci5mcm9tQ29weU51bWJlcih0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9JbmRpcmVjdExpZ2h0SW50ZW5zaXR5KSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ3JpbUNvbG9yJyxcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMyxcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogVmVjdG9yMy5mcm9tQ29weUFycmF5KHRoaXMuX192ZWN0b3JQcm9wZXJ0aWVzLl9SaW1Db2xvciBhcyBBcnJheTM8bnVtYmVyPiksXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc2VtYW50aWM6ICdyaW1MaWdodGluZ01peCcsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX1JpbUxpZ2h0aW5nTWl4KSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ3JpbUZyZXNuZWxQb3dlcicsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX1JpbUZyZXNuZWxQb3dlciksXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc2VtYW50aWM6ICdyaW1MaWZ0JyxcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBTY2FsYXIuZnJvbUNvcHlOdW1iZXIodGhpcy5fX2Zsb2F0UHJvcGVydGllcy5fUmltTGlmdCksXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc2VtYW50aWM6ICdjYW1lcmFVcCcsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzMsXG4gICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICBzb2xvRGF0dW06IHRydWUsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogVmVjdG9yMy5mcm9tQ29weUFycmF5KFswLCAxLCAwXSksXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc2VtYW50aWM6ICdlbWlzc2lvbkNvbG9yJyxcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMyxcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogVmVjdG9yMy5mcm9tQ29weUFycmF5KHRoaXMuX192ZWN0b3JQcm9wZXJ0aWVzLl9FbWlzc2lvbkNvbG9yIGFzIEFycmF5MzxudW1iZXI+KSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ3V2QW5pbWF0aW9uU2Nyb2xsWFNwZWVkRmFjdG9yJyxcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaXNJbnRlcm5hbFNldHRpbmc6IGZhbHNlLFxuICAgICAgICBpbml0aWFsVmFsdWU6IFNjYWxhci5mcm9tQ29weU51bWJlcih0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9VdkFuaW1TY3JvbGxYID8/IDAuMCksXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc2VtYW50aWM6ICd1dkFuaW1hdGlvblNjcm9sbFlTcGVlZEZhY3RvcicsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGlzSW50ZXJuYWxTZXR0aW5nOiBmYWxzZSxcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBTY2FsYXIuZnJvbUNvcHlOdW1iZXIodGhpcy5fX2Zsb2F0UHJvcGVydGllcy5fVXZBbmltU2Nyb2xsWSA/PyAwLjApLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogMSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNlbWFudGljOiAndXZBbmltYXRpb25Sb3RhdGlvblNwZWVkRmFjdG9yJyxcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaXNJbnRlcm5hbFNldHRpbmc6IGZhbHNlLFxuICAgICAgICBpbml0aWFsVmFsdWU6IFNjYWxhci5mcm9tQ29weU51bWJlcih0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9VdkFuaW1Sb3RhdGlvbiA/PyAwLjApLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogMSxcbiAgICAgIH0sXG5cbiAgICAgIHtcbiAgICAgICAgc2VtYW50aWM6ICd3aXJlZnJhbWUnLFxuICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWMzLFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBWZWN0b3IzLmZyb21Db3B5QXJyYXkoWzAsIDAsIDFdKSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEwLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc2VtYW50aWM6ICdtYWtlT3V0cHV0U3JnYicsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5Cb29sLFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IDEsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKG1ha2VPdXRwdXRTcmdiID8gMSA6IDApLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBfRGVidWdNb2RlXG4gICAgc3dpdGNoICh0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9EZWJ1Z01vZGUpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgdGhpcy5fX2RlZmluaXRpb25zICs9ICcjZGVmaW5lIFJOX01UT09OX0RFQlVHX05PUk1BTFxcbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICB0aGlzLl9fZGVmaW5pdGlvbnMgKz0gJyNkZWZpbmUgUk5fTVRPT05fREVCVUdfTElUU0hBREVSQVRFXFxuJztcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKGlzT3V0bGluZSkge1xuICAgICAgdGhpcy5fX2RlZmluaXRpb25zICs9ICcjZGVmaW5lIFJOX01UT09OX0lTX09VVExJTkVcXG4nO1xuXG4gICAgICAvLyBfT3V0bGluZVdpZHRoTW9kZVxuICAgICAgc3dpdGNoICh0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9PdXRsaW5lV2lkdGhNb2RlKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICB0aGlzLl9fZGVmaW5pdGlvbnMgKz0gJyNkZWZpbmUgUk5fTVRPT05fT1VUTElORV9OT05FXFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIHRoaXMuX19kZWZpbml0aW9ucyArPSAnI2RlZmluZSBSTl9NVE9PTl9PVVRMSU5FX1dJRFRIX1dPUkxEXFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHRoaXMuX19kZWZpbml0aW9ucyArPSAnI2RlZmluZSBSTl9NVE9PTl9PVVRMSU5FX1dJRFRIX1NDUkVFTlxcbic7XG4gICAgICAgICAgdGhpcy5fX091dGxpbmVXaWR0aE1vZGVJc1NjcmVlbiA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIF9PdXRsaW5lQ29sb3JNb2RlXG4gICAgICBzd2l0Y2ggKHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX091dGxpbmVDb2xvck1vZGUpIHtcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgIHRoaXMuX19kZWZpbml0aW9ucyArPSAnI2RlZmluZSBSTl9NVE9PTl9PVVRMSU5FX0NPTE9SX0ZJWEVEXFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIHRoaXMuX19kZWZpbml0aW9ucyArPSAnI2RlZmluZSBSTl9NVE9PTl9PVVRMSU5FX0NPTE9SX01JWEVEXFxuJztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgc2hhZGVyU2VtYW50aWNzSW5mb0FycmF5LnB1c2goXG4gICAgICAgIHtcbiAgICAgICAgICBzZW1hbnRpYzogJ291dGxpbmVXaWR0aCcsXG4gICAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsXG4gICAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuVmVydGV4U2hhZGVyLFxuICAgICAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX091dGxpbmVXaWR0aCksXG4gICAgICAgICAgbWluOiAwLFxuICAgICAgICAgIG1heDogMSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNlbWFudGljOiAnb3V0bGluZVNjYWxlZE1heERpc3RhbmNlJyxcbiAgICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5WZXJ0ZXhTaGFkZXIsXG4gICAgICAgICAgaW5pdGlhbFZhbHVlOiBTY2FsYXIuZnJvbUNvcHlOdW1iZXIodGhpcy5fX2Zsb2F0UHJvcGVydGllcy5fT3V0bGluZVNjYWxlZE1heERpc3RhbmNlKSxcbiAgICAgICAgICBtaW46IDAsXG4gICAgICAgICAgbWF4OiAxLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgc2VtYW50aWM6ICdvdXRsaW5lQ29sb3InLFxuICAgICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMyxcbiAgICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgICBpbml0aWFsVmFsdWU6IFZlY3RvcjQuZnJvbUNvcHlBcnJheSh0aGlzLl9fdmVjdG9yUHJvcGVydGllcy5fT3V0bGluZUNvbG9yIGFzIEFycmF5NDxudW1iZXI+KSxcbiAgICAgICAgICBtaW46IDAsXG4gICAgICAgICAgbWF4OiAxLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgc2VtYW50aWM6ICdvdXRsaW5lTGlnaHRpbmdNaXgnLFxuICAgICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICAgICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX091dGxpbmVMaWdodGluZ01peCksXG4gICAgICAgICAgbWluOiAwLFxuICAgICAgICAgIG1heDogMSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNlbWFudGljOiAnYXNwZWN0JyxcbiAgICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICAgICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5WZXJ0ZXhTaGFkZXIsXG4gICAgICAgICAgaXNJbnRlcm5hbFNldHRpbmc6IHRydWUsXG4gICAgICAgICAgc29sb0RhdHVtOiB0cnVlLFxuICAgICAgICAgIGluaXRpYWxWYWx1ZTogU2NhbGFyLmZyb21Db3B5TnVtYmVyKDEuMCksXG4gICAgICAgICAgbWluOiAwLFxuICAgICAgICAgIG1heDogMSxcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoaXNMaWdodGluZykge1xuICAgICAgdGhpcy5fX2RlZmluaXRpb25zICs9ICcjZGVmaW5lIFJOX0lTX0xJR0hUSU5HXFxuJztcbiAgICB9XG5cbiAgICBpZiAoaXNTa2lubmluZykge1xuICAgICAgdGhpcy5fX2RlZmluaXRpb25zICs9ICcjZGVmaW5lIFJOX0lTX1NLSU5OSU5HXFxuJztcbiAgICB9XG5cbiAgICBpZiAoaXNNb3JwaGluZykge1xuICAgICAgdGhpcy5fX2RlZmluaXRpb25zICs9ICcjZGVmaW5lIFJOX0lTX01PUlBISU5HXFxuJztcbiAgICB9XG5cbiAgICBpZiAodXNlVGFuZ2VudEF0dHJpYnV0ZSkge1xuICAgICAgdGhpcy5fX2RlZmluaXRpb25zICs9ICcjZGVmaW5lIFJOX1VTRV9UQU5HRU5UX0FUVFJJQlVURVxcbic7XG4gICAgfVxuXG4gICAgLy8gVGV4dHVyZVxuICAgIGlmICh0aGlzLl9fdGV4dHVyZVByb3BlcnRpZXMuX0J1bXBNYXAgPj0gMCkge1xuICAgICAgLy90ZXh0dXJlcy5sZW5ndGggLSAyIGlzIGR1bW15VGV4dHVyZVxuICAgICAgdGhpcy5fX2RlZmluaXRpb25zICs9ICcjZGVmaW5lIFJOX01UT09OX0hBU19CVU1QTUFQXFxuJztcbiAgICB9XG4gICAgaWYgKHRoaXMuX190ZXh0dXJlUHJvcGVydGllcy5fT3V0bGluZVdpZHRoVGV4dHVyZSA+PSAwKSB7XG4gICAgICAvL3RleHR1cmVzLmxlbmd0aCAtIDIgaXMgZHVtbXlUZXh0dXJlXG4gICAgICB0aGlzLl9fZGVmaW5pdGlvbnMgKz0gJyNkZWZpbmUgUk5fTVRPT05fSEFTX09VVExJTkVfV0lEVEhfVEVYVFVSRVxcbic7XG4gICAgfVxuICAgIHRleHR1cmVzID0gW2VuZ2luZS5kdW1teVRleHR1cmVzLmR1bW15V2hpdGVUZXh0dXJlLCBlbmdpbmUuZHVtbXlUZXh0dXJlcy5kdW1teUJsYWNrVGV4dHVyZV07XG4gICAgdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9CdW1wTWFwID0gMDtcbiAgICB0aGlzLl9fdGV4dHVyZVByb3BlcnRpZXMuX0VtaXNzaW9uTWFwID0gMTtcbiAgICB0aGlzLl9fdGV4dHVyZVByb3BlcnRpZXMuX01haW5UZXggPSAwO1xuICAgIHRoaXMuX190ZXh0dXJlUHJvcGVydGllcy5fT3V0bGluZVdpZHRoVGV4dHVyZSA9IDA7XG4gICAgdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9VdkFuaW1NYXNrVGV4dHVyZSA9IDA7XG4gICAgdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9SZWNlaXZlU2hhZG93VGV4dHVyZSA9IDA7XG4gICAgdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9SaW1UZXh0dXJlID0gMTtcbiAgICB0aGlzLl9fdGV4dHVyZVByb3BlcnRpZXMuX1NoYWRlVGV4dHVyZSA9IDA7XG4gICAgdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9TaGFkaW5nR3JhZGVUZXh0dXJlID0gMDtcbiAgICB0aGlzLl9fdGV4dHVyZVByb3BlcnRpZXMuX1NwaGVyZUFkZCA9IDE7XG4gICAgLy8gdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9VdkFuaW1NYXNrVGV4dHVyZSA9IDA7XG4gICAgdGhpcy5fX3NldER1bW15VGV4dHVyZXModGV4dHVyZXMsIHNhbXBsZXJzLCBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXksIGlzT3V0bGluZSk7XG5cbiAgICB0aGlzLnNldFNoYWRlclNlbWFudGljc0luZm9BcnJheShzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgZHVtbXkgdGV4dHVyZXMgYW5kIHRoZWlyIGFzc29jaWF0ZWQgc2hhZGVyIHNlbWFudGljcyBpbmZvcm1hdGlvbi5cbiAgICogVGhpcyBtZXRob2QgY29uZmlndXJlcyBkZWZhdWx0IHRleHR1cmUgYmluZGluZ3MgZm9yIHZhcmlvdXMgTVRvb24gdGV4dHVyZSBzbG90c1xuICAgKiBhbmQgYWRkcyBjb3JyZXNwb25kaW5nIHNoYWRlciBzZW1hbnRpY3MgZW50cmllcy5cbiAgICpcbiAgICogQHBhcmFtIHRleHR1cmVzIC0gQXJyYXkgb2YgYXZhaWxhYmxlIHRleHR1cmVzXG4gICAqIEBwYXJhbSBzYW1wbGVycyAtIEFycmF5IG9mIHRleHR1cmUgc2FtcGxlcnNcbiAgICogQHBhcmFtIHNoYWRlclNlbWFudGljc0luZm9BcnJheSAtIEFycmF5IHRvIHBvcHVsYXRlIHdpdGggc2hhZGVyIHNlbWFudGljcyBpbmZvcm1hdGlvblxuICAgKiBAcGFyYW0gaXNPdXRsaW5lIC0gV2hldGhlciBvdXRsaW5lIHRleHR1cmVzIHNob3VsZCBiZSBpbmNsdWRlZFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldER1bW15VGV4dHVyZXMoXG4gICAgdGV4dHVyZXM6IFRleHR1cmVbXSxcbiAgICBzYW1wbGVyczogU2FtcGxlcltdLFxuICAgIHNoYWRlclNlbWFudGljc0luZm9BcnJheTogU2hhZGVyU2VtYW50aWNzSW5mb1tdLFxuICAgIGlzT3V0bGluZTogYm9vbGVhblxuICApIHtcbiAgICBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkucHVzaChcbiAgICAgIHtcbiAgICAgICAgc2VtYW50aWM6ICdsaXRDb2xvclRleHR1cmUnLFxuICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkludCxcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVGV4dHVyZTJELFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBbMSwgdGV4dHVyZXNbdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9NYWluVGV4XSwgc2FtcGxlcnNbdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9NYWluVGV4XV0sXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNlbWFudGljOiAnc2hhZGVDb2xvclRleHR1cmUnLFxuICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkludCxcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVGV4dHVyZTJELFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBbXG4gICAgICAgICAgMixcbiAgICAgICAgICB0ZXh0dXJlc1t0aGlzLl9fdGV4dHVyZVByb3BlcnRpZXMuX1NoYWRlVGV4dHVyZV0sXG4gICAgICAgICAgc2FtcGxlcnNbdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9TaGFkZVRleHR1cmVdLFxuICAgICAgICBdLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ3JlY2VpdmVTaGFkb3dUZXh0dXJlJyxcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5JbnQsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlRleHR1cmUyRCxcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogW1xuICAgICAgICAgIDMsXG4gICAgICAgICAgdGV4dHVyZXNbdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9SZWNlaXZlU2hhZG93VGV4dHVyZV0sXG4gICAgICAgICAgc2FtcGxlcnNbdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9SZWNlaXZlU2hhZG93VGV4dHVyZV0sXG4gICAgICAgIF0sXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNlbWFudGljOiAnc2hhZGluZ0dyYWRlVGV4dHVyZScsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuSW50LFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlMkQsXG4gICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICBpbml0aWFsVmFsdWU6IFtcbiAgICAgICAgICA0LFxuICAgICAgICAgIHRleHR1cmVzW3RoaXMuX190ZXh0dXJlUHJvcGVydGllcy5fU2hhZGluZ0dyYWRlVGV4dHVyZV0sXG4gICAgICAgICAgc2FtcGxlcnNbdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9TaGFkaW5nR3JhZGVUZXh0dXJlXSxcbiAgICAgICAgXSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc2VtYW50aWM6ICdyaW1UZXh0dXJlJyxcbiAgICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5JbnQsXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlRleHR1cmUyRCxcbiAgICAgICAgc3RhZ2U6IFNoYWRlclR5cGUuUGl4ZWxTaGFkZXIsXG4gICAgICAgIGluaXRpYWxWYWx1ZTogW1xuICAgICAgICAgIDUsXG4gICAgICAgICAgdGV4dHVyZXNbdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9SaW1UZXh0dXJlXSxcbiAgICAgICAgICBzYW1wbGVyc1t0aGlzLl9fdGV4dHVyZVByb3BlcnRpZXMuX1JpbVRleHR1cmVdLFxuICAgICAgICBdLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ21hdENhcFRleHR1cmUnLFxuICAgICAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkludCxcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVGV4dHVyZTJELFxuICAgICAgICBzdGFnZTogU2hhZGVyVHlwZS5QaXhlbFNoYWRlcixcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBbOSwgdGV4dHVyZXNbdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9TcGhlcmVBZGRdLCBzYW1wbGVyc1t0aGlzLl9fdGV4dHVyZVByb3BlcnRpZXMuX1NwaGVyZUFkZF1dLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZW1hbnRpYzogJ2VtaXNzaW9uVGV4dHVyZScsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuSW50LFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlMkQsXG4gICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICBpbml0aWFsVmFsdWU6IFtcbiAgICAgICAgICAxMCxcbiAgICAgICAgICB0ZXh0dXJlc1t0aGlzLl9fdGV4dHVyZVByb3BlcnRpZXMuX0VtaXNzaW9uTWFwXSxcbiAgICAgICAgICBzYW1wbGVyc1t0aGlzLl9fdGV4dHVyZVByb3BlcnRpZXMuX0VtaXNzaW9uTWFwXSxcbiAgICAgICAgXSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkucHVzaChcbiAgICAgIHtcbiAgICAgICAgLy8gbnVtYmVyIDAgb2YgdGV4dHVyZSBpcyB0aGUgZGF0YSBUZXh0dXJlXG4gICAgICAgIHNlbWFudGljOiAnbm9ybWFsVGV4dHVyZScsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuSW50LFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlMkQsXG4gICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICBpbml0aWFsVmFsdWU6IFsxMSwgdGV4dHVyZXNbdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9CdW1wTWFwXSwgc2FtcGxlcnNbdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9CdW1wTWFwXV0sXG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNlbWFudGljOiAndXZBbmltYXRpb25NYXNrVGV4dHVyZScsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuSW50LFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlMkQsXG4gICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlBpeGVsU2hhZGVyLFxuICAgICAgICBpbml0aWFsVmFsdWU6IFtcbiAgICAgICAgICAxMixcbiAgICAgICAgICB0ZXh0dXJlc1t0aGlzLl9fdGV4dHVyZVByb3BlcnRpZXMuX1V2QW5pbU1hc2tUZXh0dXJlXSxcbiAgICAgICAgICBzYW1wbGVyc1t0aGlzLl9fdGV4dHVyZVByb3BlcnRpZXMuX1V2QW5pbU1hc2tUZXh0dXJlXSxcbiAgICAgICAgXSxcbiAgICAgICAgbWluOiAwLFxuICAgICAgICBtYXg6IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBpZiAoaXNPdXRsaW5lKSB7XG4gICAgICBzaGFkZXJTZW1hbnRpY3NJbmZvQXJyYXkucHVzaCh7XG4gICAgICAgIHNlbWFudGljOiAnb3V0bGluZVdpZHRoVGV4dHVyZScsXG4gICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuSW50LFxuICAgICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlMkQsXG4gICAgICAgIHN0YWdlOiBTaGFkZXJUeXBlLlZlcnRleFNoYWRlcixcbiAgICAgICAgaW5pdGlhbFZhbHVlOiBbXG4gICAgICAgICAgMTMsXG4gICAgICAgICAgdGV4dHVyZXNbdGhpcy5fX3RleHR1cmVQcm9wZXJ0aWVzLl9PdXRsaW5lV2lkdGhUZXh0dXJlXSxcbiAgICAgICAgICBzYW1wbGVyc1t0aGlzLl9fdGV4dHVyZVByb3BlcnRpZXMuX091dGxpbmVXaWR0aFRleHR1cmVdLFxuICAgICAgICBdLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29uZmlndXJlcyBtYXRlcmlhbCBwYXJhbWV0ZXJzIGJhc2VkIG9uIE1Ub29uIHByb3BlcnRpZXMuXG4gICAqIFRoaXMgbWV0aG9kIHNldHMgdXAgYmxlbmRpbmcgbW9kZXMsIGN1bGxpbmcsIGFuZCBvdGhlciByZW5kZXJpbmcgc3RhdGVzXG4gICAqIGJhc2VkIG9uIHRoZSBtYXRlcmlhbCdzIE1Ub29uIHByb3BlcnRpZXMuXG4gICAqXG4gICAqIEBwYXJhbSBtYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCBpbnN0YW5jZSB0byBjb25maWd1cmVcbiAgICogQHBhcmFtIGlzT3V0bGluZSAtIFdoZXRoZXIgdGhpcyBpcyBhbiBvdXRsaW5lIG1hdGVyaWFsXG4gICAqL1xuICBzZXRNYXRlcmlhbFBhcmFtZXRlcnMoZW5naW5lOiBFbmdpbmUsIG1hdGVyaWFsOiBNYXRlcmlhbCwgaXNPdXRsaW5lOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMuX19mbG9hdFByb3BlcnRpZXMuX0JsZW5kTW9kZSAhPT0gMCkge1xuICAgICAgc3dpdGNoICh0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9CbGVuZE1vZGUpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIHRoaXMuX19kZWZpbml0aW9ucyArPSAnI2RlZmluZSBSTl9BTFBIQVRFU1RfT05cXG4nO1xuICAgICAgICAgIG1hdGVyaWFsLmFscGhhTW9kZSA9IEFscGhhTW9kZS5NYXNrO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgdGhpcy5fX2RlZmluaXRpb25zICs9ICcjZGVmaW5lIFJOX0FMUEhBQkxFTkRfT05cXG4nO1xuICAgICAgICAgIG1hdGVyaWFsLmFscGhhTW9kZSA9IEFscGhhTW9kZS5CbGVuZDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHRoaXMuX19kZWZpbml0aW9ucyArPSAnI2RlZmluZSBSTl9BTFBIQUJMRU5EX09OXFxuJztcbiAgICAgICAgICBtYXRlcmlhbC5hbHBoYU1vZGUgPSBBbHBoYU1vZGUuQmxlbmQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGJsZW5kRXF1YXRpb25Nb2RlID0gMzI3NzQ7IC8vIGdsLkZVTkNfQUREXG4gICAgICBjb25zdCBibGVuZEVxdWF0aW9uTW9kZUFscGhhID0gTVRvb24weE1hdGVyaWFsQ29udGVudC5fX2dldFVzYWJsZUJsZW5kRXF1YXRpb25Nb2RlQWxwaGEoZW5naW5lKTtcbiAgICAgIGNvbnN0IGJsZW5kRnVuY1NyY0ZhY3RvciA9IE1Ub29uMHhNYXRlcmlhbENvbnRlbnQudW5pdHlCbGVuZEVudW1Db3JyZXNwb25kZW5jZSh0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9TcmNCbGVuZCk7XG4gICAgICBjb25zdCBibGVuZEZ1bmNEc3RGYWN0b3IgPSBNVG9vbjB4TWF0ZXJpYWxDb250ZW50LnVuaXR5QmxlbmRFbnVtQ29ycmVzcG9uZGVuY2UodGhpcy5fX2Zsb2F0UHJvcGVydGllcy5fRHN0QmxlbmQpO1xuXG4gICAgICBtYXRlcmlhbC5zZXRCbGVuZEVxdWF0aW9uTW9kZShcbiAgICAgICAgQmxlbmQuZnJvbShibGVuZEVxdWF0aW9uTW9kZSksXG4gICAgICAgIGJsZW5kRXF1YXRpb25Nb2RlQWxwaGEgIT0gbnVsbCA/IEJsZW5kLmZyb20oYmxlbmRFcXVhdGlvbk1vZGVBbHBoYSkgOiB1bmRlZmluZWRcbiAgICAgICk7XG4gICAgICBtYXRlcmlhbC5zZXRCbGVuZEZ1bmNGYWN0b3IoQmxlbmQuZnJvbShibGVuZEZ1bmNTcmNGYWN0b3IpLCBCbGVuZC5mcm9tKGJsZW5kRnVuY0RzdEZhY3RvcikpO1xuICAgIH1cblxuICAgIGlmIChpc091dGxpbmUpIHtcbiAgICAgIHN3aXRjaCAodGhpcy5fX2Zsb2F0UHJvcGVydGllcy5fT3V0bGluZUN1bGxNb2RlKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICBtYXRlcmlhbC5jdWxsRmFjZSA9IGZhbHNlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgbWF0ZXJpYWwuY3VsbEZhY2UgPSB0cnVlO1xuICAgICAgICAgIG1hdGVyaWFsLmN1bGxGYWNlQmFjayA9IGZhbHNlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgbWF0ZXJpYWwuY3VsbEZhY2UgPSB0cnVlO1xuICAgICAgICAgIG1hdGVyaWFsLmN1bGxGYWNlQmFjayA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN3aXRjaCAodGhpcy5fX2Zsb2F0UHJvcGVydGllcy5fQ3VsbE1vZGUpIHtcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgIG1hdGVyaWFsLmN1bGxGYWNlID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBtYXRlcmlhbC5jdWxsRmFjZSA9IHRydWU7XG4gICAgICAgICAgbWF0ZXJpYWwuY3VsbEZhY2VCYWNrID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBtYXRlcmlhbC5jdWxsRmFjZSA9IHRydWU7XG4gICAgICAgICAgbWF0ZXJpYWwuY3VsbEZhY2VCYWNrID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBtYXRlcmlhbC56V3JpdGVXaGVuQmxlbmQgPSB0aGlzLl9fZmxvYXRQcm9wZXJ0aWVzLl9aV3JpdGUgPT09IDE7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdXNhYmxlIGJsZW5kIGVxdWF0aW9uIG1vZGUgZm9yIGFscGhhIGJsZW5kaW5nLlxuICAgKiBUaGlzIG1ldGhvZCBkZXRlcm1pbmVzIHRoZSBhcHByb3ByaWF0ZSBibGVuZCBlcXVhdGlvbiBtb2RlIGJhc2VkIG9uXG4gICAqIHRoZSBjdXJyZW50IHJlbmRlcmluZyBBUEkgYW5kIGF2YWlsYWJsZSBleHRlbnNpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcmV0dXJucyBUaGUgYmxlbmQgZXF1YXRpb24gbW9kZSBmb3IgYWxwaGEgY2hhbm5lbFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRVc2FibGVCbGVuZEVxdWF0aW9uTW9kZUFscGhhKGVuZ2luZTogRW5naW5lKTogbnVtYmVyIHtcbiAgICBpZiAoZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIHJldHVybiAzMjc3NjsgLy8gZ2wuTUFYXG4gICAgfVxuICAgIGNvbnN0IHdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5ID0gZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IGdsdyA9IHdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5LmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyO1xuICAgIGNvbnN0IGdsID0gZ2x3IS5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKTtcbiAgICBpZiAoZ2x3IS5pc1dlYkdMMikge1xuICAgICAgcmV0dXJuIGdsLk1BWDtcbiAgICB9XG4gICAgaWYgKGdsdyEud2ViZ2wxRXh0Qk0pIHtcbiAgICAgIHJldHVybiBnbHchLndlYmdsMUV4dEJNLk1BWF9FWFQ7XG4gICAgfVxuICAgIHJldHVybiBnbC5GVU5DX0FERDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGludGVybmFsIHNoYWRlciBwYXJhbWV0ZXJzIGZvciBXZWJHUFUgcmVuZGVyaW5nLlxuICAgKiBUaGlzIG1ldGhvZCBjb25maWd1cmVzIGNhbWVyYS1yZWxhdGVkIGFuZCBJQkwgKEltYWdlLUJhc2VkIExpZ2h0aW5nKSBwYXJhbWV0ZXJzXG4gICAqIHRoYXQgYXJlIG1hbmFnZWQgaW50ZXJuYWxseSBieSB0aGUgbWF0ZXJpYWwgc3lzdGVtLlxuICAgKlxuICAgKiBAcGFyYW0gcGFyYW1zIC0gT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgYW5kIHJlbmRlcmluZyBhcmd1bWVudHNcbiAgICogQHBhcmFtIHBhcmFtcy5tYXRlcmlhbCAtIFRoZSBtYXRlcmlhbCBpbnN0YW5jZSB0byBjb25maWd1cmVcbiAgICogQHBhcmFtIHBhcmFtcy5hcmdzIC0gV2ViR1BVIHJlbmRlcmluZyBhcmd1bWVudHNcbiAgICovXG4gIF9zZXRJbnRlcm5hbFNldHRpbmdQYXJhbWV0ZXJzVG9HcHVXZWJHcHUoe1xuICAgIGVuZ2luZSxcbiAgICBtYXRlcmlhbCxcbiAgICBhcmdzLFxuICB9OiB7XG4gICAgZW5naW5lOiBFbmdpbmU7XG4gICAgbWF0ZXJpYWw6IE1hdGVyaWFsO1xuICAgIGFyZ3M6IFJlbmRlcmluZ0FyZ1dlYkdwdTtcbiAgfSkge1xuICAgIGxldCBjYW1lcmFDb21wb25lbnQgPSBlbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnRGcm9tQ29tcG9uZW50VElEKFxuICAgICAgV2VsbEtub3duQ29tcG9uZW50VElEcy5DYW1lcmFDb21wb25lbnRUSUQsXG4gICAgICBhcmdzLmNhbWVyYUNvbXBvbmVudFNpZFxuICAgICkgYXMgQ2FtZXJhQ29tcG9uZW50O1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignY2FtZXJhVXAnLCBjYW1lcmFDb21wb25lbnQudXBJbm5lcik7XG5cbiAgICBpZiAodGhpcy5fX091dGxpbmVXaWR0aE1vZGVJc1NjcmVlbikge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdhc3BlY3QnLCBjYW1lcmFDb21wb25lbnQuYXNwZWN0KTtcbiAgICB9XG5cbiAgICBjb25zdCB7XG4gICAgICBtaXBtYXBMZXZlbE51bWJlcixcbiAgICAgIG1lc2hSZW5kZXJDb21wb25lbnQsXG4gICAgICBkaWZmdXNlSGRyaVR5cGUsXG4gICAgICBzcGVjdWxhckhkcmlUeXBlLFxuICAgICAgZGlmZnVzZUNvbnRyaWJ1dGlvbixcbiAgICAgIHNwZWN1bGFyQ29udHJpYnV0aW9uLFxuICAgIH0gPSBNVG9vbjB4TWF0ZXJpYWxDb250ZW50Ll9fc2V0dXBIZHJpUGFyYW1ldGVycyhhcmdzKTtcbiAgICBjb25zdCB0bXBfdmVjdG9yNCA9IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fdG1wX3ZlY3RvcjQ7XG4gICAgdG1wX3ZlY3RvcjQueCA9IG1pcG1hcExldmVsTnVtYmVyO1xuICAgIHRtcF92ZWN0b3I0LnkgPSBkaWZmdXNlQ29udHJpYnV0aW9uO1xuICAgIHRtcF92ZWN0b3I0LnogPSBzcGVjdWxhckNvbnRyaWJ1dGlvbjtcbiAgICB0bXBfdmVjdG9yNC53ID0gbWVzaFJlbmRlckNvbXBvbmVudCEucm90YXRpb25PZkN1YmVNYXA7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdpYmxQYXJhbWV0ZXInLCB0bXBfdmVjdG9yNCk7XG4gICAgY29uc3QgdG1wX3ZlY3RvcjIgPSBBYnN0cmFjdE1hdGVyaWFsQ29udGVudC5fX3RtcF92ZWN0b3IyO1xuICAgIHRtcF92ZWN0b3IyLnggPSBkaWZmdXNlSGRyaVR5cGU7XG4gICAgdG1wX3ZlY3RvcjIueSA9IHNwZWN1bGFySGRyaVR5cGU7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdoZHJpRm9ybWF0JywgdG1wX3ZlY3RvcjIpO1xuXG4gICAgY29uc3QgbWVzaFJlbmRlcmVyQ29tcG9uZW50ID0gYXJncy5lbnRpdHkudHJ5VG9HZXRNZXNoUmVuZGVyZXIoKTtcbiAgICBpZiAoXG4gICAgICBtZXNoUmVuZGVyZXJDb21wb25lbnQgIT0gbnVsbCAmJlxuICAgICAgbWVzaFJlbmRlcmVyQ29tcG9uZW50LmRpZmZ1c2VDdWJlTWFwICE9IG51bGwgJiZcbiAgICAgIG1lc2hSZW5kZXJlckNvbXBvbmVudC5zcGVjdWxhckN1YmVNYXAgIT0gbnVsbFxuICAgICkge1xuICAgICAgY29uc3QgaWJsUGFyYW1ldGVyVmVjNCA9IE11dGFibGVWZWN0b3I0Lnplcm8oKTtcbiAgICAgIGNvbnN0IGhkcmlGb3JtYXRWZWMyID0gTXV0YWJsZVZlY3RvcjIuemVybygpO1xuXG4gICAgICBpYmxQYXJhbWV0ZXJWZWM0LnggPSBtZXNoUmVuZGVyZXJDb21wb25lbnQuc3BlY3VsYXJDdWJlTWFwLm1pcG1hcExldmVsTnVtYmVyO1xuICAgICAgaWJsUGFyYW1ldGVyVmVjNC55ID0gbWVzaFJlbmRlcmVyQ29tcG9uZW50LmRpZmZ1c2VDdWJlTWFwQ29udHJpYnV0aW9uO1xuICAgICAgaWJsUGFyYW1ldGVyVmVjNC56ID0gbWVzaFJlbmRlcmVyQ29tcG9uZW50LnNwZWN1bGFyQ3ViZU1hcENvbnRyaWJ1dGlvbjtcbiAgICAgIGlibFBhcmFtZXRlclZlYzQudyA9IG1lc2hSZW5kZXJlckNvbXBvbmVudC5yb3RhdGlvbk9mQ3ViZU1hcDtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignaWJsUGFyYW1ldGVyJywgaWJsUGFyYW1ldGVyVmVjNCk7XG5cbiAgICAgIGhkcmlGb3JtYXRWZWMyLnggPSBtZXNoUmVuZGVyZXJDb21wb25lbnQuZGlmZnVzZUN1YmVNYXAuaGRyaUZvcm1hdC5pbmRleDtcbiAgICAgIGhkcmlGb3JtYXRWZWMyLnkgPSBtZXNoUmVuZGVyZXJDb21wb25lbnQuc3BlY3VsYXJDdWJlTWFwLmhkcmlGb3JtYXQuaW5kZXg7XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2hkcmlGb3JtYXQnLCBoZHJpRm9ybWF0VmVjMik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgc2hhZGVyLXNwZWNpZmljIGludGVybmFsIHBhcmFtZXRlcnMgZm9yIFdlYkdMIHJlbmRlcmluZy5cbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIG9uY2UgcGVyIHNoYWRlciBwcm9ncmFtIGFuZCBzZXRzIHVwXG4gICAqIElCTCBlbnZpcm9ubWVudCB0ZXh0dXJlcyBhbmQgb3RoZXIgcHJvZ3JhbS1sZXZlbCB1bmlmb3Jtcy5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyAtIE9iamVjdCBjb250YWluaW5nIHJlbmRlcmluZyBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBwYXJhbXMuc2hhZGVyUHJvZ3JhbSAtIFRoZSBXZWJHTCBzaGFkZXIgcHJvZ3JhbVxuICAgKiBAcGFyYW0gcGFyYW1zLmFyZ3MgLSBXZWJHTCByZW5kZXJpbmcgYXJndW1lbnRzXG4gICAqL1xuICBfc2V0SW50ZXJuYWxTZXR0aW5nUGFyYW1ldGVyc1RvR3B1V2ViR0xQZXJTaGFkZXJQcm9ncmFtKHtcbiAgICBlbmdpbmUsXG4gICAgbWF0ZXJpYWwsXG4gICAgc2hhZGVyUHJvZ3JhbSxcbiAgICBhcmdzLFxuICB9OiB7XG4gICAgZW5naW5lOiBFbmdpbmU7XG4gICAgbWF0ZXJpYWw6IE1hdGVyaWFsO1xuICAgIHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbTtcbiAgICBhcmdzOiBSZW5kZXJpbmdBcmdXZWJHTDtcbiAgfSkge1xuICAgIGNvbnN0IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5ID0gZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIC8vIElCTCBFbnYgbWFwXG4gICAgY29uc3QgZGlmZnVzZUVudiA9IG1hdGVyaWFsLmdldFRleHR1cmVQYXJhbWV0ZXIoU2hhZGVyU2VtYW50aWNzLkRpZmZ1c2VFbnZUZXh0dXJlLnN0cik7XG4gICAgaWYgKGRpZmZ1c2VFbnYgIT0gbnVsbCkge1xuICAgICAgY29uc3QgZGlmZnVzZUVudlNsb3QgPSBkaWZmdXNlRW52WzBdO1xuICAgICAgaWYgKGFyZ3MuZGlmZnVzZUN1YmU/LmlzVGV4dHVyZVJlYWR5KSB7XG4gICAgICAgIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LnNldFVuaWZvcm0xaUZvclRleHR1cmUoc2hhZGVyUHJvZ3JhbSwgU2hhZGVyU2VtYW50aWNzLkRpZmZ1c2VFbnZUZXh0dXJlLnN0ciwgW1xuICAgICAgICAgIGRpZmZ1c2VFbnZTbG90LFxuICAgICAgICAgIGFyZ3MuZGlmZnVzZUN1YmUsXG4gICAgICAgICAgdGhpcy5fX2RpZmZ1c2VJYmxDdWJlTWFwU2FtcGxlcixcbiAgICAgICAgXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3ZWJnbFJlc291cmNlUmVwb3NpdG9yeS5zZXRVbmlmb3JtMWlGb3JUZXh0dXJlKHNoYWRlclByb2dyYW0sIFNoYWRlclNlbWFudGljcy5EaWZmdXNlRW52VGV4dHVyZS5zdHIsIFtcbiAgICAgICAgICBkaWZmdXNlRW52U2xvdCxcbiAgICAgICAgICBlbmdpbmUuZHVtbXlUZXh0dXJlcy5kdW1teUJsYWNrQ3ViZVRleHR1cmUsXG4gICAgICAgIF0pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBpZiAoYXJncy5zcGVjdWxhckN1YmUgJiYgYXJncy5zcGVjdWxhckN1YmUuaXNUZXh0dXJlUmVhZHkpIHtcbiAgICAvLyAgIHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LnNldFVuaWZvcm0xaUZvclRleHR1cmUoXG4gICAgLy8gICAgIHNoYWRlclByb2dyYW0sXG4gICAgLy8gICAgIFNoYWRlclNlbWFudGljcy5TcGVjdWxhckVudlRleHR1cmUuc3RyLFxuICAgIC8vICAgICBbNywgYXJncy5zcGVjdWxhckN1YmUsIE1Ub29uMHhNYXRlcmlhbENvbnRlbnQuX19zcGVjdWxhcklibEN1YmVNYXBTYW1wbGVyXVxuICAgIC8vICAgKTtcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkuc2V0VW5pZm9ybTFpRm9yVGV4dHVyZShcbiAgICAvLyAgICAgc2hhZGVyUHJvZ3JhbSxcbiAgICAvLyAgICAgU2hhZGVyU2VtYW50aWNzLlNwZWN1bGFyRW52VGV4dHVyZS5zdHIsXG4gICAgLy8gICAgIFs3LCBkdW1teUJsYWNrQ3ViZVRleHR1cmVdXG4gICAgLy8gICApO1xuICAgIC8vIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIG1hdGVyaWFsLXNwZWNpZmljIGludGVybmFsIHBhcmFtZXRlcnMgZm9yIFdlYkdMIHJlbmRlcmluZy5cbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIHBlciBtYXRlcmlhbCBhbmQgY29uZmlndXJlcyBtYXRyaWNlcywgbGlnaHRpbmcsXG4gICAqIG1vcnBoaW5nLCBza2lubmluZywgYW5kIG90aGVyIHBlci1tYXRlcmlhbCB1bmlmb3Jtcy5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyAtIE9iamVjdCBjb250YWluaW5nIHJlbmRlcmluZyBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBwYXJhbXMuZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gcGFyYW1zLm1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIGluc3RhbmNlXG4gICAqIEBwYXJhbSBwYXJhbXMuc2hhZGVyUHJvZ3JhbSAtIFRoZSBXZWJHTCBzaGFkZXIgcHJvZ3JhbVxuICAgKiBAcGFyYW0gcGFyYW1zLmZpcnN0VGltZSAtIFdoZXRoZXIgdGhpcyBpcyB0aGUgZmlyc3QgdGltZSBzZXR1cFxuICAgKiBAcGFyYW0gcGFyYW1zLmFyZ3MgLSBXZWJHTCByZW5kZXJpbmcgYXJndW1lbnRzXG4gICAqL1xuICBfc2V0SW50ZXJuYWxTZXR0aW5nUGFyYW1ldGVyc1RvR3B1V2ViR0xQZXJNYXRlcmlhbCh7XG4gICAgZW5naW5lLFxuICAgIG1hdGVyaWFsLFxuICAgIHNoYWRlclByb2dyYW0sXG4gICAgZmlyc3RUaW1lLFxuICAgIGFyZ3MsXG4gIH06IHtcbiAgICBlbmdpbmU6IEVuZ2luZTtcbiAgICBtYXRlcmlhbDogTWF0ZXJpYWw7XG4gICAgc2hhZGVyUHJvZ3JhbTogV2ViR0xQcm9ncmFtO1xuICAgIGZpcnN0VGltZTogYm9vbGVhbjtcbiAgICBhcmdzOiBSZW5kZXJpbmdBcmdXZWJHTDtcbiAgfSkge1xuICAgIGxldCBjYW1lcmFDb21wb25lbnQgPSBhcmdzLnJlbmRlclBhc3MuY2FtZXJhQ29tcG9uZW50O1xuICAgIGlmIChjYW1lcmFDb21wb25lbnQgPT0gbnVsbCkge1xuICAgICAgY2FtZXJhQ29tcG9uZW50ID0gZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50KFxuICAgICAgICBDYW1lcmFDb21wb25lbnQsXG4gICAgICAgIENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50KGVuZ2luZSlcbiAgICAgICkgYXMgQ2FtZXJhQ29tcG9uZW50O1xuICAgIH1cblxuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignY2FtZXJhVXAnLCBjYW1lcmFDb21wb25lbnQudXBJbm5lcik7XG5cbiAgICBpZiAodGhpcy5fX091dGxpbmVXaWR0aE1vZGVJc1NjcmVlbikge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdhc3BlY3QnLCBjYW1lcmFDb21wb25lbnQuYXNwZWN0KTtcbiAgICB9XG5cbiAgICAvLyBJQkwgUGFyYW1ldGVyc1xuICAgIGNvbnN0IHtcbiAgICAgIG1pcG1hcExldmVsTnVtYmVyLFxuICAgICAgbWVzaFJlbmRlckNvbXBvbmVudCxcbiAgICAgIGRpZmZ1c2VIZHJpVHlwZSxcbiAgICAgIHNwZWN1bGFySGRyaVR5cGUsXG4gICAgICBkaWZmdXNlQ29udHJpYnV0aW9uLFxuICAgICAgc3BlY3VsYXJDb250cmlidXRpb24sXG4gICAgfSA9IE1Ub29uMHhNYXRlcmlhbENvbnRlbnQuX19zZXR1cEhkcmlQYXJhbWV0ZXJzKGFyZ3MpO1xuICAgIGNvbnN0IHRtcF92ZWN0b3I0ID0gQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX190bXBfdmVjdG9yNDtcbiAgICB0bXBfdmVjdG9yNC54ID0gbWlwbWFwTGV2ZWxOdW1iZXI7XG4gICAgdG1wX3ZlY3RvcjQueSA9IGRpZmZ1c2VDb250cmlidXRpb247XG4gICAgdG1wX3ZlY3RvcjQueiA9IHNwZWN1bGFyQ29udHJpYnV0aW9uO1xuICAgIHRtcF92ZWN0b3I0LncgPSBtZXNoUmVuZGVyQ29tcG9uZW50IS5yb3RhdGlvbk9mQ3ViZU1hcDtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2libFBhcmFtZXRlcicsIHRtcF92ZWN0b3I0KTtcbiAgICBjb25zdCB0bXBfdmVjdG9yMiA9IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9fdG1wX3ZlY3RvcjI7XG4gICAgdG1wX3ZlY3RvcjIueCA9IGRpZmZ1c2VIZHJpVHlwZTtcbiAgICB0bXBfdmVjdG9yMi55ID0gc3BlY3VsYXJIZHJpVHlwZTtcbiAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2hkcmlGb3JtYXQnLCB0bXBfdmVjdG9yMik7XG5cbiAgICAvLyBNb3JwaFxuICAgIGNvbnN0IGJsZW5kU2hhcGVDb21wb25lbnQgPSBhcmdzLmVudGl0eS50cnlUb0dldEJsZW5kU2hhcGUoKTtcbiAgICB0aGlzLnNldE1vcnBoSW5mbyhzaGFkZXJQcm9ncmFtLCBhcmdzLmVudGl0eS5nZXRNZXNoKCksIGFyZ3MucHJpbWl0aXZlLCBibGVuZFNoYXBlQ29tcG9uZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBVbml0eSBibGVuZCBtb2RlIGVudW0gdmFsdWVzIHRvIGNvcnJlc3BvbmRpbmcgV2ViR0wgYmxlbmQgY29uc3RhbnRzLlxuICAgKiBUaGlzIG1ldGhvZCBtYXBzIFVuaXR5J3MgYmxlbmQgbW9kZSBlbnVtZXJhdGlvbiB0byB0aGUgYXBwcm9wcmlhdGVcbiAgICogV2ViR0wgYmxlbmQgZnVuY3Rpb24gY29uc3RhbnRzIGZvciBwcm9wZXIgYWxwaGEgYmxlbmRpbmcuXG4gICAqXG4gICAqIEBwYXJhbSBlbnVtTnVtYmVyIC0gVW5pdHkgYmxlbmQgbW9kZSBlbnVtIHZhbHVlXG4gICAqIEByZXR1cm5zIENvcnJlc3BvbmRpbmcgV2ViR0wgYmxlbmQgY29uc3RhbnRcbiAgICovXG4gIHN0YXRpYyB1bml0eUJsZW5kRW51bUNvcnJlc3BvbmRlbmNlKGVudW1OdW1iZXI6IG51bWJlcikge1xuICAgIGxldCByZXN1bHQgPSBHTF9aRVJPIGFzIG51bWJlcjsgLy8gZ2wuWkVST1xuICAgIHN3aXRjaCAoZW51bU51bWJlcikge1xuICAgICAgY2FzZSAwOlxuICAgICAgICByZXN1bHQgPSBHTF9aRVJPO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgcmVzdWx0ID0gR0xfT05FO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgcmVzdWx0ID0gR0xfRFNUX0NPTE9SO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgcmVzdWx0ID0gR0xfU1JDX0NPTE9SO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNDpcbiAgICAgICAgcmVzdWx0ID0gR0xfT05FX01JTlVTX0RTVF9DT0xPUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDU6XG4gICAgICAgIHJlc3VsdCA9IEdMX1NSQ19BTFBIQTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDY6XG4gICAgICAgIHJlc3VsdCA9IEdMX09ORV9NSU5VU19TUkNfQ09MT1I7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA3OlxuICAgICAgICByZXN1bHQgPSBHTF9EU1RfQUxQSEE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA4OlxuICAgICAgICByZXN1bHQgPSBHTF9PTkVfTUlOVVNfRFNUX0FMUEhBO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgOTpcbiAgICAgICAgcmVzdWx0ID0gR0xfU1JDX0FMUEhBX1NBVFVSQVRFO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTA6XG4gICAgICAgIHJlc3VsdCA9IEdMX09ORV9NSU5VU19TUkNfQUxQSEE7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdXAgSERSSSAoSGlnaCBEeW5hbWljIFJhbmdlIEltYWdpbmcpIHBhcmFtZXRlcnMgZm9yIElCTC5cbiAgICogVGhpcyBtZXRob2QgZXh0cmFjdHMgYW5kIHByZXBhcmVzIEhEUkktcmVsYXRlZCBwYXJhbWV0ZXJzIGZyb20gdGhlXG4gICAqIHJlbmRlcmluZyBhcmd1bWVudHMgZm9yIHVzZSBpbiBpbWFnZS1iYXNlZCBsaWdodGluZyBjYWxjdWxhdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBhcmdzIC0gV2ViR0wgb3IgV2ViR1BVIHJlbmRlcmluZyBhcmd1bWVudHNcbiAgICogQHJldHVybnMgT2JqZWN0IGNvbnRhaW5pbmcgSERSSSBwYXJhbWV0ZXJzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3NldHVwSGRyaVBhcmFtZXRlcnMoYXJnczogUmVuZGVyaW5nQXJnV2ViR0wgfCBSZW5kZXJpbmdBcmdXZWJHcHUpIHtcbiAgICBsZXQgbWlwbWFwTGV2ZWxOdW1iZXIgPSAxO1xuICAgIGlmIChhcmdzLnNwZWN1bGFyQ3ViZSkge1xuICAgICAgbWlwbWFwTGV2ZWxOdW1iZXIgPSBhcmdzLnNwZWN1bGFyQ3ViZS5taXBtYXBMZXZlbE51bWJlcjtcbiAgICB9XG4gICAgY29uc3QgbWVzaFJlbmRlckNvbXBvbmVudCA9IGFyZ3MuZW50aXR5LmdldE1lc2hSZW5kZXJlcigpO1xuICAgIGxldCBkaWZmdXNlSGRyaVR5cGUgPSBIZHJpRm9ybWF0LkxEUl9TUkdCLmluZGV4O1xuICAgIGxldCBzcGVjdWxhckhkcmlUeXBlID0gSGRyaUZvcm1hdC5MRFJfU1JHQi5pbmRleDtcbiAgICBpZiAobWVzaFJlbmRlckNvbXBvbmVudC5kaWZmdXNlQ3ViZU1hcCkge1xuICAgICAgZGlmZnVzZUhkcmlUeXBlID0gbWVzaFJlbmRlckNvbXBvbmVudC5kaWZmdXNlQ3ViZU1hcCEuaGRyaUZvcm1hdC5pbmRleDtcbiAgICB9XG4gICAgaWYgKG1lc2hSZW5kZXJDb21wb25lbnQuc3BlY3VsYXJDdWJlTWFwKSB7XG4gICAgICBzcGVjdWxhckhkcmlUeXBlID0gbWVzaFJlbmRlckNvbXBvbmVudC5zcGVjdWxhckN1YmVNYXAhLmhkcmlGb3JtYXQuaW5kZXg7XG4gICAgfVxuICAgIC8vIEFuIHVuc2V0IGN1YmUgbWFwIGJpbmRzIHRoZSBibGFjayBmYWxsYmFjayB0ZXh0dXJlLCBzbyBpdHMgY29udHJpYnV0aW9uIGlzIGVmZmVjdGl2ZWx5IDAuIFBhc3NpbmcgMCB0byB0aGVcbiAgICAvLyBzaGFkZXIgYWxzbyBsZXRzIGl0IHNraXAgdGhlIElCTCB3b3JrIHdoZW4gdGhlIGNvbnRyaWJ1dGlvbiBpcyAwLlxuICAgIGNvbnN0IGRpZmZ1c2VDb250cmlidXRpb24gPVxuICAgICAgbWVzaFJlbmRlckNvbXBvbmVudC5kaWZmdXNlQ3ViZU1hcCAhPSBudWxsID8gbWVzaFJlbmRlckNvbXBvbmVudC5kaWZmdXNlQ3ViZU1hcENvbnRyaWJ1dGlvbiA6IDA7XG4gICAgY29uc3Qgc3BlY3VsYXJDb250cmlidXRpb24gPVxuICAgICAgbWVzaFJlbmRlckNvbXBvbmVudC5zcGVjdWxhckN1YmVNYXAgIT0gbnVsbCA/IG1lc2hSZW5kZXJDb21wb25lbnQuc3BlY3VsYXJDdWJlTWFwQ29udHJpYnV0aW9uIDogMDtcbiAgICByZXR1cm4ge1xuICAgICAgbWlwbWFwTGV2ZWxOdW1iZXIsXG4gICAgICBtZXNoUmVuZGVyQ29tcG9uZW50LFxuICAgICAgZGlmZnVzZUhkcmlUeXBlLFxuICAgICAgc3BlY3VsYXJIZHJpVHlwZSxcbiAgICAgIGRpZmZ1c2VDb250cmlidXRpb24sXG4gICAgICBzcGVjdWxhckNvbnRyaWJ1dGlvbixcbiAgICB9O1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUE7QUFBQSxFQUNFO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLE9BRUs7QUFFUCxPQUFPLGdDQUFnQztBQUN2QyxPQUFPLDhCQUE4QjtBQUVyQyxPQUFPLHNDQUFzQztBQUM3QyxPQUFPLG9DQUFvQztBQUMzQyxTQUFT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QUM7QUEzRFUsd0JBNERLLGdCQUFnQixJQUFJLHFCQUFxQjtBQUFBLEVBQ3ZELEtBQUs7QUFDUCxDQUFDO0FBOURVLHdCQStESyxzQkFBc0IsSUFBSSxxQkFBcUI7QUFBQSxFQUM3RCxLQUFLO0FBQ1AsQ0FBQztBQWpFVSx3QkFtRUssU0FBUyxJQUFJLHFCQUFxQixFQUFFLEtBQUssU0FBUyxDQUFDO0FBbkV4RCx3QkFvRUssV0FBVyxJQUFJLHFCQUFxQixFQUFFLEtBQUssV0FBVyxDQUFDO0FBcEVsRSxJQUFNLHlCQUFOOyIsCiAgIm5hbWVzIjogWyJfX091dGxpbmVXaWR0aE1vZGVJc1NjcmVlbiIsICJfX2Zsb2F0UHJvcGVydGllcyIsICJfX3ZlY3RvclByb3BlcnRpZXMiLCAiX190ZXh0dXJlUHJvcGVydGllcyIsICJfX2RpZmZ1c2VJYmxDdWJlTWFwU2FtcGxlciIsICJfX3NwZWN1bGFySWJsQ3ViZU1hcFNhbXBsZXIiLCAiX19kZWZpbml0aW9ucyIsICJfX3NldER1bW15VGV4dHVyZXMiLCAiX19nZXRVc2FibGVCbGVuZEVxdWF0aW9uTW9kZUFscGhhIiwgIl9fc2V0dXBIZHJpUGFyYW1ldGVycyIsICJfX3RtcF92ZWN0b3I0IiwgIl9fdG1wX3ZlY3RvcjIiXQp9Cg==
