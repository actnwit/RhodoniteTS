import{BlendShapeComponent as q}from"../foundation/components/BlendShape/BlendShapeComponent.js";import{SkeletalComponent as M}from"../foundation/components/Skeletal/SkeletalComponent.js";import{Component as C}from"../foundation/core/Component.js";import{ComponentType as P}from"../foundation/definitions/ComponentType.js";import{Mesh as ee}from"../foundation/geometry/Mesh.js";import{Primitive as S}from"../foundation/geometry/Primitive.js";import{DirtyRange as j}from"./DirtyRange.js";import{GpuDeformChunkSize as Y,GpuDeformRegistry as te}from"./GpuDeformRegistry.js";import{boneDecodeWgsl as re}from"./shaderity_shaders/common/boneDecode.js";var ie=`
${re.code}

struct DeformChunk {
  srcBase: u32,               // the index of the first source vertex of the chunk
  vertexCount: u32,           // the number of vertices of the chunk (0 for an unused chunk slot)
  dstBase: u32,               // the index of the first deformed vertex of the chunk
  boundsSlot: u32,            // the bounding box of the instance
  boneDataLocationIndex: u32, // vec4 index of the boneDataLocation of the skeleton in data, or INVALID
  boneDataInfoIndex: u32,     // vec4 index of the boneDataInfo of the skeleton in data
  morphOffsetBase: u32,       // index of the morph target offsets of the primitive in morphOffsets
  morphTargetCount: u32,      // the number of morph targets applied (0: no morphing)
  morphWeightBase: u32,       // index of the weights of the blend shape component in morphWeights
  pad0: u32,
  pad1: u32,
  pad2: u32,
}

struct Params {
  chunkCount: u32,
  chunksPerRow: u32,
  pad0: u32,
  pad1: u32,
}

@group(0) @binding(0) var<storage, read> data: array<vec4<f32>>;
@group(0) @binding(1) var<uniform> params: Params;
// 4 vec4 per vertex: [position.xyz, morph vertex index (u32)], [normal.xyz, 0], [joints (u32)], [weights]
@group(0) @binding(2) var<storage, read> sources: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read> chunks: array<DeformChunk>;
// The buffers of the morph targets, shared with the vertex shaders (uniformMorphOffsets, uniformMorphWeights)
@group(0) @binding(4) var<storage, read> blendShapeData: array<f32>;
@group(0) @binding(5) var<storage, read> morphOffsets: array<u32>;
@group(0) @binding(6) var<storage, read> morphWeights: array<f32>;
// 2 vec4 per vertex: [the skinned position (with the w of the skinning matrix product)], [normal.xyz, 0]
@group(0) @binding(7) var<storage, read_write> deformed: array<vec4<f32>>;
// 8 u32 per instance: [~min.xyz, 0, max.xyz, 0] encoded by encodeOrderedFloat
@group(0) @binding(8) var<storage, read_write> bounds: array<atomic<u32>>;

const INVALID: u32 = 0xffffffffu;
const LOCATION_RADIX: u32 = ${C._variableLengthLocationRadix}u;

var<workgroup> localBounds: array<atomic<u32>, 6>;

// A u32 whose unsigned order is the order of the floats (GpuDeformRegistry.encodeOrderedFloat)
fn encodeOrderedFloat(value: f32) -> u32 {
  let bits = bitcast<u32>(value);
  return select(bits | 0x80000000u, ~bits, (bits & 0x80000000u) != 0u);
}

fn boneMatrix(boneDataBase: u32, jointIdx: u32, boneDataType: i32, boneDataInfo: vec4<f32>) -> mat4x4<f32> {
  let chunkCount = boneDataChunkCountOfJoint(boneDataType);
  let base = boneDataBase + jointIdx * chunkCount;
  let c0 = data[base];
  var c1 = vec4<f32>(0.0);
  var c2 = vec4<f32>(0.0);
  if (chunkCount >= 2u) {
    c1 = data[base + 1u];
  }
  if (chunkCount >= 3u) {
    c2 = data[base + 2u];
  }
  return decodeBoneMatrix(boneDataType, c0, c1, c2, boneDataInfo);
}

@compute @workgroup_size(64)
fn deform(@builtin(workgroup_id) workgroupId: vec3<u32>, @builtin(local_invocation_index) lid: u32) {
  // c is uniform in the workgroup, so this return keeps the barrier below in uniform control flow.
  let c = workgroupId.y * params.chunksPerRow + workgroupId.x;
  if (c >= params.chunkCount) {
    return;
  }
  let chunk = chunks[c];
  if (lid < chunk.vertexCount) {
    let src = (chunk.srcBase + lid) * 4u;
    let source0 = sources[src];
    var positionInLocal = source0.xyz;
    var normal = sources[src + 1u].xyz;

    // The morphing of get_position (WebGpuStrategyBasic)
    let vertexId = bitcast<u32>(source0.w);
    for (var i = 0u; i < chunk.morphTargetCount; i = i + 1u) {
      let base = morphOffsets[chunk.morphOffsetBase + i] * 4u + 3u * vertexId;
      let delta = vec3<f32>(blendShapeData[base], blendShapeData[base + 1u], blendShapeData[base + 2u]);
      positionInLocal += delta * morphWeights[chunk.morphWeightBase + i];
    }

    // The skinning of processGeometry
    var position = vec4<f32>(positionInLocal, 1.0);
    if (chunk.boneDataLocationIndex != INVALID) {
      let location = data[chunk.boneDataLocationIndex];
      let boneDataBase = u32(location.x) * LOCATION_RADIX + u32(location.y);
      let boneDataInfo = data[chunk.boneDataInfoIndex];
      let boneDataType = i32(boneDataInfo.w + 0.5);
      let joint = bitcast<vec4<u32>>(sources[src + 2u]);
      let weight = sources[src + 3u];
      var skinMat: mat4x4<f32> = weight.x * boneMatrix(boneDataBase, joint.x, boneDataType, boneDataInfo);
      skinMat += weight.y * boneMatrix(boneDataBase, joint.y, boneDataType, boneDataInfo);
      skinMat += weight.z * boneMatrix(boneDataBase, joint.z, boneDataType, boneDataInfo);
      skinMat += weight.w * boneMatrix(boneDataBase, joint.w, boneDataType, boneDataInfo);
      position = skinMat * position;
      normal = toNormalMatrix(skinMat) * normal;
    }

    let dst = (chunk.dstBase + lid) * 2u;
    deformed[dst] = position;
    deformed[dst + 1u] = vec4<f32>(normal, 0.0);

    // The vertex shaders transform the homogeneous position, so the bounds are those of the projected point.
    let point = select(position.xyz, position.xyz / position.w, position.w != 0.0);
    atomicMax(&localBounds[0], ~encodeOrderedFloat(point.x));
    atomicMax(&localBounds[1], ~encodeOrderedFloat(point.y));
    atomicMax(&localBounds[2], ~encodeOrderedFloat(point.z));
    atomicMax(&localBounds[3], encodeOrderedFloat(point.x));
    atomicMax(&localBounds[4], encodeOrderedFloat(point.y));
    atomicMax(&localBounds[5], encodeOrderedFloat(point.z));
  }
  workgroupBarrier();
  if (lid < 6u && chunk.vertexCount > 0u) {
    let slot = chunk.boundsSlot * 8u + select(lid, lid + 1u, lid >= 3u);
    atomicMax(&bounds[slot], atomicLoad(&localBounds[lid]));
  }
}
`,ne=65535,I=64,H=I/4,J=32,z=32,V=48,U=V/4,X=16,T=4294967295,$={sourceVertices:8192,deformedVertices:16384,bounds:256,chunks:1024},oe={};function v(G,e){for(let t of G.attributeSemantics)if(t.split(".")[0]===e)return G.getAttribute(t)}var B=class{constructor(e){this.__componentCount=0;this.__byteSize=4;this.__scale=1;this.__isSigned=!1;this.__isNormalized=!1;if(this.__accessor=e,e===void 0)return;this.__componentCount=Math.min(e.numberOfComponents,4),this.__byteSize=e.componentSizeInBytes;let t=e.componentType,r=e.numberOfComponents===2||e.numberOfComponents===4;e.normalized&&r&&(t===P.UnsignedByte?(this.__isNormalized=!0,this.__scale=255):t===P.Byte?(this.__isNormalized=!0,this.__scale=127,this.__isSigned=!0):t===P.UnsignedShort?(this.__isNormalized=!0,this.__scale=65535):t===P.Short&&(this.__isNormalized=!0,this.__scale=32767,this.__isSigned=!0))}get exists(){return this.__accessor!==void 0}read(e,t){let r=this.__accessor;if(r===void 0||t>=this.__componentCount)return t===3?1:0;let i=r.getScalarAt(e,t*this.__byteSize,oe);if(!this.__isNormalized)return i;let n=i/this.__scale;return this.__isSigned?Math.max(n,-1):n}},K=class{constructor(e){this.__paramsArray=new Uint32Array(X/4);this.__sourcesDirty=new j;this.__chunksDirty=new j;this.__entryInfos=new Map;this.__version=0;this.__lastDispatchedVersion=-1;this.__resetRequested=!1;this.__lastPositionUpdateVersion=-1;this.__device=e,this.__registry=new te($);let t="read-only-storage",r=[t,"uniform",t,t,t,t,t,"storage","storage"],i=e.createBindGroupLayout({label:"GpuSkinning.deform",entries:r.map((u,o)=>({binding:o,visibility:GPUShaderStage.COMPUTE,buffer:{type:u}}))}),n=e.createComputePipeline({label:"GpuSkinning.deform",layout:e.createPipelineLayout({bindGroupLayouts:[i]}),compute:{module:e.createShaderModule({label:"GpuSkinning.deform",code:ie}),entryPoint:"deform"}});this.__stage={layout:i,pipeline:n,bindGroupBuffers:[]},this.__paramsBuffer=e.createBuffer({label:"GpuSkinning.params",size:X,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.__dummyBuffer=e.createBuffer({label:"GpuSkinning.dummy",size:16,usage:GPUBufferUsage.STORAGE}),this.__createTables($)}get registry(){return this.__registry}get deformedVerticesBuffer(){return this.__deformedBuffer}get boundsBuffer(){return this.__boundsBuffer}get hasEntries(){return this.__registry.entryCount>0}get isChanged(){return this.__version!==this.__lastDispatchedVersion}get isOverflowed(){return this.__registry.isOverflowed}get isResetRequested(){return this.__resetRequested}get capacities(){return this.__registry.capacities}acquire(e,t,r){let i=[],n=[],u=t.getPrimitiveNumber();for(let f=0;f<u;f++){let h=t.getPrimitiveAt(f),s=v(h,"POSITION");if(s===void 0)return;i.push(h),n.push(s.elementCount)}let o=this.__registry.acquire(r,n,r.length/4);if(o!==void 0){if(o.isNew){let f={engine:e,mesh:t,entityInfo:r,primitives:i,positionUpdateCount:t.primitivePositionUpdateCount,morphPrimitiveCount:-1,blendShapeOffsets:[]};this.__entryInfos.set(o.entry,f),this.__writeSources(o.entry,f),this.__writeChunks(o.entry,f),this.__version++}return o.entry}}release(e){if(!this.__registry.release(e))return;this.__entryInfos.delete(e);let t=this.__chunksU32;for(let r=0;r<e.chunkCount;r++)t[(e.chunkBase+r)*U+1]=0;this.__chunksDirty.add(e.chunkBase,e.chunkBase+e.chunkCount),this.__version++}getPrimitiveOffset(e,t){let r=this.__entryInfos.get(e);if(r===void 0)return;let i=r.primitives.indexOf(t);return i<0?void 0:e.primitiveOffsets[i]}getInstanceDeformedBase(e,t){return e.deformedBase+t*e.vertexCount}getInstanceBoundsSlot(e,t){return e.boundsBase+t}refresh(){let e=ee._primitivePositionUpdateVersion;e!==this.__lastPositionUpdateVersion&&(this.__lastPositionUpdateVersion=e,this.__refreshChangedSources()),this.__refreshMorphLayouts()}encode(e,t,r,i){var p,k,D;let n=this.__registry;if(n.entryCount===0)return!1;let u=this.__device;this.__uploadDirty(this.__sourcesBuffer,this.__sourcesU32,this.__sourcesDirty,H),this.__uploadDirty(this.__chunksBuffer,this.__chunksU32,this.__chunksDirty,U);let o=n.chunkHighWater,f=Math.max(1,Math.min(o,ne)),h=this.__paramsArray;h[0]=o,h[1]=f,u.queue.writeBuffer(this.__paramsBuffer,0,h);let s=this.__stage,d=[t,this.__paramsBuffer,this.__sourcesBuffer,this.__chunksBuffer,(p=r.blendShapeData)!=null?p:this.__dummyBuffer,(k=r.morphOffsets)!=null?k:this.__dummyBuffer,(D=r.morphWeights)!=null?D:this.__dummyBuffer,this.__deformedBuffer,this.__boundsBuffer],g=s.bindGroup!=null;for(let _=0;_<d.length&&g;_++)g=s.bindGroupBuffers[_]===d[_];g||(s.bindGroup=u.createBindGroup({label:"GpuSkinning.deform",layout:s.layout,entries:d.map((_,O)=>({binding:O,resource:{buffer:_}}))}),s.bindGroupBuffers=d),e.clearBuffer(this.__boundsBuffer,0,n.boundsHighWater*z);let b={label:"GpuSkinning"},c=i==null?void 0:i.getTimestampWrites("GpuSkinning");c!=null&&(b.timestampWrites=c);let a=e.beginComputePass(b);return o>0&&(a.setPipeline(s.pipeline),a.setBindGroup(0,s.bindGroup),a.dispatchWorkgroups(f,Math.ceil(o/f))),a.end(),this.__lastDispatchedVersion=this.__version,!0}getGrownCapacities(){let e=this.__registry;if(!e.isOverflowed)return;let t=e.requiredCapacities,r=e.capacities,i=this.__device.limits,n=Math.min(i.maxStorageBufferBindingSize,i.maxBufferSize),u=(f,h,s)=>{let d=f;for(;d<h*1.25;)d*=2;return Math.max(f,Math.min(d,Math.floor(n/s)))},o={sourceVertices:u(r.sourceVertices,t.sourceVertices,I),deformedVertices:u(r.deformedVertices,t.deformedVertices,J),bounds:u(r.bounds,t.bounds,z),chunks:u(r.chunks,t.chunks,V)};if(!(o.sourceVertices===r.sourceVertices&&o.deformedVertices===r.deformedVertices&&o.bounds===r.bounds&&o.chunks===r.chunks))return o}reset(e){this.__destroyTables(),this.__createTables(e),this.__registry.reset(e),this.__entryInfos.clear(),this.__resetRequested=!1,this.__version++}destroy(){this.__destroyTables(),this.__paramsBuffer.destroy(),this.__dummyBuffer.destroy()}__createTables(e){let t=this.__device;this.__sourcesBuffer=t.createBuffer({label:"GpuSkinning.sources",size:e.sourceVertices*I,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.__chunksBuffer=t.createBuffer({label:"GpuSkinning.chunks",size:e.chunks*V,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.__deformedBuffer=t.createBuffer({label:"GpuSkinning.deformedVertices",size:e.deformedVertices*J,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.__boundsBuffer=t.createBuffer({label:"GpuSkinning.bounds",size:e.bounds*z,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC});let r=new ArrayBuffer(e.sourceVertices*I);this.__sourcesU32=new Uint32Array(r),this.__sourcesF32=new Float32Array(r),this.__chunksU32=new Uint32Array(e.chunks*U),this.__sourcesDirty.clear(),this.__chunksDirty.clear(),this.__chunksDirty.add(0,e.chunks),this.__stage.bindGroup=void 0,this.__stage.bindGroupBuffers=[]}__destroyTables(){var e,t,r,i;(e=this.__sourcesBuffer)==null||e.destroy(),(t=this.__chunksBuffer)==null||t.destroy(),(r=this.__deformedBuffer)==null||r.destroy(),(i=this.__boundsBuffer)==null||i.destroy()}__uploadDirty(e,t,r,i){if(r.isEmpty)return;let n=r.min*i,u=Math.min(r.max*i,t.length);this.__device.queue.writeBuffer(e,n*4,t,n,u-n),r.clear()}__writeSources(e,t){let r=this.__sourcesU32,i=this.__sourcesF32;for(let n=0;n<t.primitives.length;n++){let u=t.primitives[n],o=new B(v(u,"POSITION")),f=new B(v(u,"NORMAL")),h=new B(v(u,"JOINTS_0")),s=new B(v(u,"WEIGHTS_0")),d=new B(v(u,"BARY_CENTRIC_COORD")),g=e.sourceBase+e.primitiveOffsets[n],b=e.primitiveVertexCounts[n];for(let c=0;c<b;c++){let a=(g+c)*H;i[a]=o.read(c,0),i[a+1]=o.read(c,1),i[a+2]=o.read(c,2),r[a+3]=d.exists?Math.max(0,Math.trunc(d.read(c,3))):c,f.exists?(i[a+4]=f.read(c,0),i[a+5]=f.read(c,1),i[a+6]=f.read(c,2)):(i[a+4]=0,i[a+5]=0,i[a+6]=0),i[a+7]=0;for(let p=0;p<4;p++)r[a+8+p]=h.exists?Math.max(0,Math.trunc(h.read(c,p))):0,i[a+12+p]=s.exists?s.read(c,p):0}}this.__sourcesDirty.add(e.sourceBase,e.sourceBase+e.vertexCount)}__writeChunks(e,t){var d,g,b,c;let r=t.engine,i=t.entityInfo;t.morphPrimitiveCount=S.getPrimitiveCountHasMorph(),t.blendShapeOffsets=q.getOffsetsInUniform(r);let n=S.getMorphUniformDataOffsets(),u=t.blendShapeOffsets,o=(d=C.getComponentCountPerBufferView(r).get(M))!=null?d:1,f=C.getLocationOffsetOfMemberOfComponent(r,M,C._getVariableLengthLocationMemberName("boneData")),h=C.getLocationOffsetOfMemberOfComponent(r,M,"boneDataInfo"),s=this.__chunksU32;for(let a=0;a<e.instanceCount;a++){let p=i[4*a+1],k=i[4*a+2],D=T,_=0;if(p!==T){let l=Math.floor(p/o),x=p%o;D=((g=f[l])!=null?g:0)+x,_=((b=h[l])!=null?b:0)+x}let O=this.getInstanceDeformedBase(e,a),Q=this.getInstanceBoundsSlot(e,a),A=e.chunkBase+a*e.chunkCountPerInstance;for(let l=0;l<t.primitives.length;l++){let x=t.primitives[l],E=0,R=0,L=0,N=x.targets.length,W=S.getPrimitiveIdxHasMorph(x.primitiveUid);if(N>0&&k!==T&&W!==void 0){let y=u[k];y!==void 0&&(E=(c=n[W])!=null?c:0,R=N,L=y)}let F=e.primitiveOffsets[l],Z=e.primitiveVertexCounts[l];for(let y=0;y<e.primitiveChunkCounts[l];y++){let w=y*Y,m=A*U;s[m]=e.sourceBase+F+w,s[m+1]=Math.min(Y,Z-w),s[m+2]=O+F+w,s[m+3]=Q,s[m+4]=D,s[m+5]=_,s[m+6]=E,s[m+7]=R,s[m+8]=L,s[m+9]=0,s[m+10]=0,s[m+11]=0,A++}}}this.__chunksDirty.add(e.chunkBase,e.chunkBase+e.chunkCount)}__refreshChangedSources(){for(let[e,t]of this.__entryInfos){let r=t.mesh;if(r.primitivePositionUpdateCount===t.positionUpdateCount)continue;t.positionUpdateCount=r.primitivePositionUpdateCount;let i=r.getPrimitiveNumber()===t.primitives.length;for(let n=0;n<t.primitives.length&&i;n++){let u=r.getPrimitiveAt(n),o=v(u,"POSITION");i=u===t.primitives[n]&&o!==void 0&&o.elementCount===e.primitiveVertexCounts[n]}if(!i){this.__resetRequested=!0;continue}this.__writeSources(e,t),this.__version++}}__refreshMorphLayouts(){let e=S.getPrimitiveCountHasMorph();for(let[t,r]of this.__entryInfos)r.morphPrimitiveCount===e&&r.blendShapeOffsets===q.getOffsetsInUniform(r.engine)||(this.__writeChunks(t,r),this.__version++)}};export{z as DeformBoundsByteSize,J as DeformedVertexByteSize,K as WebGpuVertexDeformer};
