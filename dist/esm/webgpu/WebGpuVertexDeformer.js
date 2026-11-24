import{BlendShapeComponent as j}from"../foundation/components/BlendShape/BlendShapeComponent.js";import{SkeletalComponent as T}from"../foundation/components/Skeletal/SkeletalComponent.js";import{Component as D}from"../foundation/core/Component.js";import{ComponentType as O}from"../foundation/definitions/ComponentType.js";import{Mesh as ee}from"../foundation/geometry/Mesh.js";import{Primitive as I}from"../foundation/geometry/Primitive.js";import{DirtyRange as q}from"./DirtyRange.js";import{GpuDeformChunkSize as Y,GpuDeformRegistry as te}from"./GpuDeformRegistry.js";import{boneDecodeWgsl as ie}from"./shaderity_shaders/common/boneDecode.js";var ne=`
${ie.code}

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
const LOCATION_RADIX: u32 = ${D._variableLengthLocationRadix}u;

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
`,oe=65535,U=64,H=U/4,J=32,A=32,V=48,S=V/4,X=16,z=4294967295,$={sourceVertices:8192,deformedVertices:16384,bounds:256,chunks:1024},re={};function B(P,e){for(let t of P.attributeSemantics)if(t.split(".")[0]===e)return P.getAttribute(t)}var x=class{constructor(e){this.LB=0;this.WB=4;this.av=1;this.AB=!1;this.kB=!1;if(this.eA=e,e===void 0)return;this.LB=Math.min(e.numberOfComponents,4),this.WB=e.componentSizeInBytes;let t=e.componentType,i=e.numberOfComponents===2||e.numberOfComponents===4;e.normalized&&i&&(t===O.UnsignedByte?(this.kB=!0,this.av=255):t===O.Byte?(this.kB=!0,this.av=127,this.AB=!0):t===O.UnsignedShort?(this.kB=!0,this.av=65535):t===O.Short&&(this.kB=!0,this.av=32767,this.AB=!0))}get exists(){return this.eA!==void 0}read(e,t){let i=this.eA;if(i===void 0||t>=this.LB)return t===3?1:0;let n=i.getScalarAt(e,t*this.WB,re);if(!this.kB)return n;let o=n/this.av;return this.AB?Math.max(o,-1):o}},K=class{constructor(e){this.YG=new Uint32Array(X/4);this.VB=new q;this.vG=new q;this.GB=new Map;this.vb=0;this.NB=-1;this.EB=!1;this.FG=-1;this.uB=e,this.rG=new te($);let t="read-only-storage",i=[t,"uniform",t,t,t,t,t,"storage","storage"],n=e.createBindGroupLayout({label:"GpuSkinning.deform",entries:i.map((u,r)=>({binding:r,visibility:GPUShaderStage.COMPUTE,buffer:{type:u}}))}),o=e.createComputePipeline({label:"GpuSkinning.deform",layout:e.createPipelineLayout({bindGroupLayouts:[n]}),compute:{module:e.createShaderModule({label:"GpuSkinning.deform",code:ne}),entryPoint:"deform"}});this.PB={layout:n,pipeline:o,bindGroupBuffers:[]},this.sG=e.createBuffer({label:"GpuSkinning.params",size:X,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.CB=e.createBuffer({label:"GpuSkinning.dummy",size:16,usage:GPUBufferUsage.STORAGE}),this.NG($)}get registry(){return this.rG}get deformedVerticesBuffer(){return this.wB}get boundsBuffer(){return this.DB}get hasEntries(){return this.rG.entryCount>0}get isChanged(){return this.vb!==this.NB}get isOverflowed(){return this.rG.isOverflowed}get isResetRequested(){return this.EB}get capacities(){return this.rG.capacities}acquire(e,t,i){let n=[],o=[],u=t.getPrimitiveNumber();for(let f=0;f<u;f++){let h=t.getPrimitiveAt(f),s=B(h,"POSITION");if(s===void 0)return;n.push(h),o.push(s.elementCount)}let r=this.rG.acquire(i,o,i.length/4);if(r!==void 0){if(r.isNew){let f={engine:e,mesh:t,entityInfo:i,primitives:n,positionUpdateCount:t.primitivePositionUpdateCount,morphPrimitiveCount:-1,blendShapeOffsets:[]};this.GB.set(r.entry,f),this.FB(r.entry,f),this.jB(r.entry,f),this.vb++}return r.entry}}release(e){if(!this.rG.release(e))return;this.GB.delete(e);let t=this.pG;for(let i=0;i<e.chunkCount;i++)t[(e.chunkBase+i)*S+1]=0;this.vG.add(e.chunkBase,e.chunkBase+e.chunkCount),this.vb++}getPrimitiveOffset(e,t){let i=this.GB.get(e);if(i===void 0)return;let n=i.primitives.indexOf(t);return n<0?void 0:e.primitiveOffsets[n]}getInstanceDeformedBase(e,t){return e.deformedBase+t*e.vertexCount}getInstanceBoundsSlot(e,t){return e.boundsBase+t}refresh(){let e=ee._primitivePositionUpdateVersion;e!==this.FG&&(this.FG=e,this.qB()),this.YB()}encode(e,t,i,n){var d,y,k;let o=this.rG;if(o.entryCount===0)return!1;let u=this.uB;this.CG(this.UB,this.zB,this.VB,H),this.CG(this.cG,this.pG,this.vG,S);let r=o.chunkHighWater,f=Math.max(1,Math.min(r,oe)),h=this.YG;h[0]=r,h[1]=f,u.queue.writeBuffer(this.sG,0,h);let s=this.PB,p=[t,this.sG,this.UB,this.cG,(d=i.blendShapeData)!=null?d:this.CB,(y=i.morphOffsets)!=null?y:this.CB,(k=i.morphWeights)!=null?k:this.CB,this.wB,this.DB],b=s.bindGroup!=null;for(let l=0;l<p.length&&b;l++)b=s.bindGroupBuffers[l]===p[l];b||(s.bindGroup=u.createBindGroup({label:"GpuSkinning.deform",layout:s.layout,entries:p.map((l,w)=>({binding:w,resource:{buffer:l}}))}),s.bindGroupBuffers=p),e.clearBuffer(this.DB,0,o.boundsHighWater*A);let v={label:"GpuSkinning"},c=n==null?void 0:n.getTimestampWrites("GpuSkinning");c!=null&&(v.timestampWrites=c);let a=e.beginComputePass(v);return r>0&&(a.setPipeline(s.pipeline),a.setBindGroup(0,s.bindGroup),a.dispatchWorkgroups(f,Math.ceil(r/f))),a.end(),this.NB=this.vb,!0}getGrownCapacities(){let e=this.rG;if(!e.isOverflowed)return;let t=e.requiredCapacities,i=e.capacities,n=this.uB.limits,o=Math.min(n.maxStorageBufferBindingSize,n.maxBufferSize),u=(f,h,s)=>{let p=f;for(;p<h*1.25;)p*=2;return Math.max(f,Math.min(p,Math.floor(o/s)))},r={sourceVertices:u(i.sourceVertices,t.sourceVertices,U),deformedVertices:u(i.deformedVertices,t.deformedVertices,J),bounds:u(i.bounds,t.bounds,A),chunks:u(i.chunks,t.chunks,V)};if(!(r.sourceVertices===i.sourceVertices&&r.deformedVertices===i.deformedVertices&&r.bounds===i.bounds&&r.chunks===i.chunks))return r}reset(e){this.qG(),this.NG(e),this.rG.reset(e),this.GB.clear(),this.EB=!1,this.vb++}destroy(){this.qG(),this.sG.destroy(),this.CB.destroy()}NG(e){let t=this.uB;this.UB=t.createBuffer({label:"GpuSkinning.sources",size:e.sourceVertices*U,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.cG=t.createBuffer({label:"GpuSkinning.chunks",size:e.chunks*V,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.wB=t.createBuffer({label:"GpuSkinning.deformedVertices",size:e.deformedVertices*J,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.DB=t.createBuffer({label:"GpuSkinning.bounds",size:e.bounds*A,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC});let i=new ArrayBuffer(e.sourceVertices*U);this.zB=new Uint32Array(i),this._B=new Float32Array(i),this.pG=new Uint32Array(e.chunks*S),this.VB.clear(),this.vG.clear(),this.vG.add(0,e.chunks),this.PB.bindGroup=void 0,this.PB.bindGroupBuffers=[]}qG(){var e,t,i,n;(e=this.UB)==null||e.destroy(),(t=this.cG)==null||t.destroy(),(i=this.wB)==null||i.destroy(),(n=this.DB)==null||n.destroy()}CG(e,t,i,n){if(i.isEmpty)return;let o=i.min*n,u=Math.min(i.max*n,t.length);this.uB.queue.writeBuffer(e,o*4,t,o,u-o),i.clear()}FB(e,t){let i=this.zB,n=this._B;for(let o=0;o<t.primitives.length;o++){let u=t.primitives[o],r=new x(B(u,"POSITION")),f=new x(B(u,"NORMAL")),h=new x(B(u,"JOINTS_0")),s=new x(B(u,"WEIGHTS_0")),p=new x(B(u,"BARY_CENTRIC_COORD")),b=e.sourceBase+e.primitiveOffsets[o],v=e.primitiveVertexCounts[o];for(let c=0;c<v;c++){let a=(b+c)*H;n[a]=r.read(c,0),n[a+1]=r.read(c,1),n[a+2]=r.read(c,2),i[a+3]=p.exists?Math.max(0,Math.trunc(p.read(c,3))):c,f.exists?(n[a+4]=f.read(c,0),n[a+5]=f.read(c,1),n[a+6]=f.read(c,2)):(n[a+4]=0,n[a+5]=0,n[a+6]=0),n[a+7]=0;for(let d=0;d<4;d++)i[a+8+d]=h.exists?Math.max(0,Math.trunc(h.read(c,d))):0,n[a+12+d]=s.exists?s.read(c,d):0}}this.VB.add(e.sourceBase,e.sourceBase+e.vertexCount)}jB(e,t){var p,b,v,c;let i=t.engine,n=t.entityInfo;t.morphPrimitiveCount=I.getPrimitiveCountHasMorph(),t.blendShapeOffsets=j.getOffsetsInUniform(i);let o=I.getMorphUniformDataOffsets(),u=t.blendShapeOffsets,r=(p=D.getComponentCountPerBufferView(i).get(T))!=null?p:1,f=D.getLocationOffsetOfMemberOfComponent(i,T,D._getVariableLengthLocationMemberName("boneData")),h=D.getLocationOffsetOfMemberOfComponent(i,T,"boneDataInfo"),s=this.pG;for(let a=0;a<e.instanceCount;a++){let d=n[4*a+1],y=n[4*a+2],k=z,l=0;if(d!==z){let g=Math.floor(d/r),C=d%r;k=((b=f[g])!=null?b:0)+C,l=((v=h[g])!=null?v:0)+C}let w=this.getInstanceDeformedBase(e,a),Q=this.getInstanceBoundsSlot(e,a),E=e.chunkBase+a*e.chunkCountPerInstance;for(let g=0;g<t.primitives.length;g++){let C=t.primitives[g],L=0,R=0,W=0,_=C.targets.length,N=I.getPrimitiveIdxHasMorph(C.primitiveUid);if(_>0&&y!==z&&N!==void 0){let G=u[y];G!==void 0&&(L=(c=o[N])!=null?c:0,R=_,W=G)}let F=e.primitiveOffsets[g],Z=e.primitiveVertexCounts[g];for(let G=0;G<e.primitiveChunkCounts[g];G++){let M=G*Y,m=E*S;s[m]=e.sourceBase+F+M,s[m+1]=Math.min(Y,Z-M),s[m+2]=w+F+M,s[m+3]=Q,s[m+4]=k,s[m+5]=l,s[m+6]=L,s[m+7]=R,s[m+8]=W,s[m+9]=0,s[m+10]=0,s[m+11]=0,E++}}}this.vG.add(e.chunkBase,e.chunkBase+e.chunkCount)}qB(){for(let[e,t]of this.GB){let i=t.mesh;if(i.primitivePositionUpdateCount===t.positionUpdateCount)continue;t.positionUpdateCount=i.primitivePositionUpdateCount;let n=i.getPrimitiveNumber()===t.primitives.length;for(let o=0;o<t.primitives.length&&n;o++){let u=i.getPrimitiveAt(o),r=B(u,"POSITION");n=u===t.primitives[o]&&r!==void 0&&r.elementCount===e.primitiveVertexCounts[o]}if(!n){this.EB=!0;continue}this.FB(e,t),this.vb++}}YB(){let e=I.getPrimitiveCountHasMorph();for(let[t,i]of this.GB)i.morphPrimitiveCount===e&&i.blendShapeOffsets===j.getOffsetsInUniform(i.engine)||(this.jB(t,i),this.vb++)}};export{A as DeformBoundsByteSize,J as DeformedVertexByteSize,K as WebGpuVertexDeformer};
