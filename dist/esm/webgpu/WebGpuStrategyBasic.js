import{AnimationComponent as E}from"../foundation/components/Animation/AnimationComponent.js";import{BlendShapeComponent as b}from"../foundation/components/BlendShape/BlendShapeComponent.js";import{CameraComponent as $}from"../foundation/components/Camera/CameraComponent.js";import{_getCameraControllerUpdateCount as V}from"../foundation/components/CameraController/CameraControllerUpdateCount.js";import{LightComponent as U}from"../foundation/components/Light/LightComponent.js";import{MeshComponent as N}from"../foundation/components/Mesh/MeshComponent.js";import{SceneGraphComponent as P}from"../foundation/components/SceneGraph/SceneGraphComponent.js";import{TransformComponent as D}from"../foundation/components/Transform/TransformComponent.js";import{Component as M}from"../foundation/core/Component.js";import{AlphaMode as W}from"../foundation/definitions/AlphaMode.js";import{BufferUse as _}from"../foundation/definitions/BufferUse.js";import{ComponentType as I}from"../foundation/definitions/ComponentType.js";import{CompositionType as s}from"../foundation/definitions/CompositionType.js";import{ShaderType as O}from"../foundation/definitions/ShaderType.js";import{VertexAttribute as L}from"../foundation/definitions/VertexAttribute.js";import{Primitive as B}from"../foundation/geometry/Primitive.js";import{getTextureAndSamplerNames as w}from"../foundation/helpers/ShaderHelper.js";import{Logger as G}from"../foundation/misc/Logger.js";import{CGAPIResourceRepository as d}from"../foundation/renderer/CGAPIResourceRepository.js";import{isSkipDrawing as F}from"../foundation/renderer/RenderingCommonMethods.js";import{WebGpuLightClusterBuilder as z}from"./WebGpuLightClusterBuilder.js";var k=class g{constructor(t){this.pB=d.InvalidCGAPIResourceUid;this.mB=d.InvalidCGAPIResourceUid;this.HI=-1;this.jI=-1;this.er=-1;this.gB=-1;this.tr=-1;this.YI=-1;this.kb=-1;this.rr=-1;this.FI=-1;this.zI=-1;this.ZI=-1;this.PI=-1;this.KI=-1;this.gI=-1;this.yI=-1;this.vB=-1;this.qI=-1;this.i=t}static init(t){return new g(t)}static getVertexShaderMethodDefinitions_storageBuffer(t,e){let r="";return M.getMemberInfo(t).forEach((c,o)=>{c.forEach((l,p)=>{var f;if(l.shaderType!==e&&l.shaderType!==O.VertexAndPixelShader)return;let h=(f=M.getComponentCountPerBufferView(t).get(o))!=null?f:1;s.isArray(l.compositionType)?i(l,o,p,h):n(l,o,p,h)})}),r;function i(c,o,l,p){var R,C;let h="",f="";switch(c.compositionType){case s.Vec4Array:h="vec4<f32>",f="fetchVec4";break;case s.Mat4Array:h="mat4x4<f32>",f="fetchMat4";break;case s.Mat4x3Array:h="mat4x3<f32>",f="fetchMat4x3";break;default:throw new Error(`Unsupported composition type: ${c.compositionType.str}`)}let m=c.compositionType.getVec4SizeOfProperty();if(c.isVariableLength===!0){let T=M._variableLengthLocationRadix;r+=`
  fn get_${l}(instanceId: u32, idxOfArray: u32) -> ${h} {
    let location = get_${M._getVariableLengthLocationMemberName(l)}(instanceId);
    let index: u32 = u32(location.x) * ${T}u + u32(location.y) + ${m}u * idxOfArray;
    let value = ${f}(index);
    return value;
  }
  `;return}let y=M.getLocationOffsetOfMemberOfComponent(t,o,l),u=`let arrayLength: u32 = ${(C=(R=M.getArrayLengthOfMember(t).get(o))==null?void 0:R.get(l))!=null?C:0}u;`,x=`rnIndices_${l}`,A=`${x}[instanceIdOfBufferViews] + instanceIdInBufferView * ${m}u * arrayLength + ${m}u * idxOfArray;`,S="";c.convertToBool&&(S="if (value > 0.5) { return true; } else { return false; }"),r+=`
  const ${x}: array<u32, ${y.length}> = array<u32, ${y.length}>(${y.map(T=>`${T}u`).join(", ")});
  fn get_${l}(instanceId: u32, idxOfArray: u32) -> ${c.convertToBool?"bool":h} {
    let instanceIdOfBufferViews = instanceId / ${p};
    let instanceIdInBufferView = instanceId % ${p};
    ${u}
    let index: u32 = ${A};
    let value = ${f}(index);
    ${c.convertToBool?S:"return value;"}
  }
  `}function n(c,o,l,p){let h="",f="";switch(c.compositionType){case s.Mat4:h="mat4x4<f32>",f="fetchMat4";break;case s.Mat3:h="mat3x3<f32>",f="fetchMat3No16BytesAligned";break;case s.Vec4:h="vec4<f32>",f="fetchVec4";break;case s.Vec3:h="vec3<f32>",f="fetchVec3No16BytesAligned";break;case s.Scalar:h="f32",f="fetchScalarNo16BytesAligned";break;default:throw new Error(`Unsupported composition type: ${c.compositionType.str}`)}let m=M.getLocationOffsetOfMemberOfComponent(t,o,l),y=`rnIndices_${l}`,v="";switch(c.compositionType){case s.Mat4:v=`${y}[instanceIdOfBufferViews] + 4u * instanceIdInBufferView;`;break;case s.Mat3:v=`${y}[instanceIdOfBufferViews] * 4u + 9u * instanceIdInBufferView;`;break;case s.Vec4:v=`${y}[instanceIdOfBufferViews] + 1u * instanceIdInBufferView;`;break;case s.Vec3:v=`${y}[instanceIdOfBufferViews] * 4u + 3u * instanceIdInBufferView;`;break;case s.Scalar:v=`${y}[instanceIdOfBufferViews] * 4u + 1u * instanceIdInBufferView;`;break;default:throw new Error(`Unsupported composition type: ${c.compositionType.str}`)}let u="";c.convertToBool&&(u="if (value > 0.5) { return true; } else { return false; }"),r+=`
  const ${y}: array<u32, ${m.length}> = array<u32, ${m.length}>(${m.map(x=>`${x}u`).join(", ")});
  fn get_${l}(instanceId: u32) -> ${c.convertToBool?"bool":h} {
    let instanceIdOfBufferViews = instanceId / ${p};
    let instanceIdInBufferView = instanceId % ${p};
    let index: u32 = ${v};
    let value = ${f}(index);
    ${c.convertToBool?u:"return value;"}
  }
  `}}static MC(t){let e=B.getMorphUniformDataTargetNumbers(),r=`
    const rnMorphUniformDataTargetNumbers: array<u32, ${e.length}> = array<u32, ${e.length}>(${e.map(l=>`${l}u`).join(", ")});
    `,a=B.getMorphUniformDataOffsets(),i=`
    const rnMorphUniformDataOffsets: array<u32, ${a.length}> = array<u32, ${a.length}>(${a.map(l=>`${l}u`).join(", ")});
    `,n=b.getOffsetsInUniform(t),c=`
    const rnBlendShapeUniformDataOffsets: array<u32, ${n.length}> = array<u32, ${n.length}>(${n.map(l=>`${l}u`).join(", ")});
    `;return`

    #ifdef RN_IS_VERTEX_SHADER
    #ifdef RN_IS_MORPHING
    ${r}
    ${i}
    ${c}
    fn get_position(vertexId: u32, basePosition: vec3<f32>, blendShapeComponentSID: u32) -> vec3<f32> {
      let currentPrimitiveIdx = uniformDrawParameters.currentPrimitiveIdx;
      let offsetInUniform = rnMorphUniformDataOffsets[currentPrimitiveIdx];
      let offsetInUniform2 = rnBlendShapeUniformDataOffsets[blendShapeComponentSID];
      var position = basePosition;
      let scalar_idx = 3u * vertexId;
      for (var i=0u; i<rnMorphUniformDataTargetNumbers[currentPrimitiveIdx]; i++) {
        let idx = offsetInUniform + i;
        let offsets = uniformMorphOffsets.data[ idx / 4u];
        let offsetPosition = offsets[idx % 4u];

        let basePosIn4bytes = offsetPosition * 4u + scalar_idx;
        let addPos = fetchVec3No16BytesAlignedFromBlendShapeBuffer(basePosIn4bytes);

        let idx2 = offsetInUniform2 + i;
        let morphWeights: vec4f = uniformMorphWeights.data[ idx2 / 4u];
        let morphWeight: f32 = morphWeights[idx2 % 4u];

        position += addPos * morphWeight;
      }

      return position;
    }
    #endif
  #endif
    `}static _C(t,e){var m,y;let r=e.compositionType.toWGSLType(e.componentType),a=e.semantic.replace(".","_");if(s.isTexture(e.compositionType)){let v="texture_2d<f32>";e.compositionType===s.TextureCube?v="texture_cube<f32>":e.compositionType===s.Texture2DArray&&(v="texture_2d_array<f32>");let{textureName:u,samplerName:x}=w(a);return`
@group(1) @binding(${e.initialValue[0]}) var ${u}: ${v};
@group(2) @binding(${e.initialValue[0]}) var ${x}: sampler;
`}let n=e.compositionType.getVec4SizeOfProperty(),c=e.compositionType.getNumberOfComponents(),o=g.getOffsetOfPropertyOfGlobalDataRepository(t,e.semantic);o===-1&&G.default.error("Could not get the location offset of the property.");let l,p=n;if(l=`  let vec4_idx: u32 = ${o}u + ${p}u * instanceId;
`,s.isArray(e.compositionType)){p=n*((m=e.arrayLength)!=null?m:1);let u=Math.ceil(c/4)*4*((y=e.arrayLength)!=null?y:1);l=`  let vec4_idx: u32 = ${o}u + ${p} * instanceId + ${n}u * idxOfArray;
`,l+=`  let scalar_idx: u32 = ${o*4} + ${u} * instanceId + ${c}u * idxOfArray;
`}let f=`${`
fn get_${a}(instanceId: u32, idxOfArray: u32) -> ${r} {
${l}
`}`;switch(e.compositionType){case s.Vec4:case s.Vec4Array:f+=`  let val = fetchElement(vec4_idx);
`;break;case s.Vec3:f+=`  let col0 = fetchElement(vec4_idx);
`,f+=`  let val = ${r}(col0.xyz);`;break;case s.Vec3Array:f+=`  let val = fetchVec3No16BytesAligned(scalar_idx);
`;break;case s.Vec2:f+=`  let col0 = fetchElement(vec4_idx);
`,f+=`  let val = ${r}(col0.xy);`;break;case s.Vec2Array:f+=`  let val = fetchVec2No16BytesAligned(scalar_idx);
`;break;case s.Scalar:f+=`  let col0 = fetchElement(vec4_idx);
`,e.componentType===I.Int?f+="  let val = i32(col0.x);":e.componentType===I.UnsignedInt?f+="  let val = u32(col0.x);":e.componentType===I.Bool?f+="  let val = col0.x >= 0.5;":f+="  let val = col0.x;";break;case s.ScalarArray:f+=`  let col0 = fetchScalarNo16BytesAligned(scalar_idx);
`,e.componentType===I.Int?f+="  let val = i32(col0);":e.componentType===I.UnsignedInt?f+="  let val = u32(col0);":e.componentType===I.Bool?f+="  let val = col0 >= 0.5;":f+="  let val = col0;";break;case s.Mat4:f+=`  let val = fetchMat4(vec4_idx);
`;break;case s.Mat4Array:f+=`  let val = fetchMat4(vec4_idx);
`;break;case s.Mat3:f+=`  let val = fetchMat3(vec4_idx);
`;break;case s.Mat3Array:f+=`  let val = fetchMat3No16BytesAligned(scalar_idx);
`;break;case s.Mat2:f+=`  let val = fetchMat2(vec4_idx);
`;break;case s.Mat2Array:f+=`  let val = fetchMat2No16BytesAligned(scalar_idx);
`;break;case s.Mat4x3Array:f+=`  let val = fetchMat4x3(vec4_idx);
`;break;default:f+=""}return f+=`
  return val;
}
`,f}static AC(t,e,r){var x,A;let a=r.compositionType.toWGSLType(r.componentType),i=r.semantic.replace(".","_");if(s.isTexture(r.compositionType)){let S="texture_2d<f32>";r.compositionType===s.TextureCube?S="texture_cube<f32>":r.compositionType===s.Texture2DArray&&(S="texture_2d_array<f32>");let{textureName:R,samplerName:C}=w(i);return`
@group(1) @binding(${r.initialValue[0]}) var ${R}: ${S};
@group(2) @binding(${r.initialValue[0]}) var ${C}: sampler;
`}let c=r.compositionType.getVec4SizeOfProperty(),o=r.compositionType.getNumberOfComponents(),l=g.getOffsetOfPropertyOfMaterial(t,r.semantic,e),p=t.materialRepository._getMaterialCountPerBufferView(e),h=`rnOffsets_${i}`,f=`const ${h}: array<u32, ${l.length}> = array<u32, ${l.length}>(${l.map(S=>`${S}u`).join(", ")});`,m,y=c;if(m=`  let vec4_idx: u32 = ${h}[instanceIdOfBufferViews] + ${y}u * instanceIdInBufferView;
`,s.isArray(r.compositionType)){y=c*((x=r.arrayLength)!=null?x:1);let R=Math.ceil(o/4)*4*((A=r.arrayLength)!=null?A:1);m=`  let vec4_idx: u32 = ${h}[instanceIdOfBufferViews] + ${y} * instanceIdInBufferView + ${c}u * idxOfArray;
`,m+=`  let scalar_idx: u32 = ${h}[instanceIdOfBufferViews] * 4 + ${R} * instanceIdInBufferView + ${o}u * idxOfArray;
`}let u=`${`
${f}
fn get_${i}(instanceId: u32, idxOfArray: u32) -> ${a} {
  let instanceIdOfBufferViews = instanceId / ${p};
  let instanceIdInBufferView = instanceId % ${p};
${m}
`}`;switch(r.compositionType){case s.Vec4:case s.Vec4Array:u+=`  let val = fetchElement(vec4_idx);
`;break;case s.Vec3:u+=`  let col0 = fetchElement(vec4_idx);
`,u+=`  let val = ${a}(col0.xyz);`;break;case s.Vec3Array:u+=`  let val = fetchVec3No16BytesAligned(scalar_idx);
`;break;case s.Vec2:u+=`  let col0 = fetchElement(vec4_idx);
`,u+=`  let val = ${a}(col0.xy);`;break;case s.Vec2Array:u+=`  let val = fetchVec2No16BytesAligned(scalar_idx);
`;break;case s.Scalar:u+=`  let col0 = fetchElement(vec4_idx);
`,r.componentType===I.Int?u+="  let val = i32(col0.x);":r.componentType===I.UnsignedInt?u+="  let val = u32(col0.x);":r.componentType===I.Bool?u+="  let val = col0.x >= 0.5;":u+="  let val = col0.x;";break;case s.ScalarArray:u+=`  let col0 = fetchScalarNo16BytesAligned(scalar_idx);
`,r.componentType===I.Int?u+="  let val = i32(col0);":r.componentType===I.UnsignedInt?u+="  let val = u32(col0);":r.componentType===I.Bool?u+="  let val = col0 >= 0.5;":u+="  let val = col0;";break;case s.Mat4:u+=`  let val = fetchMat4(vec4_idx);
`;break;case s.Mat4Array:u+=`  let val = fetchMat4(vec4_idx);
`;break;case s.Mat3:u+=`  let val = fetchMat3(vec4_idx);
`;break;case s.Mat3Array:u+=`  let val = fetchMat3No16BytesAligned(scalar_idx);
`;break;case s.Mat2:u+=`  let val = fetchMat2(vec4_idx);
`;break;case s.Mat2Array:u+=`  let val = fetchMat2No16BytesAligned(scalar_idx);
`;break;case s.Mat4x3Array:u+=`  let val = fetchMat4x3(vec4_idx);
`;break;default:u+=""}return u+=`
  return val;
}
`,u}static getOffsetOfPropertyOfMaterial(t,e,r){return t.materialRepository.getLocationOffsetOfMemberOfMaterial(t,r,e)}static getOffsetOfPropertyOfGlobalDataRepository(t,e){return t.globalDataRepository.getLocationOffsetOfProperty(e)}$load(t){let e=t.mesh;return e==null?!1:(e.isSetUpDone()||e._updateVBOAndVAO(),!0)}common_$load(){this.TC()}TC(){let t=B.getMorphUniformDataOffsets(),e=Math.max(Math.ceil(t[t.length-1]/4)*4*4,4);if(e!==this.PI){let i=this.i.webGpuResourceRepository;if(this.gI!==d.InvalidCGAPIResourceUid&&(i.flush(),i.clearCache(),i.deleteUniformBuffer(this.gI),this.gI=d.InvalidCGAPIResourceUid),this.PI=e,this.gI===d.InvalidCGAPIResourceUid){let n=new Uint32Array(e);this.wI=n,this.gI=i.createUniformMorphOffsetsBuffer(e*4),this.IB()}this.PI=e}let r=b.getOffsetsInUniform(this.i),a=Math.max(Math.ceil(r[r.length-1]/4)*4*4,4);if(a!==this.KI){let i=this.i.webGpuResourceRepository;if(this.yI!==d.InvalidCGAPIResourceUid&&(i.flush(),i.clearCache(),i.deleteUniformBuffer(this.yI),this.yI=d.InvalidCGAPIResourceUid),this.yI===d.InvalidCGAPIResourceUid){let n=new Float32Array(a);this.OI=n,this.yI=i.createUniformMorphWeightsBuffer(a*4),this._S()}this.KI=a}}OB(t){if(t.mesh==null){N.alertNoMeshSet(t);return}let e=t.mesh.getPrimitiveNumber();for(let r=0;r<e;r++){let a=t.mesh.getPrimitiveAt(r),i=a.material;this._setupShaderProgram(i,a)}}_setupShaderProgram(t,e){if(t!=null&&!t.isShaderProgramReady(e))try{this.setupShaderForMaterial(t,e,g.getVertexShaderMethodDefinitions_storageBuffer(this.i,O.VertexShader),g.getVertexShaderMethodDefinitions_storageBuffer(this.i,O.PixelShader),g._C,g.AC,g.MC(this.i)),e._backupMaterial()}catch(r){G.default.error(r),e._restoreMaterial(),this.setupShaderForMaterial(e.material,e,g.getVertexShaderMethodDefinitions_storageBuffer(this.i,O.VertexShader),g.getVertexShaderMethodDefinitions_storageBuffer(this.i,O.PixelShader),g._C,g.AC,g.MC(this.i))}}setupShaderForMaterial(t,e,r,a,i,n,c){t._createProgramWebGpu(this.i,e,r,a,i,n,c)}prerender(){if(E.getIsAnimating(this.i)||D.getUpdateCount(this.i)!==this.tr||P.getUpdateCount(this.i)!==this.YI||$.getCurrentCameraUpdateCount(this.i)!==this.kb||V(this.i)!==this.rr||this.i.materialRepository.stateVersion!==this.HI||this.i.lightClusterSystem.dataVersion!==this.jI||U.getUpdateCount(this.i)!==this.er){let e=this.SB();this.i.webGpuResourceRepository._markGpuCullingInputsDirty();let r=this.i.lightClusterSystem.dataVersion;(e||r!==this.gB)&&(this.BB(),this.gB=r),this.tr=D.getUpdateCount(this.i),this.YI=P.getUpdateCount(this.i),this.kb=$.getCurrentCameraUpdateCount(this.i),this.rr=V(this.i),this.HI=this.i.materialRepository.stateVersion,this.jI=this.i.lightClusterSystem.dataVersion,this.er=U.getUpdateCount(this.i)}let t=B.getPrimitiveCountHasMorph();t!==this.zI&&(this.MB(),this.zI=t,this.i.webGpuResourceRepository._markGpuCullingInputsDirty()),(b.updateCount!==this.FI||b.getCountOfBlendShapeComponents(this.i)!==this.qI)&&(this._S(),this.i.webGpuResourceRepository._markGpuCullingInputsDirty(),this.FI=b.updateCount,this.qI=b.getCountOfBlendShapeComponents(this.i),this.i.materialRepository._makeShaderInvalidateToMorphMaterials())}common_$render(t,e,r,a){if(e.isBufferLessRenderingMode())return this.PC(e),!0;let i=!1,n=e.isDepthTest&&e.depthWriteMask,c=this.RB(e);if(c)for(let o=e._lastOpaqueIndex;o>=0;o--)this.renderInner(t[o],e,!0,a,{depthOnly:!0});if(e._toRenderOpaquePrimitives)for(let o=e._lastOpaqueIndex;o>=0;o--){let l=t[o],p=this.renderInner(l,e,n,a,{allowEqualDepth:c});i||(i=p)}if(e._toRenderTranslucentPrimitives)for(let o=e._lastOpaqueIndex+1;o<=e._lastTranslucentIndex;o++){let l=t[o],p=this.renderInner(l,e,n,a);i||(i=p)}if(e._toRenderBlendWithZWritePrimitives)for(let o=e._lastTranslucentIndex+1;o<=e._lastBlendWithZWriteIndex;o++){let l=t[o],p=this.renderInner(l,e,n,a);i||(i=p)}if(e._toRenderBlendWithoutZWritePrimitives)for(let o=e._lastBlendWithZWriteIndex+1;o<=e._lastBlendWithoutZWriteIndex;o++){let l=t[o],p=this.renderInner(l,e,!1,a);i||(i=p)}return i}PC(t){let e=t.material,r=t._dummyPrimitiveForBufferLessRendering;this._setupShaderProgram(e,r);let a=this.i.webGpuResourceRepository,i=this.xB(t,0,!1);a.setDrawParameters(e.materialSID,i,0,0);let n=t.isDepthTest&&t.depthWriteMask;a.draw(this.i,r,e,t,i,n,0)}RB(t){let e=t.getFramebuffer();return this.i.config.isDepthPrepassEnabled&&t.material==null&&t.isDepthTest&&t.depthWriteMask&&(e==null||e.depthAttachment!=null)&&t._toRenderOpaquePrimitives&&t._lastOpaqueIndex>=0}renderInner(t,e,r,a,i={}){var f,m;if(t===-1)return!1;let n=B.getPrimitive(t);if(n==null)return!1;let c=e.getAppropriateMaterial(n);if(this._setupShaderProgram(c,n),F(c,n)||i.depthOnly&&(c.alphaMode===W.Mask||c.alphaToCoverage||c.isShaderDefine("RN_USE_WIREFRAME")))return!1;let o=this.i.webGpuResourceRepository,l=this.i._webXRSystemIfEnabled,p=this.xB(e,a,((f=l==null?void 0:l.isWebXRMode)!=null?f:!1)&&e.isVrRendering),h=(m=B.getPrimitiveIdxHasMorph(n.primitiveUid))!=null?m:0;return o.setDrawParameters(c.materialSID,p,h,n.targets.length),o.draw(this.i,n,c,e,p,r,a,i),!0}SB(){let e=this.i.memoryManager.getBuffers(_.GPUInstanceData),r=e.length,a=this.i.webGpuResourceRepository;if(r!==this.ZI&&(this.ZI=r,a.destroyStorageBuffer(this.pB),this.pB=d.InvalidCGAPIResourceUid),this.pB!==d.InvalidCGAPIResourceUid){let i=this.i.lightClusterSystem;a.updateStorageBuffer(this.pB,e,i._getExcludedByteRanges());let n=i._takeDirtyByteRanges();return n.length>0&&a.updateStorageBufferRanges(this.pB,e,n),!1}return this.pB=a.createStorageBuffer(e),this.i.lightClusterSystem._takeDirtyByteRanges(),!0}BB(){var i,n;let t=this.i.lightClusterSystem._getGpuBuildParams();if(t==null)return;let e=this.i.webGpuResourceRepository,r=e._getStorageBuffer();if(r==null)return;(n=this[i="yB"])!=null||(this[i]=new z(e.getWebGpuDeviceWrapper().gpuDevice));let a=this.i.gpuTimerEnabled?e._getGpuTimer():void 0;this.yB.build(r,t,a)}MB(){let e=this.i.memoryManager.getBuffers(_.GPUVertexData);if(e.length===0)return;let r=e.reduce((c,o)=>c+o.byteLength,0);r!==this.vB&&(this.i.webGpuResourceRepository.deleteStorageBlendShapeBuffer(this.mB),this.mB=d.InvalidCGAPIResourceUid,this.vB=r);let a=this.i.webGpuResourceRepository,i=new Float32Array(r/4),n=0;for(let c=0;c<e.length;c++){let o=e[c];i.set(new Float32Array(o.getArrayBuffer()),n),n+=o.byteLength/4}if(this.mB!==d.InvalidCGAPIResourceUid){let c=r/4;a.updateStorageBlendShapeBuffer(this.mB,i,c)}else this.mB=a.createStorageBlendShapeBuffer(i);this.IB()}IB(){let t=this.i.webGpuResourceRepository,e=B.getMorphUniformDataOffsets();for(let a=0;a<B.getPrimitiveCountHasMorph();a++){let i=B.getPrimitiveHasMorph(a);if(i!=null)for(let n=0;n<i.targets.length;n++){let o=i.targets[n].get(L.Position.XYZ),l=this.i.memoryManager.getByteOffsetOfExistingBuffers(_.GPUVertexData,o.bufferView.buffer.indexOfTheBufferUsage);this.wI[e[a]+n]=(l+o.byteOffsetInBuffer)/4/4}else break}let r=e[e.length-1];t.updateUniformMorphOffsetsBuffer(this.wI,r)}_S(){let e=this.i.memoryManager.getBuffer(_.GPUVertexData);if(e==null||e.takenSizeInByte===0)return;let r=b.getOffsetsInUniform(this.i),a=this.i.componentRepository.getComponentsWithTypeWithoutFiltering(b);for(let i=0;i<a.length;i++){let n=a[i],c=n!=null?n.weights:[];for(let o=0;o<c.length;o++)this.OI[r[i]+o]=c[o]}if(a.length>0){let i=this.i.webGpuResourceRepository,n=r[r.length-1];i.updateUniformMorphWeightsBuffer(this.OI,n)}}xB(t,e,r){if(r){let i=this.i._webXRSystemIfEnabled,n=-1;return i!=null&&i.isWebXRMode&&(i.isMultiView()?n=i._getCameraComponentSIDAt(0):n=i._getCameraComponentSIDAt(e)),n}let a=t.cameraComponent;return a==null&&(a=this.i.componentRepository.getComponent($,$.getCurrent(this.i))),a?a.componentSID:-1}destroy(){var e;let t=this.i.webGpuResourceRepository;(e=this.yB)==null||e.destroy(),this.yB=void 0,t._destroyGpuCulling(),this.pB!==d.InvalidCGAPIResourceUid&&(t.destroyStorageBuffer(this.pB),this.pB=d.InvalidCGAPIResourceUid),this.mB!==d.InvalidCGAPIResourceUid&&(t.deleteStorageBlendShapeBuffer(this.mB),this.mB=d.InvalidCGAPIResourceUid),this.gI!==d.InvalidCGAPIResourceUid&&(t.deleteUniformBuffer(this.gI),this.gI=d.InvalidCGAPIResourceUid),this.yI!==d.InvalidCGAPIResourceUid&&(t.deleteUniformBuffer(this.yI),this.yI=d.InvalidCGAPIResourceUid)}};export{k as WebGpuStrategyBasic};
