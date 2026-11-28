import{AnimationComponent as E}from"../foundation/components/Animation/AnimationComponent.js";import{BlendShapeComponent as B}from"../foundation/components/BlendShape/BlendShapeComponent.js";import{CameraComponent as $}from"../foundation/components/Camera/CameraComponent.js";import{_getCameraControllerUpdateCount as T}from"../foundation/components/CameraController/CameraControllerUpdateCount.js";import{LightComponent as U}from"../foundation/components/Light/LightComponent.js";import{MeshComponent as W}from"../foundation/components/Mesh/MeshComponent.js";import{SceneGraphComponent as V}from"../foundation/components/SceneGraph/SceneGraphComponent.js";import{TransformComponent as D}from"../foundation/components/Transform/TransformComponent.js";import{Component as M}from"../foundation/core/Component.js";import{AlphaMode as N}from"../foundation/definitions/AlphaMode.js";import{BufferUse as C}from"../foundation/definitions/BufferUse.js";import{ComponentType as I}from"../foundation/definitions/ComponentType.js";import{CompositionType as o}from"../foundation/definitions/CompositionType.js";import{ShaderType as R}from"../foundation/definitions/ShaderType.js";import{VertexAttribute as L}from"../foundation/definitions/VertexAttribute.js";import{Primitive as b}from"../foundation/geometry/Primitive.js";import{getTextureAndSamplerNames as w}from"../foundation/helpers/ShaderHelper.js";import{Logger as G}from"../foundation/misc/Logger.js";import{CGAPIResourceRepository as d}from"../foundation/renderer/CGAPIResourceRepository.js";import{isSkipDrawing as F}from"../foundation/renderer/RenderingCommonMethods.js";import{WebGpuLightClusterBuilder as z}from"./WebGpuLightClusterBuilder.js";var k=class g{constructor(t){this.IB=d.InvalidCGAPIResourceUid;this.SB=d.InvalidCGAPIResourceUid;this.OI=!0;this.jI=-1;this.XI=-1;this.or=-1;this.YI=-1;this.MB=-1;this.nr=-1;this.KI=-1;this.dC=-1;this.sr=-1;this.zI=-1;this.HI=-1;this.qI=-1;this.VI=-1;this.JI=-1;this.gI=-1;this.yI=-1;this.OB=-1;this.QI=-1;this.i=t}static init(t){return new g(t)}static getVertexShaderMethodDefinitions_storageBuffer(t,e){let r="";return M.getMemberInfo(t).forEach((n,s)=>{n.forEach((l,p)=>{var f;if(l.shaderType!==e&&l.shaderType!==R.VertexAndPixelShader)return;let h=(f=M.getComponentCountPerBufferView(t).get(s))!=null?f:1;o.isArray(l.compositionType)?a(l,s,p,h):c(l,s,p,h)})}),r;function a(n,s,l,p){var O,_;let h="",f="";switch(n.compositionType){case o.Vec4Array:h="vec4<f32>",f="fetchVec4";break;case o.Mat4Array:h="mat4x4<f32>",f="fetchMat4";break;case o.Mat4x3Array:h="mat4x3<f32>",f="fetchMat4x3";break;default:throw new Error(`Unsupported composition type: ${n.compositionType.str}`)}let m=n.compositionType.getVec4SizeOfProperty();if(n.isVariableLength===!0){let P=M._variableLengthLocationRadix;r+=`
  fn get_${l}(instanceId: u32, idxOfArray: u32) -> ${h} {
    let location = get_${M._getVariableLengthLocationMemberName(l)}(instanceId);
    let index: u32 = u32(location.x) * ${P}u + u32(location.y) + ${m}u * idxOfArray;
    let value = ${f}(index);
    return value;
  }
  `;return}let y=M.getLocationOffsetOfMemberOfComponent(t,s,l),u=`let arrayLength: u32 = ${(_=(O=M.getArrayLengthOfMember(t).get(s))==null?void 0:O.get(l))!=null?_:0}u;`,x=`rnIndices_${l}`,A=`${x}[instanceIdOfBufferViews] + instanceIdInBufferView * ${m}u * arrayLength + ${m}u * idxOfArray;`,S="";n.convertToBool&&(S="if (value > 0.5) { return true; } else { return false; }"),r+=`
  const ${x}: array<u32, ${y.length}> = array<u32, ${y.length}>(${y.map(P=>`${P}u`).join(", ")});
  fn get_${l}(instanceId: u32, idxOfArray: u32) -> ${n.convertToBool?"bool":h} {
    let instanceIdOfBufferViews = instanceId / ${p};
    let instanceIdInBufferView = instanceId % ${p};
    ${u}
    let index: u32 = ${A};
    let value = ${f}(index);
    ${n.convertToBool?S:"return value;"}
  }
  `}function c(n,s,l,p){let h="",f="";switch(n.compositionType){case o.Mat4:h="mat4x4<f32>",f="fetchMat4";break;case o.Mat3:h="mat3x3<f32>",f="fetchMat3No16BytesAligned";break;case o.Vec4:h="vec4<f32>",f="fetchVec4";break;case o.Vec3:h="vec3<f32>",f="fetchVec3No16BytesAligned";break;case o.Scalar:h="f32",f="fetchScalarNo16BytesAligned";break;default:throw new Error(`Unsupported composition type: ${n.compositionType.str}`)}let m=M.getLocationOffsetOfMemberOfComponent(t,s,l),y=`rnIndices_${l}`,v="";switch(n.compositionType){case o.Mat4:v=`${y}[instanceIdOfBufferViews] + 4u * instanceIdInBufferView;`;break;case o.Mat3:v=`${y}[instanceIdOfBufferViews] * 4u + 9u * instanceIdInBufferView;`;break;case o.Vec4:v=`${y}[instanceIdOfBufferViews] + 1u * instanceIdInBufferView;`;break;case o.Vec3:v=`${y}[instanceIdOfBufferViews] * 4u + 3u * instanceIdInBufferView;`;break;case o.Scalar:v=`${y}[instanceIdOfBufferViews] * 4u + 1u * instanceIdInBufferView;`;break;default:throw new Error(`Unsupported composition type: ${n.compositionType.str}`)}let u="";n.convertToBool&&(u="if (value > 0.5) { return true; } else { return false; }"),r+=`
  const ${y}: array<u32, ${m.length}> = array<u32, ${m.length}>(${m.map(x=>`${x}u`).join(", ")});
  fn get_${l}(instanceId: u32) -> ${n.convertToBool?"bool":h} {
    let instanceIdOfBufferViews = instanceId / ${p};
    let instanceIdInBufferView = instanceId % ${p};
    let index: u32 = ${v};
    let value = ${f}(index);
    ${n.convertToBool?u:"return value;"}
  }
  `}}static C_(t){let e=b.getMorphUniformDataTargetNumbers(),r=`
    const rnMorphUniformDataTargetNumbers: array<u32, ${e.length}> = array<u32, ${e.length}>(${e.map(p=>`${p}u`).join(", ")});
    `,i=b.getMorphUniformDataOffsets(),a=`
    const rnMorphUniformDataOffsets: array<u32, ${i.length}> = array<u32, ${i.length}>(${i.map(p=>`${p}u`).join(", ")});
    `,c=B.getOffsetsInUniform(t),n=`
    const rnBlendShapeUniformDataOffsets: array<u32, ${c.length}> = array<u32, ${c.length}>(${c.map(p=>`${p}u`).join(", ")});
    `,s=t._isPreviousMorphWeightsEnabled?`
    fn get_previousMorphedPosition(vertexId: u32, basePosition: vec3<f32>, blendShapeComponentSID: u32) -> vec3<f32> {
      let currentPrimitiveIdx = uniformDrawParameters.currentPrimitiveIdx;
      let offsetInUniform = rnMorphUniformDataOffsets[currentPrimitiveIdx];
      let offsetInUniform2 = rnBlendShapeUniformDataOffsets[blendShapeComponentSID] + ${B._getPreviousMorphWeightsOffset(t)}u;
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
        position += addPos * morphWeights[idx2 % 4u];
      }
      return position;
    }`:"";return`

    #ifdef RN_IS_VERTEX_SHADER
    #ifdef RN_IS_MORPHING
    ${r}
    ${a}
    ${n}
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
    ${s}
    #endif
  #endif
    `}static A_(t,e){var m,y;let r=e.compositionType.toWGSLType(e.componentType),i=e.semantic.replace(".","_");if(o.isTexture(e.compositionType)){let v="texture_2d<f32>";e.compositionType===o.TextureCube?v="texture_cube<f32>":e.compositionType===o.Texture2DArray&&(v="texture_2d_array<f32>");let{textureName:u,samplerName:x}=w(i);return`
@group(1) @binding(${e.initialValue[0]}) var ${u}: ${v};
@group(2) @binding(${e.initialValue[0]}) var ${x}: sampler;
`}let c=e.compositionType.getVec4SizeOfProperty(),n=e.compositionType.getNumberOfComponents(),s=g.getOffsetOfPropertyOfGlobalDataRepository(t,e.semantic);s===-1&&G.default.error("Could not get the location offset of the property.");let l,p=c;if(l=`  let vec4_idx: u32 = ${s}u + ${p}u * instanceId;
`,o.isArray(e.compositionType)){p=c*((m=e.arrayLength)!=null?m:1);let u=Math.ceil(n/4)*4*((y=e.arrayLength)!=null?y:1);l=`  let vec4_idx: u32 = ${s}u + ${p} * instanceId + ${c}u * idxOfArray;
`,l+=`  let scalar_idx: u32 = ${s*4} + ${u} * instanceId + ${n}u * idxOfArray;
`}let f=`${`
fn get_${i}(instanceId: u32, idxOfArray: u32) -> ${r} {
${l}
`}`;switch(e.compositionType){case o.Vec4:case o.Vec4Array:f+=`  let val = fetchElement(vec4_idx);
`;break;case o.Vec3:f+=`  let col0 = fetchElement(vec4_idx);
`,f+=`  let val = ${r}(col0.xyz);`;break;case o.Vec3Array:f+=`  let val = fetchVec3No16BytesAligned(scalar_idx);
`;break;case o.Vec2:f+=`  let col0 = fetchElement(vec4_idx);
`,f+=`  let val = ${r}(col0.xy);`;break;case o.Vec2Array:f+=`  let val = fetchVec2No16BytesAligned(scalar_idx);
`;break;case o.Scalar:f+=`  let col0 = fetchElement(vec4_idx);
`,e.componentType===I.Int?f+="  let val = i32(col0.x);":e.componentType===I.UnsignedInt?f+="  let val = u32(col0.x);":e.componentType===I.Bool?f+="  let val = col0.x >= 0.5;":f+="  let val = col0.x;";break;case o.ScalarArray:f+=`  let col0 = fetchScalarNo16BytesAligned(scalar_idx);
`,e.componentType===I.Int?f+="  let val = i32(col0);":e.componentType===I.UnsignedInt?f+="  let val = u32(col0);":e.componentType===I.Bool?f+="  let val = col0 >= 0.5;":f+="  let val = col0;";break;case o.Mat4:f+=`  let val = fetchMat4(vec4_idx);
`;break;case o.Mat4Array:f+=`  let val = fetchMat4(vec4_idx);
`;break;case o.Mat3:f+=`  let val = fetchMat3(vec4_idx);
`;break;case o.Mat3Array:f+=`  let val = fetchMat3No16BytesAligned(scalar_idx);
`;break;case o.Mat2:f+=`  let val = fetchMat2(vec4_idx);
`;break;case o.Mat2Array:f+=`  let val = fetchMat2No16BytesAligned(scalar_idx);
`;break;case o.Mat4x3Array:f+=`  let val = fetchMat4x3(vec4_idx);
`;break;default:f+=""}return f+=`
  return val;
}
`,f}static B_(t,e,r){var x,A;let i=r.compositionType.toWGSLType(r.componentType),a=r.semantic.replace(".","_");if(o.isTexture(r.compositionType)){let S="texture_2d<f32>";r.compositionType===o.TextureCube?S="texture_cube<f32>":r.compositionType===o.Texture2DArray&&(S="texture_2d_array<f32>");let{textureName:O,samplerName:_}=w(a);return`
@group(1) @binding(${r.initialValue[0]}) var ${O}: ${S};
@group(2) @binding(${r.initialValue[0]}) var ${_}: sampler;
`}let n=r.compositionType.getVec4SizeOfProperty(),s=r.compositionType.getNumberOfComponents(),l=g.getOffsetOfPropertyOfMaterial(t,r.semantic,e),p=t.materialRepository._getMaterialCountPerBufferView(e),h=`rnOffsets_${a}`,f=`const ${h}: array<u32, ${l.length}> = array<u32, ${l.length}>(${l.map(S=>`${S}u`).join(", ")});`,m,y=n;if(m=`  let vec4_idx: u32 = ${h}[instanceIdOfBufferViews] + ${y}u * instanceIdInBufferView;
`,o.isArray(r.compositionType)){y=n*((x=r.arrayLength)!=null?x:1);let O=Math.ceil(s/4)*4*((A=r.arrayLength)!=null?A:1);m=`  let vec4_idx: u32 = ${h}[instanceIdOfBufferViews] + ${y} * instanceIdInBufferView + ${n}u * idxOfArray;
`,m+=`  let scalar_idx: u32 = ${h}[instanceIdOfBufferViews] * 4 + ${O} * instanceIdInBufferView + ${s}u * idxOfArray;
`}let u=`${`
${f}
fn get_${a}(instanceId: u32, idxOfArray: u32) -> ${i} {
  let instanceIdOfBufferViews = instanceId / ${p};
  let instanceIdInBufferView = instanceId % ${p};
${m}
`}`;switch(r.compositionType){case o.Vec4:case o.Vec4Array:u+=`  let val = fetchElement(vec4_idx);
`;break;case o.Vec3:u+=`  let col0 = fetchElement(vec4_idx);
`,u+=`  let val = ${i}(col0.xyz);`;break;case o.Vec3Array:u+=`  let val = fetchVec3No16BytesAligned(scalar_idx);
`;break;case o.Vec2:u+=`  let col0 = fetchElement(vec4_idx);
`,u+=`  let val = ${i}(col0.xy);`;break;case o.Vec2Array:u+=`  let val = fetchVec2No16BytesAligned(scalar_idx);
`;break;case o.Scalar:u+=`  let col0 = fetchElement(vec4_idx);
`,r.componentType===I.Int?u+="  let val = i32(col0.x);":r.componentType===I.UnsignedInt?u+="  let val = u32(col0.x);":r.componentType===I.Bool?u+="  let val = col0.x >= 0.5;":u+="  let val = col0.x;";break;case o.ScalarArray:u+=`  let col0 = fetchScalarNo16BytesAligned(scalar_idx);
`,r.componentType===I.Int?u+="  let val = i32(col0);":r.componentType===I.UnsignedInt?u+="  let val = u32(col0);":r.componentType===I.Bool?u+="  let val = col0 >= 0.5;":u+="  let val = col0;";break;case o.Mat4:u+=`  let val = fetchMat4(vec4_idx);
`;break;case o.Mat4Array:u+=`  let val = fetchMat4(vec4_idx);
`;break;case o.Mat3:u+=`  let val = fetchMat3(vec4_idx);
`;break;case o.Mat3Array:u+=`  let val = fetchMat3No16BytesAligned(scalar_idx);
`;break;case o.Mat2:u+=`  let val = fetchMat2(vec4_idx);
`;break;case o.Mat2Array:u+=`  let val = fetchMat2No16BytesAligned(scalar_idx);
`;break;case o.Mat4x3Array:u+=`  let val = fetchMat4x3(vec4_idx);
`;break;default:u+=""}return u+=`
  return val;
}
`,u}static getOffsetOfPropertyOfMaterial(t,e,r){return t.materialRepository.getLocationOffsetOfMemberOfMaterial(t,r,e)}static getOffsetOfPropertyOfGlobalDataRepository(t,e){return t.globalDataRepository.getLocationOffsetOfProperty(e)}$load(t){let e=t.mesh;return e==null?!1:(e.isSetUpDone()||e._updateVBOAndVAO(),!0)}common_$load(){this.U_()}U_(){let t=b.getMorphUniformDataOffsets(),e=Math.max(Math.ceil(t[t.length-1]/4)*4*4,4);if(e!==this.VI){let i=this.i.webGpuResourceRepository;if(this.gI!==d.InvalidCGAPIResourceUid&&(i.flush(),i.clearCache(),i.deleteUniformBuffer(this.gI),this.gI=d.InvalidCGAPIResourceUid),this.VI=e,this.gI===d.InvalidCGAPIResourceUid){let a=new Uint32Array(e);this.wI=a,this.gI=i.createUniformMorphOffsetsBuffer(e*4),this.RB()}this.VI=e}let r=B._getMorphWeightsUniformBufferFloatCount(this.i);if(r!==this.JI){let i=this.i.webGpuResourceRepository;if(this.yI!==d.InvalidCGAPIResourceUid&&(i.flush(),i.clearCache(),i.deleteUniformBuffer(this.yI),this.yI=d.InvalidCGAPIResourceUid),this.yI===d.InvalidCGAPIResourceUid){let a=new Float32Array(r);this.II=a,this.yI=i.createUniformMorphWeightsBuffer(r*4),this.HS(!0)}this.JI=r}}wB(t){if(t.mesh==null){W.alertNoMeshSet(t);return}let e=t.mesh.getPrimitiveNumber();for(let r=0;r<e;r++){let i=t.mesh.getPrimitiveAt(r),a=i.material;this._setupShaderProgram(a,i)}}_setupShaderProgram(t,e){if(t!=null&&!t.isShaderProgramReady(e))try{this.setupShaderForMaterial(t,e,g.getVertexShaderMethodDefinitions_storageBuffer(this.i,R.VertexShader),g.getVertexShaderMethodDefinitions_storageBuffer(this.i,R.PixelShader),g.A_,g.B_,g.C_(this.i)),e._backupMaterial()}catch(r){G.default.error(r),e._restoreMaterial(),this.setupShaderForMaterial(e.material,e,g.getVertexShaderMethodDefinitions_storageBuffer(this.i,R.VertexShader),g.getVertexShaderMethodDefinitions_storageBuffer(this.i,R.PixelShader),g.A_,g.B_,g.C_(this.i))}}setupShaderForMaterial(t,e,r,i,a,c,n){t._createProgramWebGpu(this.i,e,r,i,a,c,n)}prerender(){if(E.getIsAnimating(this.i)||D.getUpdateCount(this.i)!==this.nr||V.getUpdateCount(this.i)!==this.KI||$.getCurrentCameraUpdateCount(this.i)!==this.dC||T(this.i)!==this.sr||this.i.materialRepository.stateVersion!==this.jI||this.i.lightClusterSystem.dataVersion!==this.XI||U.getUpdateCount(this.i)!==this.or||this.i._gpuInstanceDataVersion!==this.YI){let e=this._B();this.i.webGpuResourceRepository._markGpuCullingInputsDirty();let r=this.i.lightClusterSystem.dataVersion;(e||r!==this.MB)&&(this.$B(),this.MB=r),this.nr=D.getUpdateCount(this.i),this.KI=V.getUpdateCount(this.i),this.dC=$.getCurrentCameraUpdateCount(this.i),this.sr=T(this.i),this.jI=this.i.materialRepository.stateVersion,this.XI=this.i.lightClusterSystem.dataVersion,this.or=U.getUpdateCount(this.i),this.YI=this.i._gpuInstanceDataVersion}let t=b.getPrimitiveCountHasMorph();t!==this.HI&&(this.VB(),this.HI=t,this.i.webGpuResourceRepository._markGpuCullingInputsDirty()),B.updateCount!==this.zI||B.getCountOfBlendShapeComponents(this.i)!==this.QI?(this.HS(),this.i.webGpuResourceRepository._markGpuCullingInputsDirty(),this.zI=B.updateCount,this.QI=B.getCountOfBlendShapeComponents(this.i),this.i.materialRepository._makeShaderInvalidateToMorphMaterials()):this.O_()}common_$render(t,e,r,i){if(e.isBufferLessRenderingMode())return this.L_(e),!0;let a=!1,c=e.isDepthTest&&e.depthWriteMask,n=this.DB(e);if(n)for(let s=e._lastOpaqueIndex;s>=0;s--)this.renderInner(t[s],e,!0,i,{depthOnly:!0});if(e._toRenderOpaquePrimitives)for(let s=e._lastOpaqueIndex;s>=0;s--){let l=t[s],p=this.renderInner(l,e,c,i,{allowEqualDepth:n});a||(a=p)}if(e._toRenderTranslucentPrimitives)for(let s=e._lastOpaqueIndex+1;s<=e._lastTranslucentIndex;s++){let l=t[s],p=this.renderInner(l,e,c,i);a||(a=p)}if(e._toRenderBlendWithZWritePrimitives)for(let s=e._lastTranslucentIndex+1;s<=e._lastBlendWithZWriteIndex;s++){let l=t[s],p=this.renderInner(l,e,c,i);a||(a=p)}if(e._toRenderBlendWithoutZWritePrimitives)for(let s=e._lastBlendWithZWriteIndex+1;s<=e._lastBlendWithoutZWriteIndex;s++){let l=t[s],p=this.renderInner(l,e,!1,i);a||(a=p)}return a}L_(t){let e=t.material,r=t._dummyPrimitiveForBufferLessRendering;this._setupShaderProgram(e,r);let i=this.i.webGpuResourceRepository,a=this.AB(t,0,!1);i.setDrawParameters(e.materialSID,a,0,0);let c=t.isDepthTest&&t.depthWriteMask;i.draw(this.i,r,e,t,a,c,0)}DB(t){let e=t.getFramebuffer();return this.i.config.isDepthPrepassEnabled&&t.material==null&&t.isDepthTest&&t.depthWriteMask&&(e==null||e.depthAttachment!=null)&&t._toRenderOpaquePrimitives&&t._lastOpaqueIndex>=0}renderInner(t,e,r,i,a={}){var f,m;if(t===-1)return!1;let c=b.getPrimitive(t);if(c==null)return!1;let n=e.getAppropriateMaterial(c);if(this._setupShaderProgram(n,c),F(n,c)||a.depthOnly&&(n.alphaMode===N.Mask||n.alphaToCoverage||n.isShaderDefine("RN_USE_WIREFRAME")))return!1;let s=this.i.webGpuResourceRepository,l=this.i._webXRSystemIfEnabled,p=this.AB(e,i,((f=l==null?void 0:l.isWebXRMode)!=null?f:!1)&&e.isVrRendering),h=(m=b.getPrimitiveIdxHasMorph(c.primitiveUid))!=null?m:0;return s.setDrawParameters(n.materialSID,p,h,c.targets.length),s.draw(this.i,c,n,e,p,r,i,a),!0}_B(){let e=this.i.memoryManager.getBuffers(C.GPUInstanceData),r=e.length,i=this.i.webGpuResourceRepository;if(r!==this.qI&&(this.qI=r,i.destroyStorageBuffer(this.IB),this.IB=d.InvalidCGAPIResourceUid),this.IB!==d.InvalidCGAPIResourceUid){let a=this.i.lightClusterSystem;i.updateStorageBuffer(this.IB,e,a._getExcludedByteRanges());let c=a._takeDirtyByteRanges();return c.length>0&&i.updateStorageBufferRanges(this.IB,e,c),!1}return this.IB=i.createStorageBuffer(e),this.i.lightClusterSystem._takeDirtyByteRanges(),!0}$B(){var a,c;let t=this.i.lightClusterSystem._getGpuBuildParams();if(t==null)return;let e=this.i.webGpuResourceRepository,r=e._getStorageBuffer();if(r==null)return;(c=this[a="BB"])!=null||(this[a]=new z(e.getWebGpuDeviceWrapper().gpuDevice));let i=this.i.gpuTimerEnabled?e._getGpuTimer():void 0;this.BB.build(r,t,i)}VB(){let e=this.i.memoryManager.getBuffers(C.GPUVertexData);if(e.length===0)return;let r=e.reduce((n,s)=>n+s.byteLength,0);r!==this.OB&&(this.i.webGpuResourceRepository.deleteStorageBlendShapeBuffer(this.SB),this.SB=d.InvalidCGAPIResourceUid,this.OB=r);let i=this.i.webGpuResourceRepository,a=new Float32Array(r/4),c=0;for(let n=0;n<e.length;n++){let s=e[n];a.set(new Float32Array(s.getArrayBuffer()),c),c+=s.byteLength/4}if(this.SB!==d.InvalidCGAPIResourceUid){let n=r/4;i.updateStorageBlendShapeBuffer(this.SB,a,n)}else this.SB=i.createStorageBlendShapeBuffer(a);this.RB()}RB(){let t=this.i.webGpuResourceRepository,e=b.getMorphUniformDataOffsets();for(let i=0;i<b.getPrimitiveCountHasMorph();i++){let a=b.getPrimitiveHasMorph(i);if(a!=null)for(let c=0;c<a.targets.length;c++){let s=a.targets[c].get(L.Position.XYZ),l=this.i.memoryManager.getByteOffsetOfExistingBuffers(C.GPUVertexData,s.bufferView.buffer.indexOfTheBufferUsage);this.wI[e[i]+c]=(l+s.byteOffsetInBuffer)/4/4}else break}let r=e[e.length-1];t.updateUniformMorphOffsetsBuffer(this.wI,r)}HS(t=!1){let r=this.i.memoryManager.getBuffer(C.GPUVertexData);if(r==null||r.takenSizeInByte===0)return;let i=B._writeMorphWeightsUniformArray(this.i,this.II,t);this.OI=!1,i>0&&this.YS(i)}YS(t){this.i.webGpuResourceRepository.updateUniformMorphWeightsBuffer(this.II,t)}O_(){if(this.OI||this.II==null)return;this.OI=!0;let t=B._settlePreviousMorphWeights(this.i,this.II);t>0&&this.YS(t)}AB(t,e,r){if(r){let a=this.i._webXRSystemIfEnabled,c=-1;return a!=null&&a.isWebXRMode&&(a.isMultiView()?c=a._getCameraComponentSIDAt(0):c=a._getCameraComponentSIDAt(e)),c}let i=t.cameraComponent;return i==null&&(i=this.i.componentRepository.getComponent($,$.getCurrent(this.i))),i?i.componentSID:-1}destroy(){var e;let t=this.i.webGpuResourceRepository;(e=this.BB)==null||e.destroy(),this.BB=void 0,t._destroyGpuCulling(),this.IB!==d.InvalidCGAPIResourceUid&&(t.destroyStorageBuffer(this.IB),this.IB=d.InvalidCGAPIResourceUid),this.SB!==d.InvalidCGAPIResourceUid&&(t.deleteStorageBlendShapeBuffer(this.SB),this.SB=d.InvalidCGAPIResourceUid),this.gI!==d.InvalidCGAPIResourceUid&&(t.deleteUniformBuffer(this.gI),this.gI=d.InvalidCGAPIResourceUid),this.yI!==d.InvalidCGAPIResourceUid&&(t.deleteUniformBuffer(this.yI),this.yI=d.InvalidCGAPIResourceUid)}};export{k as WebGpuStrategyBasic};
