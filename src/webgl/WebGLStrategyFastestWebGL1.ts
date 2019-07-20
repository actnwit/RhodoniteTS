import WebGLResourceRepository, { VertexHandles } from "./WebGLResourceRepository";
import { WebGLExtension } from "./WebGLExtension";
import MemoryManager from "../foundation/core/MemoryManager";
import Buffer from "../foundation/memory/Buffer";
import { MathUtil } from "../foundation/math/MathUtil";
import { PixelFormat } from "../foundation/definitions/PixelFormat";
import { ComponentType } from "../foundation/definitions/ComponentType";
import { TextureParameter } from "../foundation/definitions/TextureParameter";
import GLSLShader from "./shaders/GLSLShader";
import { BufferUse } from "../foundation/definitions/BufferUse";
import WebGLStrategy from "./WebGLStrategy";
import MeshComponent from "../foundation/components/MeshComponent"
import Primitive from "../foundation/geometry/Primitive";
import WebGLContextWrapper from "./WebGLContextWrapper";
import CGAPIResourceRepository from "../foundation/renderer/CGAPIResourceRepository";
import Matrix44 from "../foundation/math/Matrix44";
import { ShaderSemantics, ShaderSemanticsInfo } from "../foundation/definitions/ShaderSemantics";
import ClassicShader from "./shaders/ClassicShader";
import Material from "../foundation/materials/Material";
import { CompositionType } from "../foundation/definitions/CompositionType";
import Component from "../foundation/core/Component";
import SceneGraphComponent from "../foundation/components/SceneGraphComponent";
import Mesh from "../foundation/geometry/Mesh";
import MeshRendererComponent from "../foundation/components/MeshRendererComponent";
import ComponentRepository from "../foundation/core/ComponentRepository";
import { ShaderType } from "../foundation/definitions/ShaderType";
import LightComponent from "../foundation/components/LightComponent";
import Config from "../foundation/core/Config";
import Vector4 from "../foundation/math/Vector4";
import RenderPass from "../foundation/renderer/RenderPass";
import CameraComponent from "../foundation/components/CameraComponent";
import { WebGLResourceHandle, Index, CGAPIResourceHandle } from "../types/CommonTypes";
import CubeTexture from "../foundation/textures/CubeTexture";

export default class WebGLStrategyFastestWebGL1 implements WebGLStrategy {
  private static __instance: WebGLStrategyFastestWebGL1;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __dataTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __lastShader: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private static __shaderProgram: WebGLProgram;
  private __materialSIDLocation?: WebGLUniformLocation;
  private __lightComponents?: LightComponent[];


  private constructor(){}

  get vertexShaderMethodDefinitions_dataTexture() {
    const _texture = ClassicShader.getInstance().glsl_texture;

    return `
  uniform sampler2D u_dataTexture;
  uniform mat4 u_viewMatrix;
  uniform mat4 u_projectionMatrix;
  uniform mat3 u_normalMatrix;

  /*
   * This idea from https://qiita.com/YVT/items/c695ab4b3cf7faa93885
   * arg = vec2(1. / size.x, 1. / size.x / size.y);
   */
  // vec4 fetchElement(sampler2D tex, float index, vec2 arg)
  // {
  //   return ${_texture}( tex, arg * (index + 0.5) );
  // }

  vec4 fetchElement(sampler2D tex, float index, vec2 invSize)
  {
    float t = (index + 0.5) * invSize.x;
    float x = fract(t);
    float y = (floor(t) + 0.5) * invSize.y;
    return ${_texture}( tex, vec2(x, y) );
  }

  mat4 get_worldMatrix(float instanceId)
  {
    float index = ${Component.getLocationOffsetOfMemberOfComponent(SceneGraphComponent, 'worldMatrix')}.0 + 4.0 * instanceId;
    float powWidthVal = ${MemoryManager.bufferWidthLength}.0;
    float powHeightVal = ${MemoryManager.bufferHeightLength}.0;
    vec2 arg = vec2(1.0/powWidthVal, 1.0/powHeightVal);
  //  vec2 arg = vec2(1.0/powWidthVal, 1.0/powWidthVal/powHeightVal);

    vec4 col0 = fetchElement(u_dataTexture, index + 0.0, arg);
    vec4 col1 = fetchElement(u_dataTexture, index + 1.0, arg);
    vec4 col2 = fetchElement(u_dataTexture, index + 2.0, arg);

    mat4 matrix = mat4(
      col0.x, col1.x, col2.x, 0.0,
      col0.y, col1.y, col2.y, 0.0,
      col0.z, col1.z, col2.z, 0.0,
      col0.w, col1.w, col2.w, 1.0
      );

    return matrix;
  }

  mat4 get_viewMatrix(float instanceId) {
    return u_viewMatrix;
  }

  mat4 get_projectionMatrix(float instanceId) {
    return u_projectionMatrix;
  }

  mat3 get_normalMatrix(float instanceId) {
    float index = ${Component.getLocationOffsetOfMemberOfComponent(SceneGraphComponent, 'normalMatrix')}.0 + 3.0 * instanceId;
    float powWidthVal = ${MemoryManager.bufferWidthLength}.0;
    float powHeightVal = ${MemoryManager.bufferHeightLength}.0;
    vec2 arg = vec2(1.0/powWidthVal, 1.0/powHeightVal);
  //  vec2 arg = vec2(1.0/powWidthVal, 1.0/powWidthVal/powHeightVal);

    vec4 col0 = fetchElement(u_dataTexture, index + 0.0, arg);
    vec4 col1 = fetchElement(u_dataTexture, index + 1.0, arg);
    vec4 col2 = fetchElement(u_dataTexture, index + 2.0, arg);

    mat3 matrix = mat3(
      col0.x, col0.y, col0.z,
      col0.w, col1.x, col1.y,
      col1.z, col1.w, col2.x
      );
      // mat3 matrix = mat3(
      //   col0.x, col0.y, col0.z,
      //   col1.x, col1.y, col1.z,
      //   col2.x, col2.y, col2.z
      //   );
  
      // mat3 matrix = mat3(
    //   col0.x, col0.w, col1.z,
    //   col0.y, col1.x, col1.w,
    //   col0.z, col1.y, col2.x
    //   );


    return matrix;
  }

  `;
    }

  setupShaderProgram(meshComponent: MeshComponent): void {
    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    const getOffset = (info: ShaderSemanticsInfo) => {
      let offset = 1;
      switch(info.compositionType) {
        case CompositionType.Mat4:
          offset = 4;
          break;
        case CompositionType.Mat3:
          offset = 3;
          break;
        default:
          // console.error('unknown composition type', info.compositionType.str, memberName);
          // return '';
      }
      return offset;
    }

    const getShaderProperty = (materialTypeName: string, info: ShaderSemanticsInfo, memberName: string) => {
      const returnType = info.compositionType.getGlslStr(info.componentType);

      const indexArray = [];
      let maxIndex = 1;
      let methodName = memberName;
      let index = -1;
      let indexStr;

      if (memberName.indexOf('___') !== -1) {
        if (memberName.indexOf('___0') === -1) {
          return '';
        }
        const offset = getOffset(info);

        for (let i=0; i<info.maxIndex!; i++) {
          const newMemberName = memberName.replace('___0', `___${i}`)
          const index = Material.getLocationOffsetOfMemberOfMaterial(materialTypeName, newMemberName)!;
          indexArray.push(index)
        }
        maxIndex = info.maxIndex!;
        methodName = memberName.split('___')[0];

        let arrayStr = `float indices[${maxIndex}];`
        indexArray.forEach((idx, i)=> {
          arrayStr += `\nindices[${i}] = ${idx}.0;`
        });

        indexStr = `
          ${arrayStr}
          float idx = 0.0;
          for (int i=0; i<${maxIndex}; i++) {
            idx = indices[i] + ${offset}.0 * instanceId;
            if (i == index) {
              break;
            }
          }`;
      } else {
        const offset = getOffset(info);
        index = Material.getLocationOffsetOfMemberOfMaterial(materialTypeName, memberName)!;
        indexStr = `float idx = ${index}.0 + ${offset}.0 * instanceId;`;
      }

      methodName = methodName.replace('.', '_');

      let intStr = '';
      if (info.componentType === ComponentType.Int && info.compositionType !== CompositionType.Scalar) {
        intStr = 'i';
      }

      let str = `
      ${returnType} get_${methodName}(float instanceId, const int index) {
        ${indexStr}
        float powWidthVal = ${MemoryManager.bufferWidthLength}.0;
        float powHeightVal = ${MemoryManager.bufferHeightLength}.0;
        vec2 arg = vec2(1.0/powWidthVal, 1.0/powHeightVal);
        vec4 col0 = fetchElement(u_dataTexture, idx + 0.0, arg);
`;

      switch(info.compositionType) {
        case CompositionType.Vec4:
          str += `        ${intStr}vec4 val = ${intStr}vec4(col0);`; break;
        case CompositionType.Vec3:
          str += `        ${intStr}vec3 val = ${intStr}vec3(col0.xyz);`; break;
        case CompositionType.Vec2:
          str += `        ${intStr}vec2 val = ${intStr}vec2(col0.xy);`; break;
        case CompositionType.Scalar:
          if (info.componentType === ComponentType.Int) {
            str += `        int val = int(col0.x);`;
          } else if (info.componentType === ComponentType.Bool) {
            str += `        bool val = bool(col0.x);`;
          } else {
            str += `        float val = col0.x;`;
          }
          break;
        case CompositionType.Mat4:
          str += `
          vec4 col1 = fetchElement(u_dataTexture, index + 1.0, arg);
          vec4 col2 = fetchElement(u_dataTexture, index + 2.0, arg);
          mat4 val = mat4(
            col0.x, col1.x, col2.x, 0.0,
            col0.y, col1.y, col2.y, 0.0,
            col0.z, col1.z, col2.z, 0.0,
            col0.w, col1.w, col2.w, 1.0
            );
          `; break;
        case CompositionType.Mat3:
          str += `
          vec4 col1 = fetchElement(u_dataTexture, index + 1.0, arg);
          vec4 col2 = fetchElement(u_dataTexture, index + 2.0, arg);
          mat3 val = mat3(
            col0.x, col0.w, col1.z,
            col0.y, col1.x, col1.w,
            col0.z, col1.y, col2.x,
            );
          `; break;
        default:
          // console.error('unknown composition type', info.compositionType.str, memberName);
          return '';
      }

      str += `
          return val;
        }
      `
      return str;
    };

    const primitiveNum = meshComponent.mesh.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent.mesh.getPrimitiveAt(i);
      const material = primitive.material;
      if (material) {
        if (material._shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
          return;
        }

        material.createProgram(this.vertexShaderMethodDefinitions_dataTexture, getShaderProperty);
        this.__webglResourceRepository.setupUniformLocations(material._shaderProgramUid,
          [
            {semantic: ShaderSemantics.ViewMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
              stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: false, isSystem: true},
            {semantic: ShaderSemantics.ProjectionMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
              stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: false, isSystem: true}
          ]);

        material.setUniformLocations(material._shaderProgramUid);
      }
    }
  }



  private __isLoaded(meshComponent: MeshComponent) {
    if (meshComponent.mesh == null) {
      return false;
    }

    if (meshComponent.mesh.variationVBOUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const primitiveNum = meshComponent.mesh.getPrimitiveNumber();
      let count = 0;
      for(let i=0; i<primitiveNum; i++) {
        const primitive = meshComponent.mesh.getPrimitiveAt(i);
        if (primitive.vertexHandles != null) {
          count++;
        }
      }

      if (primitiveNum === count) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }

  }

  $load(meshComponent: MeshComponent) {
    if (this.__isLoaded(meshComponent)) {
      return;
    }

    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    this.setupShaderProgram(meshComponent);

    const primitiveNum = meshComponent.mesh.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent.mesh.getPrimitiveAt(i);
      primitive.create3DAPIVertexData();
    }
    meshComponent.mesh.updateVariationVBO();
  }

  $prerender(meshComponent: MeshComponent, meshRendererComponent: MeshRendererComponent, instanceIDBufferUid: WebGLResourceHandle) {
    if (meshRendererComponent._readyForRendering) {
      return;
    }

    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    if (meshComponent.mesh.isInstanceMesh()) {
      meshRendererComponent._readyForRendering = true;
      return;
    }

    const primitiveNum = meshComponent.mesh.getPrimitiveNumber();
    for(let i=0; i<primitiveNum; i++) {
      const primitive = meshComponent.mesh.getPrimitiveAt(i);
      this.__webglResourceRepository.setVertexDataToPipeline(
        { vaoHandle: meshComponent.mesh.getVaoUids(i), iboHandle: primitive.vertexHandles!.iboHandle, vboHandles: primitive.vertexHandles!.vboHandles},
        primitive, meshComponent.mesh.variationVBOUid);
    }
    meshRendererComponent._readyForRendering = true;
  }

  common_$prerender(): void {

    // Setup Data Texture
    let isHalfFloatMode = false;
    // if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2 ||
    //   this.__webglResourceRepository.currentWebGLContextWrapper!.isSupportWebGL1Extension(WebGLExtension.TextureHalfFloat)) {
    //   isHalfFloatMode = true;
    // }
    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const buffer: Buffer = memoryManager.getBuffer(BufferUse.GPUInstanceData);
    const floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer());
    let halfFloatDataTextureBuffer: Uint16Array;
    if (isHalfFloatMode) {
      halfFloatDataTextureBuffer = new Uint16Array(floatDataTextureBuffer.length);
      let convertLength = buffer.takenSizeInByte / 4; //components
      for (let i=0; i<convertLength; i++) {
        halfFloatDataTextureBuffer[i] = MathUtil.toHalfFloat(floatDataTextureBuffer[i]);
      }
    }

    if (this.__dataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      if (isHalfFloatMode) {
        if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
          this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
            level: 0, width: MemoryManager.bufferWidthLength, height: buffer.takenSizeInByte/MemoryManager.bufferWidthLength/4,
              format: PixelFormat.RGBA, type: ComponentType.Float
            });
        } else {
          this.__webglResourceRepository.updateTexture(this.__dataTextureUid, halfFloatDataTextureBuffer!, {
            level: 0, width: MemoryManager.bufferWidthLength, height: buffer.takenSizeInByte/MemoryManager.bufferWidthLength/4,
              format: PixelFormat.RGBA, type: ComponentType.HalfFloat
            });
        }
      } else {
        if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
          this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
            level:0, width: MemoryManager.bufferWidthLength, height: buffer.takenSizeInByte/MemoryManager.bufferWidthLength/4,
              format: PixelFormat.RGBA, type: ComponentType.Float
            });
        } else {
          this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
            level: 0, width: MemoryManager.bufferWidthLength, height:buffer.takenSizeInByte/MemoryManager.bufferWidthLength/4,
              format: PixelFormat.RGBA, type: ComponentType.Float
            });
        }
      }
      return;
    }

    if (isHalfFloatMode) {

      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
          level: 0, internalFormat: TextureParameter.RGBA16F, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false
          });
      } else {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(halfFloatDataTextureBuffer!, {
          level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.HalfFloat, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false
          });
      }

    } else {
      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
          level: 0, internalFormat: TextureParameter.RGBA32F, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false
          });
      } else {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
          level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
            border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false
          });
      }
    }

    const componentRepository = ComponentRepository.getInstance();
    this.__lightComponents = componentRepository.getComponentsWithType(LightComponent) as LightComponent[];

  }

  attachGPUData(primitive: Primitive): void {
    const material = primitive.material!;
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();
    const dataTexture = this.__webglResourceRepository.getWebGLResource(this.__dataTextureUid)! as WebGLTexture;
    glw.bindTexture2D(0, dataTexture);
    const shaderProgram = this.__webglResourceRepository.getWebGLResource(material._shaderProgramUid);
    var uniform_dataTexture = gl.getUniformLocation(shaderProgram, 'u_dataTexture');
    gl.uniform1i(uniform_dataTexture, 0);
  }

  attachGPUDataInner(gl: WebGLRenderingContext, shaderProgram: WebGLProgram) {
    this.__webglResourceRepository.bindTexture2D(0, this.__dataTextureUid);
    var uniform_dataTexture = gl.getUniformLocation(shaderProgram, 'u_dataTexture');
    gl.uniform1i(uniform_dataTexture, 0);
  }

  attatchShaderProgram(material: Material): void {
    const shaderProgramUid = material._shaderProgramUid;

    if (shaderProgramUid !== this.__lastShader) {
      const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid)! as WebGLProgram;
      gl.useProgram(shaderProgram);
      this.__lastShader = shaderProgramUid;
    }
  }

  attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle) {
  }

  attachVertexDataInner(mesh: Mesh, primitive: Primitive, primitiveIndex: Index, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle) {
    const vertexHandles = primitive.vertexHandles!;
    const vao = this.__webglResourceRepository.getWebGLResource(mesh.getVaoUids(primitiveIndex)) as WebGLVertexArrayObjectOES;
    const gl = glw.getRawContext();

    if (vao != null) {
      glw.bindVertexArray(vao);
    }
    else {
      this.__webglResourceRepository.setVertexDataToPipeline(vertexHandles, primitive, mesh.variationVBOUid);
      const ibo = this.__webglResourceRepository.getWebGLResource(vertexHandles.iboHandle!);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    }
  }

  static getInstance() {
    if (!this.__instance) {
     this.__instance = new (WebGLStrategyFastestWebGL1)();
    }

    return this.__instance;
  }

  private __setupMaterial(material: Material, renderPass: RenderPass) {
    material.setParameter(ShaderSemantics.LightNumber, this.__lightComponents!.length);

    for (let i = 0; i < this.__lightComponents!.length; i++) {
      if (i >= Config.maxLightNumberInShader) {
        break;
      }
      const lightComponent = this.__lightComponents![i];
      const sceneGraphComponent = lightComponent.entity.getSceneGraph();
      const worldLightPosition = sceneGraphComponent.worldPosition;
      const worldLightDirection = lightComponent.direction;
      const worldLightIntensity = lightComponent.intensity;
      material.setParameter(ShaderSemantics.LightPosition, new Vector4(worldLightPosition.x, worldLightPosition.y, worldLightPosition.z, lightComponent.type.index), i);
      material.setParameter(ShaderSemantics.LightDirection, new Vector4(worldLightDirection.x, worldLightDirection.y, worldLightDirection.z, 0), i);
      material.setParameter(ShaderSemantics.LightIntensity, new Vector4(worldLightIntensity.x, worldLightIntensity.y, worldLightIntensity.z, 0), i);
    }
  }

  private __setupMaterialEveryFrame(material: Material, renderPass: RenderPass) {
    let cameraComponent = renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
    }
    if (cameraComponent) {
      const cameraPosition = cameraComponent.worldPosition;
      material.setParameter(ShaderSemantics.ViewPosition, cameraPosition);
    }
  }

  common_$render(primitive_: Primitive, viewMatrix: Matrix44, projectionMatrix: Matrix44, renderPass: RenderPass) {
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();

    // const meshes: Mesh[] = Mesh.originalMeshes;

    for (let meshComponent of renderPass.meshComponents!) {
      const mesh = meshComponent.mesh!;
      if (!(mesh && mesh.isOriginalMesh())) {
        continue;
      }

      const primitiveNum = mesh.getPrimitiveNumber();
      for(let i=0; i<primitiveNum; i++) {
        const primitive = mesh.getPrimitiveAt(i);

        const shaderProgramUid = primitive.material!._shaderProgramUid;
        if (shaderProgramUid === -1) {
          continue;
        }

        this.attachVertexDataInner(mesh, primitive, i, glw, mesh.variationVBOUid);
        if (shaderProgramUid !== this.__lastShader) {
          const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid)! as WebGLProgram;
          gl.useProgram(shaderProgram);

          var uniform_dataTexture = gl.getUniformLocation(shaderProgram, 'u_dataTexture');
          gl.uniform1i(uniform_dataTexture, 7);
          this.__materialSIDLocation = gl.getUniformLocation(shaderProgram, 'u_materialSID');

          this.__setupMaterial(primitive.material!, renderPass);

          WebGLStrategyFastestWebGL1.__shaderProgram = shaderProgram;
          this.__webglResourceRepository.setUniformValue(shaderProgram!, ShaderSemantics.ViewMatrix.str, true, viewMatrix);
          this.__webglResourceRepository.setUniformValue(shaderProgram!, ShaderSemantics.ProjectionMatrix.str, true, projectionMatrix);
        }
        gl.uniform1f(this.__materialSIDLocation, primitive.material!.materialSID);
        this.__webglResourceRepository.bindTexture2D(7, this.__dataTextureUid);

        this.__setupMaterialEveryFrame(primitive.material!, renderPass);

        const meshRendererComponent = meshComponent.entity.getComponent(MeshRendererComponent) as MeshRendererComponent;

        primitive.material!.setUniformValues(true, {
          glw: glw,
          entity: meshComponent.entity,
          lightComponents: this.__lightComponents,
          renderPass: renderPass,
          diffuseCube: meshRendererComponent.diffuseCubeMap,
          specularCube: meshRendererComponent.specularCubeMap
        });

        if (primitive.indicesAccessor) {
          glw.drawElementsInstanced(primitive.primitiveMode.index, primitive.indicesAccessor.elementCount, primitive.indicesAccessor.componentType.index, 0, mesh.instanceCountIncludeOriginal);
        } else {
          glw.drawArraysInstanced(primitive.primitiveMode.index, 0, primitive.getVertexCountAsVerticesBased(), mesh.instanceCountIncludeOriginal);
        }

        this.__lastShader = shaderProgramUid;
      }
    }
    const shaderProgram = WebGLStrategyFastestWebGL1.__shaderProgram;
    this.__webglResourceRepository.setUniformValue(shaderProgram!, ShaderSemantics.ViewMatrix.str, true, viewMatrix);
    this.__webglResourceRepository.setUniformValue(shaderProgram!, ShaderSemantics.ProjectionMatrix.str, true, projectionMatrix);

    return false;
  }

}

