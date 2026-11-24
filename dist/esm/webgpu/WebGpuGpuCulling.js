import{CameraComponent as re}from"../foundation/components/Camera/CameraComponent.js";import{SceneGraphComponent as I}from"../foundation/components/SceneGraph/SceneGraphComponent.js";import{Component as S}from"../foundation/core/Component.js";import{Mesh as te}from"../foundation/geometry/Mesh.js";import{DirtyRange as w}from"./DirtyRange.js";import{GpuCullingChunkSize as ie,GpuCullingRegistry as se}from"./GpuCullingRegistry.js";import{WebGpuVertexDeformer as ne}from"./WebGpuVertexDeformer.js";var R=`
struct CullGroup {
  rangeBase: u32,     // the first instance slot of the group
  instanceCount: u32, // the number of instances (0 for an unused group slot)
  viewIndex: u32,     // the view the instances are culled with
  chunkBase: u32,     // the first chunk slot of the group
}

struct Params {
  groupCount: u32,
  drawCount: u32,
  chunkCount: u32,
  chunksPerRow: u32,
}

const CHUNK_SIZE: u32 = 64u;
const INVALID: u32 = 0xffffffffu;
`,ue=`
${R}
struct CullRecord {
  ids: vec4<u32>,             // the instance variation data (sceneGraphSID, skeletalSID, blendShapeSID, 0)
  center: vec3<f32>,          // the center of the local AABB of the mesh
  worldMatrixIndex: u32,      // vec4 index of the world matrix of the instance in data
  extent: vec3<f32>,          // the half size of the local AABB of the mesh
  isVisibleIndex: u32,        // float index of the isVisible flag of the instance in data
  isBillboardIndex: u32,      // float index of the isBillboard flag of the instance in data
  flags: u32,                 // bit 0: always visible (not culled), bit 1: deformed (the AABB is in bounds)
  boundsSlot: u32,            // the deformed bounding box of the instance (WebGpuVertexDeformer)
  pad1: u32,
}

struct CullView {
  header: vec4<f32>,             // x: 1 if the view culls
  planes: array<vec4<f32>, 6>,   // top, bottom, right, left, near, far (as Frustum.getPlane)
  corners: array<vec4<f32>, 8>,  // the frustum corners in world space
}

@group(0) @binding(0) var<storage, read> data: array<vec4<f32>>;
@group(0) @binding(1) var<uniform> params: Params;
@group(0) @binding(2) var<storage, read> records: array<CullRecord>;
@group(0) @binding(3) var<storage, read> groups: array<CullGroup>;
@group(0) @binding(4) var<storage, read> views: array<CullView>;
// (group index, index of the chunk's first instance in the group), or (INVALID, 0) for an unused chunk slot
@group(0) @binding(5) var<storage, read> chunks: array<vec2<u32>>;
@group(0) @binding(6) var<storage, read_write> scratchIds: array<vec4<u32>>;
@group(0) @binding(7) var<storage, read_write> chunkCounts: array<u32>;
// The local bounding boxes of the deformed instances (2 vec4 per instance: ~min.xyz and max.xyz, encoded by
// encodeOrderedFloat in WebGpuVertexDeformer; all 0 before the first deformation)
@group(0) @binding(8) var<storage, read> bounds: array<vec4<u32>>;

const ALWAYS_VISIBLE: u32 = 1u;
const DEFORMED: u32 = 2u;

fn decodeOrderedFloat(encoded: vec3<u32>) -> vec3<f32> {
  return bitcast<vec3<f32>>(select(~encoded, encoded & vec3<u32>(0x7fffffffu), (encoded & vec3<u32>(0x80000000u)) != vec3<u32>(0u)));
}

var<workgroup> scan: array<u32, 64>;

fn fetchScalar(floatIndex: u32) -> f32 {
  let value = data[floatIndex / 4u];
  return value[floatIndex % 4u];
}

fn isInstanceVisible(record: CullRecord, view: CullView) -> bool {
  if ((record.flags & ALWAYS_VISIBLE) != 0u) {
    return true;
  }
  // The same rule as the CPU culling (SceneGraphComponent.isVisible) and the vertex shaders (get_isVisible).
  if (fetchScalar(record.isVisibleIndex) <= 0.5) {
    return false;
  }
  if (view.header.x < 0.5) {
    return true;
  }
  // A billboard is rotated toward the camera in the vertex shader, so its world AABB is not known here.
  if (fetchScalar(record.isBillboardIndex) > 0.5) {
    return true;
  }
  var localCenter = record.center;
  var localExtent = record.extent;
  if ((record.flags & DEFORMED) != 0u) {
    let encodedMax = bounds[record.boundsSlot * 2u + 1u];
    if (encodedMax.x == 0u) {
      // Not deformed yet.
      return true;
    }
    let localMin = decodeOrderedFloat(~bounds[record.boundsSlot * 2u].xyz);
    let localMax = decodeOrderedFloat(encodedMax.xyz);
    localCenter = (localMin + localMax) * 0.5;
    localExtent = (localMax - localMin) * 0.5;
  }
  let m = mat4x4<f32>(
    data[record.worldMatrixIndex],
    data[record.worldMatrixIndex + 1u],
    data[record.worldMatrixIndex + 2u],
    data[record.worldMatrixIndex + 3u]
  );
  // The world AABB of the transformed local AABB (the same box as transforming its 8 corners).
  let center = (m * vec4<f32>(localCenter, 1.0)).xyz;
  let extent = abs(m[0].xyz) * localExtent.x + abs(m[1].xyz) * localExtent.y + abs(m[2].xyz) * localExtent.z;
  let minPoint = center - extent;
  let maxPoint = center + extent;

  // The box is completely outside of a plane exactly when its corner farthest along the plane normal is.
  for (var i = 0u; i < 6u; i = i + 1u) {
    let plane = view.planes[i];
    let farthest = select(minPoint, maxPoint, plane.xyz >= vec3<f32>(0.0));
    if (dot(plane.xyz, farthest) + plane.w < 0.0) {
      return false;
    }
  }

  // The frustum is completely outside of one of the box faces.
  var outMax = vec3<u32>(0u);
  var outMin = vec3<u32>(0u);
  for (var i = 0u; i < 8u; i = i + 1u) {
    let corner = view.corners[i].xyz;
    outMax = outMax + select(vec3<u32>(0u), vec3<u32>(1u), corner > maxPoint);
    outMin = outMin + select(vec3<u32>(0u), vec3<u32>(1u), corner < minPoint);
  }
  if (any(outMax == vec3<u32>(8u)) || any(outMin == vec3<u32>(8u))) {
    return false;
  }
  return true;
}

@compute @workgroup_size(64)
fn cullChunks(@builtin(workgroup_id) workgroupId: vec3<u32>, @builtin(local_invocation_index) lid: u32) {
  // c is uniform in the workgroup, so this return keeps the barriers below in uniform control flow.
  let c = workgroupId.y * params.chunksPerRow + workgroupId.x;
  if (c >= params.chunkCount) {
    return;
  }
  let chunk = chunks[c];
  var visible = 0u;
  var ids = vec4<u32>(0u);
  var chunkSlotBase = 0u;
  if (chunk.x != INVALID) {
    let group = groups[chunk.x];
    chunkSlotBase = group.rangeBase + chunk.y;
    if (chunk.y + lid < group.instanceCount) {
      let record = records[chunkSlotBase + lid];
      ids = record.ids;
      if (isInstanceVisible(record, views[group.viewIndex])) {
        visible = 1u;
      }
    }
  }
  // Inclusive prefix sum of the visibility (Hillis-Steele).
  scan[lid] = visible;
  workgroupBarrier();
  for (var offset = 1u; offset < CHUNK_SIZE; offset = offset << 1u) {
    var addend = 0u;
    if (lid >= offset) {
      addend = scan[lid - offset];
    }
    workgroupBarrier();
    scan[lid] = scan[lid] + addend;
    workgroupBarrier();
  }
  if (visible == 1u) {
    scratchIds[chunkSlotBase + scan[lid] - 1u] = ids;
  }
  if (lid == CHUNK_SIZE - 1u) {
    chunkCounts[c] = scan[lid];
  }
}
`,oe=`
${R}
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> groups: array<CullGroup>;
@group(0) @binding(2) var<storage, read> chunkCounts: array<u32>;
@group(0) @binding(3) var<storage, read_write> chunkOffsets: array<u32>;
@group(0) @binding(4) var<storage, read_write> visibleCounts: array<u32>;

@compute @workgroup_size(64)
fn prefixGroups(@builtin(global_invocation_id) id: vec3<u32>) {
  let g = id.x;
  if (g >= params.groupCount) {
    return;
  }
  let group = groups[g];
  let chunkCount = (group.instanceCount + CHUNK_SIZE - 1u) / CHUNK_SIZE;
  var sum = 0u;
  for (var k = 0u; k < chunkCount; k = k + 1u) {
    chunkOffsets[group.chunkBase + k] = sum;
    sum = sum + chunkCounts[group.chunkBase + k];
  }
  visibleCounts[g] = sum;
}
`,ae=`
${R}
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> groups: array<CullGroup>;
@group(0) @binding(2) var<storage, read> chunks: array<vec2<u32>>;
@group(0) @binding(3) var<storage, read> chunkCounts: array<u32>;
@group(0) @binding(4) var<storage, read> chunkOffsets: array<u32>;
@group(0) @binding(5) var<storage, read> scratchIds: array<vec4<u32>>;
@group(0) @binding(6) var<storage, read_write> visibleIds: array<vec4<u32>>;

@compute @workgroup_size(64)
fn scatter(@builtin(workgroup_id) workgroupId: vec3<u32>, @builtin(local_invocation_index) lid: u32) {
  let c = workgroupId.y * params.chunksPerRow + workgroupId.x;
  if (c >= params.chunkCount) {
    return;
  }
  let chunk = chunks[c];
  if (chunk.x == INVALID || lid >= chunkCounts[c]) {
    return;
  }
  let rangeBase = groups[chunk.x].rangeBase;
  visibleIds[rangeBase + chunkOffsets[c] + lid] = scratchIds[rangeBase + chunk.y + lid];
}
`,fe=`
${R}
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> visibleCounts: array<u32>;
@group(0) @binding(2) var<storage, read> drawGroups: array<u32>;
@group(0) @binding(3) var<storage, read_write> args: array<u32>;

@compute @workgroup_size(64)
fn finalize(@builtin(global_invocation_id) id: vec3<u32>) {
  let d = id.x;
  if (d >= params.drawCount) {
    return;
  }
  let g = drawGroups[d];
  var count = 0u;
  if (g != INVALID) {
    count = visibleCounts[g];
  }
  // The indirect arguments are [indexCount or vertexCount, instanceCount, ...].
  args[d * 5u + 1u] = count;
}
`,Z=64,de=65535,z=64,X=z/4,W=16,C=60,ce=C*4,O=20,T=O/4,A=16,j=16,V=4294967295,J=1,le=2,L=8,Q={instances:8192,groups:2048,draws:4096,chunks:4096},ee=class{constructor(r){this.__paramsArray=new Uint32Array(j/4);this.__viewsCapacity=0;this.__viewsF32=new Float32Array(0);this.__uploadedViewsF32=new Float32Array(0);this.__recordsDirty=new w;this.__groupsDirty=new w;this.__drawGroupsDirty=new w;this.__argsDirty=new w;this.__chunksDirty=new w;this.__groupVertexRanges=[];this.__views=[];this.__viewIndexOfCamera=new Map;this.__inputsDirty=!0;this.__lastPositionUpdateVersion=-1;this.__lastEncodedRegistryVersion=-1;this.__device=r,this.__registry=new se(Q),this.__deformer=new ne(r);let t=(a,f,c,s)=>{let d=r.createBindGroupLayout({label:`GpuCulling.${a}`,entries:s.map((p,h)=>({binding:h,visibility:GPUShaderStage.COMPUTE,buffer:{type:p}}))}),o=r.createComputePipeline({label:`GpuCulling.${a}`,layout:r.createPipelineLayout({bindGroupLayouts:[d]}),compute:{module:r.createShaderModule({label:`GpuCulling.${a}`,code:f}),entryPoint:c}});return{layout:d,pipeline:o}},e="read-only-storage",i="storage",u="uniform";this.__passes={cull:t("cullChunks",ue,"cullChunks",[e,u,e,e,e,e,i,i,e]),prefix:t("prefixGroups",oe,"prefixGroups",[u,e,e,i,i]),scatter:t("scatter",ae,"scatter",[u,e,e,e,e,e,i]),finalize:t("finalize",fe,"finalize",[u,e,e,i])},this.__paramsBuffer=r.createBuffer({label:"GpuCulling.params",size:j,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.__createTables(Q)}get registry(){return this.__registry}get deformer(){return this.__deformer}get deformedVerticesBuffer(){return this.__deformer.deformedVerticesBuffer}beginRecording(){this.__registry.beginRecording()}get isRecording(){return this.__registry.isRecording}finishRecording(r){this.__registry.finishRecording(r)}abortRecording(){this.__registry.abortRecording()}retireAllBundles(){this.__registry.retireAllBundles()}markInputsDirty(){this.__inputsDirty=!0}registerDraw(r,t,e,i,u){let a=this.__registry;if(!a.isRecording)return;let f=t._variationEntityInfo,c=t.meshEntitiesInner.length;if(f===void 0||f.length!==c*4||c===0)return;let s=this.__getOrCreateView(r,i);if(s<0)return;let d=a.getOrAllocateGroup(t,s,c);if(d===void 0)return;let o=this.__groupVertexRanges[d.index];if(o===void 0||o.group!==d){let _=t._needsComputeDeformation,b=_?this.__deformer.acquire(r,t,f):void 0;o={group:d,range:{buffer:this.__visibleIdsBuffer,offset:d.rangeBase*A,size:c*A},engine:r,mesh:t,entityInfo:f,positionUpdateCount:t.primitivePositionUpdateCount,deform:b,isDeformFailed:_&&b===void 0},this.__groupVertexRanges[d.index]=o,this.__writeGroup(r,t,d,f,b)}if(o.isDeformFailed)return;let p;if(o.deform!==void 0&&(p=this.__deformer.getPrimitiveOffset(o.deform,e),p===void 0))return;let h=a.allocateDraw();if(h<0)return;let l=this.__argsU32,n=h*T;return l[n]=u,l[n+1]=0,l[n+2]=0,l[n+3]=0,l[n+4]=0,this.__argsDirty.add(h,h+1),this.__drawGroupsU32[h]=d.index,this.__drawGroupsDirty.add(h,h+1),{instanceVertexBuffer:o.range,indirectBuffer:this.__argsBuffer,indirectOffset:h*O,deformedVertexOffset:p}}encode(r,t,e={}){var U,P,v,y,D,G;let i=this.__registry,u=i.groupHighWater,a=i.drawHighWater;if(r==null||u===0)return;let f=this.__updateViews(),c=te._primitivePositionUpdateVersion;c!==this.__lastPositionUpdateVersion&&(this.__lastPositionUpdateVersion=c,this.__refreshChangedBounds());let s=this.__deformer;s.refresh();let d=s.hasEntries&&(this.__inputsDirty||s.isChanged||this.__cullBindGroupStorageBuffer!==r);if(!this.__inputsDirty&&!d&&this.__recordsDirty.isEmpty&&!f&&i.version===this.__lastEncodedRegistryVersion&&this.__cullBindGroupStorageBuffer===r)return;this.__inputsDirty=!1,this.__lastEncodedRegistryVersion=i.version;let o=this.__device;this.__uploadDirty(this.__recordsBuffer,this.__recordsU32,this.__recordsDirty,X),this.__uploadDirty(this.__groupsBuffer,this.__groupsU32,this.__groupsDirty,W/4),this.__uploadDirty(this.__chunksBuffer,this.__chunksU32,this.__chunksDirty,L/4),this.__uploadDirty(this.__drawGroupsBuffer,this.__drawGroupsU32,this.__drawGroupsDirty,1),this.__uploadDirty(this.__argsBuffer,this.__argsU32,this.__argsDirty,T);let p=i.chunkHighWater,h=Math.max(1,Math.min(p,de)),l=this.__paramsArray;l[0]=u,l[1]=a,l[2]=p,l[3]=h,o.queue.writeBuffer(this.__paramsBuffer,0,l);let n=this.__passes;(n.cull.bindGroup==null||this.__cullBindGroupStorageBuffer!==r||this.__cullBindGroupBoundsBuffer!==s.boundsBuffer)&&(n.cull.bindGroup=this.__createBindGroup(n.cull,[r,this.__paramsBuffer,this.__recordsBuffer,this.__groupsBuffer,this.__viewsBuffer,this.__chunksBuffer,this.__scratchIdsBuffer,this.__chunkCountsBuffer,s.boundsBuffer]),this.__cullBindGroupStorageBuffer=r,this.__cullBindGroupBoundsBuffer=s.boundsBuffer),(P=(U=n.prefix).bindGroup)!=null||(U.bindGroup=this.__createBindGroup(n.prefix,[this.__paramsBuffer,this.__groupsBuffer,this.__chunkCountsBuffer,this.__chunkOffsetsBuffer,this.__visibleCountsBuffer])),(y=(v=n.scatter).bindGroup)!=null||(v.bindGroup=this.__createBindGroup(n.scatter,[this.__paramsBuffer,this.__groupsBuffer,this.__chunksBuffer,this.__chunkCountsBuffer,this.__chunkOffsetsBuffer,this.__scratchIdsBuffer,this.__visibleIdsBuffer])),(G=(D=n.finalize).bindGroup)!=null||(D.bindGroup=this.__createBindGroup(n.finalize,[this.__paramsBuffer,this.__visibleCountsBuffer,this.__drawGroupsBuffer,this.__argsBuffer]));let _=o.createCommandEncoder({label:"GpuCulling"});d&&s.encode(_,r,e,t);let b={label:"GpuCulling"},x=t==null?void 0:t.getTimestampWrites("GpuCulling");x!=null&&(b.timestampWrites=x);let m=_.beginComputePass(b),k=Math.ceil(p/h);return p>0&&(m.setPipeline(n.cull.pipeline),m.setBindGroup(0,n.cull.bindGroup),m.dispatchWorkgroups(h,k)),m.setPipeline(n.prefix.pipeline),m.setBindGroup(0,n.prefix.bindGroup),m.dispatchWorkgroups(Math.ceil(u/Z)),p>0&&(m.setPipeline(n.scatter.pipeline),m.setBindGroup(0,n.scatter.bindGroup),m.dispatchWorkgroups(h,k)),a>0&&(m.setPipeline(n.finalize.pipeline),m.setBindGroup(0,n.finalize.bindGroup),m.dispatchWorkgroups(Math.ceil(a/Z))),m.end(),_.finish()}__createBindGroup(r,t){return this.__device.createBindGroup({label:r.pipeline.label,layout:r.layout,entries:t.map((e,i)=>({binding:i,resource:{buffer:e}}))})}afterSubmit(){let r=this.__registry,t=r.releaseRetired();if(t!==void 0){let f=this.__groupsU32;for(let s of t.groups){f[s.index*4+1]=0,this.__groupsDirty.add(s.index,s.index+1);let d=this.__chunksU32;for(let p=0;p<s.chunkCount;p++)d[(s.chunkBase+p)*2]=V,d[(s.chunkBase+p)*2+1]=0;this.__chunksDirty.add(s.chunkBase,s.chunkBase+s.chunkCount);let o=this.__groupVertexRanges[s.index];(o==null?void 0:o.group)===s&&(o.deform!==void 0&&this.__deformer.release(o.deform),this.__groupVertexRanges[s.index]=void 0)}let c=this.__drawGroupsU32;for(let s of t.draws)c[s]=V,this.__drawGroupsDirty.add(s,s+1)}let e=this.__deformer,i=this.__getGrownCapacities(),u=e.getGrownCapacities();if(i===void 0&&u===void 0&&!e.isResetRequested)return!1;let a=i!=null?i:{...r.capacities};return this.__destroyTables(),this.__createTables(a),r.reset(a),e.reset(u!=null?u:{...e.capacities}),this.__groupVertexRanges.length=0,this.__inputsDirty=!0,!0}__getGrownCapacities(){let r=this.__registry;if(!r.isOverflowed)return;let t=r.requiredCapacities,e=r.capacities,i=this.__device.limits,u=Math.min(i.maxStorageBufferBindingSize,i.maxBufferSize),a=(c,s,d)=>{let o=c;for(;o<s*1.25;)o*=2;return Math.max(c,Math.min(o,Math.floor(u/d)))},f={instances:a(e.instances,t.instances,z),groups:a(e.groups,t.groups,W),draws:a(e.draws,t.draws,O),chunks:a(e.chunks,t.chunks,L)};if(!(f.instances===e.instances&&f.groups===e.groups&&f.draws===e.draws&&f.chunks===e.chunks))return f}destroy(){var r;this.__destroyTables(),this.__deformer.destroy(),this.__paramsBuffer.destroy(),(r=this.__viewsBuffer)==null||r.destroy(),this.__viewsBuffer=void 0}__createTables(r){let t=this.__device,e=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST;this.__recordsBuffer=t.createBuffer({label:"GpuCulling.records",size:r.instances*z,usage:e}),this.__groupsBuffer=t.createBuffer({label:"GpuCulling.groups",size:r.groups*W,usage:e}),this.__visibleCountsBuffer=t.createBuffer({label:"GpuCulling.visibleCounts",size:r.groups*4,usage:GPUBufferUsage.STORAGE}),this.__drawGroupsBuffer=t.createBuffer({label:"GpuCulling.drawGroups",size:r.draws*4,usage:e}),this.__visibleIdsBuffer=t.createBuffer({label:"GpuCulling.visibleIds",size:r.instances*A,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE}),this.__chunksBuffer=t.createBuffer({label:"GpuCulling.chunks",size:r.chunks*L,usage:e}),this.__chunkCountsBuffer=t.createBuffer({label:"GpuCulling.chunkCounts",size:r.chunks*4,usage:GPUBufferUsage.STORAGE}),this.__chunkOffsetsBuffer=t.createBuffer({label:"GpuCulling.chunkOffsets",size:r.chunks*4,usage:GPUBufferUsage.STORAGE}),this.__scratchIdsBuffer=t.createBuffer({label:"GpuCulling.scratchIds",size:r.instances*A,usage:GPUBufferUsage.STORAGE}),this.__argsBuffer=t.createBuffer({label:"GpuCulling.args",size:r.draws*O,usage:GPUBufferUsage.INDIRECT|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC}),this.__recordsArrayBuffer=new ArrayBuffer(r.instances*z),this.__recordsU32=new Uint32Array(this.__recordsArrayBuffer),this.__recordsF32=new Float32Array(this.__recordsArrayBuffer),this.__groupsU32=new Uint32Array(r.groups*4),this.__drawGroupsU32=new Uint32Array(r.draws).fill(V),this.__argsU32=new Uint32Array(r.draws*T),this.__chunksU32=new Uint32Array(r.chunks*2);for(let i=0;i<r.chunks;i++)this.__chunksU32[i*2]=V;this.__recordsDirty.clear(),this.__groupsDirty.clear(),this.__groupsDirty.add(0,r.groups),this.__drawGroupsDirty.clear(),this.__drawGroupsDirty.add(0,r.draws),this.__argsDirty.clear(),this.__chunksDirty.clear(),this.__chunksDirty.add(0,r.chunks),this.__resetBindGroups()}__resetBindGroups(){let r=this.__passes;r.cull.bindGroup=void 0,r.prefix.bindGroup=void 0,r.scatter.bindGroup=void 0,r.finalize.bindGroup=void 0,this.__cullBindGroupStorageBuffer=void 0}__destroyTables(){var r,t,e,i,u,a,f,c,s,d;(r=this.__recordsBuffer)==null||r.destroy(),(t=this.__groupsBuffer)==null||t.destroy(),(e=this.__visibleCountsBuffer)==null||e.destroy(),(i=this.__drawGroupsBuffer)==null||i.destroy(),(u=this.__visibleIdsBuffer)==null||u.destroy(),(a=this.__argsBuffer)==null||a.destroy(),(f=this.__chunksBuffer)==null||f.destroy(),(c=this.__chunkCountsBuffer)==null||c.destroy(),(s=this.__chunkOffsetsBuffer)==null||s.destroy(),(d=this.__scratchIdsBuffer)==null||d.destroy()}__uploadDirty(r,t,e,i){if(e.isEmpty)return;let u=e.min*i,a=Math.min(e.max*i,t.length);this.__device.queue.writeBuffer(r,u*4,t,u,a-u),e.clear()}__refreshChangedBounds(){let r=this.__groupVertexRanges;for(let t=0;t<r.length;t++){let e=r[t];e===void 0||e.mesh.primitivePositionUpdateCount===e.positionUpdateCount||(e.positionUpdateCount=e.mesh.primitivePositionUpdateCount,this.__writeGroup(e.engine,e.mesh,e.group,e.entityInfo,e.deform))}}__writeGroup(r,t,e,i,u){var N,H,q,Y,$;let a=this.__groupsU32,f=e.index*4;a[f]=e.rangeBase,a[f+1]=e.instanceCount,a[f+2]=e.viewIndex,a[f+3]=e.chunkBase,this.__groupsDirty.add(e.index,e.index+1);let c=this.__chunksU32;for(let B=0;B<e.chunkCount;B++)c[(e.chunkBase+B)*2]=e.index,c[(e.chunkBase+B)*2+1]=B*ie;this.__chunksDirty.add(e.chunkBase,e.chunkBase+e.chunkCount);let s=(N=S.getComponentCountPerBufferView(r).get(I))!=null?N:1,d=S.getLocationOffsetOfMemberOfComponent(r,I,"worldMatrix"),o=S.getLocationOffsetOfMemberOfComponent(r,I,"isVisible"),p=S.getLocationOffsetOfMemberOfComponent(r,I,"isBillboard"),h=t.AABB,l=!h.isVanilla(),n=h.minPoint._v,_=h.maxPoint._v,b=(n[0]+_[0])*.5,x=(n[1]+_[1])*.5,m=(n[2]+_[2])*.5,k=(_[0]-n[0])*.5,U=(_[1]-n[1])*.5,P=(_[2]-n[2])*.5,v=this.__recordsU32,y=this.__recordsF32,D=t.meshEntitiesInner,G=this.__deformer;for(let B=0;B<e.instanceCount;B++){let g=(e.rangeBase+B)*X,M=i[4*B],E=Math.floor(M/s),F=M%s;v[g]=M,v[g+1]=i[4*B+1],v[g+2]=i[4*B+2],v[g+3]=u!==void 0?G.getInstanceDeformedBase(u,B)+1:i[4*B+3],y[g+4]=b,y[g+5]=x,y[g+6]=m,v[g+7]=((H=d[E])!=null?H:0)+4*F,y[g+8]=k,y[g+9]=U,y[g+10]=P,v[g+11]=((q=o[E])!=null?q:0)*4+F,v[g+12]=((Y=p[E])!=null?Y:0)*4+F;let K=(($=D[B])==null?void 0:$.getTagValue("type"))==="background-assets";u!==void 0?(v[g+13]=le|(K?J:0),v[g+14]=G.getInstanceBoundsSlot(u,B)):(v[g+13]=!l||K?J:0,v[g+14]=0),v[g+15]=0}this.__recordsDirty.add(e.rangeBase,e.rangeBase+e.instanceCount)}__getOrCreateView(r,t){if(t<0)return-1;let e=r.componentRepository.getComponent(re,t);if(e==null)return-1;let i=this.__viewIndexOfCamera.get(e);return i===void 0&&(i=this.__views.length,this.__views.push({camera:e}),this.__viewIndexOfCamera.set(e,i)),i}__updateViews(){var c;let r=this.__views,t=r.length;if(t===0)return!1;let e=!1;(this.__viewsBuffer==null||this.__viewsCapacity<t)&&((c=this.__viewsBuffer)==null||c.destroy(),this.__viewsCapacity=Math.max(8,this.__viewsCapacity*2,t),this.__viewsBuffer=this.__device.createBuffer({label:"GpuCulling.views",size:this.__viewsCapacity*ce,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.__viewsF32=new Float32Array(this.__viewsCapacity*C),this.__uploadedViewsF32=new Float32Array(this.__viewsCapacity*C),this.__passes.cull.bindGroup=void 0,e=!0);let i=this.__viewsF32;for(let s=0;s<t;s++){let d=r[s].camera,o=s*C;if(!d._isAlive){i[o]=0;continue}d.updateFrustum();let p=d.frustum;i[o]=1,i[o+1]=0,i[o+2]=0,i[o+3]=0;for(let l=0;l<6;l++){let n=p.getPlane(l)._v,_=o+4+l*4;i[_]=n[0],i[_+1]=n[1],i[_+2]=n[2],i[_+3]=n[3]}let h=p.corners;for(let l=0;l<8;l++){let n=h[l]._v,_=o+28+l*4;i[_]=n[0],i[_+1]=n[1],i[_+2]=n[2],i[_+3]=1}}let u=t*C,a=this.__uploadedViewsF32,f=e;if(!f){for(let s=0;s<u;s++)if(i[s]!==a[s]){f=!0;break}}return f&&(this.__device.queue.writeBuffer(this.__viewsBuffer,0,i,0,u),a.set(i.subarray(0,u))),f}};export{O as GpuCullingArgsByteSize,ee as WebGpuGpuCulling};
