import{CameraComponent as te}from"../foundation/components/Camera/CameraComponent.js";import{SceneGraphComponent as A}from"../foundation/components/SceneGraph/SceneGraphComponent.js";import{Component as z}from"../foundation/core/Component.js";import{Mesh as re}from"../foundation/geometry/Mesh.js";import{DirtyRange as B}from"./DirtyRange.js";import{GpuCullingChunkSize as ie,GpuCullingRegistry as ne}from"./GpuCullingRegistry.js";import{WebGpuVertexDeformer as se}from"./WebGpuVertexDeformer.js";var E=`
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
`,oe=`
${E}
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
`,ue=`
${E}
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
${E}
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
`,de=`
${E}
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
`,Z=64,fe=65535,V=64,X=V/4,T=16,w=60,le=w*4,O=20,F=O/4,M=16,j=16,D=4294967295,J=1,ce=2,L=8,Q={instances:8192,groups:2048,draws:4096,chunks:4096},ee=class{constructor(t){this.gB=new Uint32Array(j/4);this.bG=0;this.KG=new Float32Array(0);this.ZG=new Float32Array(0);this.WG=new B;this.kG=new B;this.PG=new B;this.HG=new B;this.UG=new B;this.CG=[];this.qG=[];this.XG=new Map;this.IG=!0;this.jG=-1;this.JG=-1;this.uB=t,this.fG=new ne(Q),this.cG=new se(t);let r=(a,d,l,n)=>{let f=t.createBindGroupLayout({label:`GpuCulling.${a}`,entries:n.map((p,g)=>({binding:g,visibility:GPUShaderStage.COMPUTE,buffer:{type:p}}))}),u=t.createComputePipeline({label:`GpuCulling.${a}`,layout:t.createPipelineLayout({bindGroupLayouts:[f]}),compute:{module:t.createShaderModule({label:`GpuCulling.${a}`,code:d}),entryPoint:l}});return{layout:f,pipeline:u}},e="read-only-storage",i="storage",o="uniform";this.AG={cull:r("cullChunks",oe,"cullChunks",[e,o,e,e,e,e,i,i,e]),prefix:r("prefixGroups",ue,"prefixGroups",[o,e,e,i,i]),scatter:r("scatter",ae,"scatter",[o,e,e,e,e,e,i]),finalize:r("finalize",de,"finalize",[o,e,e,i])},this.gG=t.createBuffer({label:"GpuCulling.params",size:j,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.QG(Q)}get registry(){return this.fG}get deformer(){return this.cG}get deformedVerticesBuffer(){return this.cG.deformedVerticesBuffer}beginRecording(){this.fG.beginRecording()}get isRecording(){return this.fG.isRecording}finishRecording(t){this.fG.finishRecording(t)}abortRecording(){this.fG.abortRecording()}retireAllBundles(){this.fG.retireAllBundles()}markInputsDirty(){this.IG=!0}registerDraw(t,r,e,i,o){let a=this.fG;if(!a.isRecording)return;let d=r._variationEntityInfo,l=r.meshEntitiesInner.length;if(d===void 0||d.length!==l*4||l===0)return;let n=this.mB(t,i);if(n<0)return;let f=a.getOrAllocateGroup(r,n,l);if(f===void 0)return;let u=this.CG[f.index];if(u===void 0||u.group!==f){let h=r._needsComputeDeformation,x=h?this.cG.acquire(t,r,d):void 0;u={group:f,range:{buffer:this.MG,offset:f.rangeBase*M,size:l*M},engine:t,mesh:r,entityInfo:d,positionUpdateCount:r.primitivePositionUpdateCount,deform:x,isDeformFailed:h&&x===void 0},this.CG[f.index]=u,this.dB(t,r,f,d,x)}if(u.isDeformFailed)return;let p;if(u.deform!==void 0&&(p=this.cG.getPrimitiveOffset(u.deform,e),p===void 0))return;let g=a.allocateDraw();if(g<0)return;let c=this.NG,s=g*F;return c[s]=o,c[s+1]=0,c[s+2]=0,c[s+3]=0,c[s+4]=0,this.HG.add(g,g+1),this._G[g]=f.index,this.PG.add(g,g+1),{instanceVertexBuffer:u.range,indirectBuffer:this.xG,indirectOffset:g*O,deformedVertexOffset:p}}encode(t,r,e={}){var U,I,C,G,S,y;let i=this.fG,o=i.groupHighWater,a=i.drawHighWater;if(t==null||o===0)return;let d=this.vB(),l=re._primitivePositionUpdateVersion;l!==this.jG&&(this.jG=l,this.CB());let n=this.cG;n.refresh();let f=n.hasEntries&&(this.IG||n.isChanged||this.GG!==t);if(!this.IG&&!f&&this.WG.isEmpty&&!d&&i.version===this.JG&&this.GG===t)return;this.IG=!1,this.JG=i.version;let u=this.uB;this.SG(this.zG,this.LG,this.WG,X),this.SG(this.vG,this.RG,this.kG,T/4),this.SG(this.yG,this.wG,this.UG,L/4),this.SG(this.VG,this._G,this.PG,1),this.SG(this.xG,this.NG,this.HG,F);let p=i.chunkHighWater,g=Math.max(1,Math.min(p,fe)),c=this.gB;c[0]=o,c[1]=a,c[2]=p,c[3]=g,u.queue.writeBuffer(this.gG,0,c);let s=this.AG;(s.cull.bindGroup==null||this.GG!==t||this.YG!==n.boundsBuffer)&&(s.cull.bindGroup=this.TG(s.cull,[t,this.gG,this.zG,this.vG,this.mG,this.yG,this.EG,this.BG,n.boundsBuffer]),this.GG=t,this.YG=n.boundsBuffer),(I=(U=s.prefix).bindGroup)!=null||(U.bindGroup=this.TG(s.prefix,[this.gG,this.vG,this.BG,this.OG,this.DG])),(G=(C=s.scatter).bindGroup)!=null||(C.bindGroup=this.TG(s.scatter,[this.gG,this.vG,this.yG,this.BG,this.OG,this.EG,this.MG])),(y=(S=s.finalize).bindGroup)!=null||(S.bindGroup=this.TG(s.finalize,[this.gG,this.DG,this.VG,this.xG]));let h=u.createCommandEncoder({label:"GpuCulling"});f&&n.encode(h,t,e,r);let x={label:"GpuCulling"},k=r==null?void 0:r.getTimestampWrites("GpuCulling");k!=null&&(x.timestampWrites=k);let b=h.beginComputePass(x),P=Math.ceil(p/g);return p>0&&(b.setPipeline(s.cull.pipeline),b.setBindGroup(0,s.cull.bindGroup),b.dispatchWorkgroups(g,P)),b.setPipeline(s.prefix.pipeline),b.setBindGroup(0,s.prefix.bindGroup),b.dispatchWorkgroups(Math.ceil(o/Z)),p>0&&(b.setPipeline(s.scatter.pipeline),b.setBindGroup(0,s.scatter.bindGroup),b.dispatchWorkgroups(g,P)),a>0&&(b.setPipeline(s.finalize.pipeline),b.setBindGroup(0,s.finalize.bindGroup),b.dispatchWorkgroups(Math.ceil(a/Z))),b.end(),h.finish()}TG(t,r){return this.uB.createBindGroup({label:t.pipeline.label,layout:t.layout,entries:r.map((e,i)=>({binding:i,resource:{buffer:e}}))})}afterSubmit(){let t=this.fG,r=t.releaseRetired();if(r!==void 0){let d=this.RG;for(let n of r.groups){d[n.index*4+1]=0,this.kG.add(n.index,n.index+1);let f=this.wG;for(let p=0;p<n.chunkCount;p++)f[(n.chunkBase+p)*2]=D,f[(n.chunkBase+p)*2+1]=0;this.UG.add(n.chunkBase,n.chunkBase+n.chunkCount);let u=this.CG[n.index];(u==null?void 0:u.group)===n&&(u.deform!==void 0&&this.cG.release(u.deform),this.CG[n.index]=void 0)}let l=this._G;for(let n of r.draws)l[n]=D,this.PG.add(n,n+1)}let e=this.cG,i=this.GB(),o=e.getGrownCapacities();if(i===void 0&&o===void 0&&!e.isResetRequested)return!1;let a=i!=null?i:{...t.capacities};return this.pB(),this.QG(a),t.reset(a),e.reset(o!=null?o:{...e.capacities}),this.CG.length=0,this.IG=!0,!0}GB(){let t=this.fG;if(!t.isOverflowed)return;let r=t.requiredCapacities,e=t.capacities,i=this.uB.limits,o=Math.min(i.maxStorageBufferBindingSize,i.maxBufferSize),a=(l,n,f)=>{let u=l;for(;u<n*1.25;)u*=2;return Math.max(l,Math.min(u,Math.floor(o/f)))},d={instances:a(e.instances,r.instances,V),groups:a(e.groups,r.groups,T),draws:a(e.draws,r.draws,O),chunks:a(e.chunks,r.chunks,L)};if(!(d.instances===e.instances&&d.groups===e.groups&&d.draws===e.draws&&d.chunks===e.chunks))return d}destroy(){var t;this.pB(),this.cG.destroy(),this.gG.destroy(),(t=this.mG)==null||t.destroy(),this.mG=void 0}QG(t){let r=this.uB,e=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST;this.zG=r.createBuffer({label:"GpuCulling.records",size:t.instances*V,usage:e}),this.vG=r.createBuffer({label:"GpuCulling.groups",size:t.groups*T,usage:e}),this.DG=r.createBuffer({label:"GpuCulling.visibleCounts",size:t.groups*4,usage:GPUBufferUsage.STORAGE}),this.VG=r.createBuffer({label:"GpuCulling.drawGroups",size:t.draws*4,usage:e}),this.MG=r.createBuffer({label:"GpuCulling.visibleIds",size:t.instances*M,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE}),this.yG=r.createBuffer({label:"GpuCulling.chunks",size:t.chunks*L,usage:e}),this.BG=r.createBuffer({label:"GpuCulling.chunkCounts",size:t.chunks*4,usage:GPUBufferUsage.STORAGE}),this.OG=r.createBuffer({label:"GpuCulling.chunkOffsets",size:t.chunks*4,usage:GPUBufferUsage.STORAGE}),this.EG=r.createBuffer({label:"GpuCulling.scratchIds",size:t.instances*M,usage:GPUBufferUsage.STORAGE}),this.xG=r.createBuffer({label:"GpuCulling.args",size:t.draws*O,usage:GPUBufferUsage.INDIRECT|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC}),this.FG=new ArrayBuffer(t.instances*V),this.LG=new Uint32Array(this.FG),this.$G=new Float32Array(this.FG),this.RG=new Uint32Array(t.groups*4),this._G=new Uint32Array(t.draws).fill(D),this.NG=new Uint32Array(t.draws*F),this.wG=new Uint32Array(t.chunks*2);for(let i=0;i<t.chunks;i++)this.wG[i*2]=D;this.WG.clear(),this.kG.clear(),this.kG.add(0,t.groups),this.PG.clear(),this.PG.add(0,t.draws),this.HG.clear(),this.UG.clear(),this.UG.add(0,t.chunks),this.xB()}xB(){let t=this.AG;t.cull.bindGroup=void 0,t.prefix.bindGroup=void 0,t.scatter.bindGroup=void 0,t.finalize.bindGroup=void 0,this.GG=void 0}pB(){var t,r,e,i,o,a,d,l,n,f;(t=this.zG)==null||t.destroy(),(r=this.vG)==null||r.destroy(),(e=this.DG)==null||e.destroy(),(i=this.VG)==null||i.destroy(),(o=this.MG)==null||o.destroy(),(a=this.xG)==null||a.destroy(),(d=this.yG)==null||d.destroy(),(l=this.BG)==null||l.destroy(),(n=this.OG)==null||n.destroy(),(f=this.EG)==null||f.destroy()}SG(t,r,e,i){if(e.isEmpty)return;let o=e.min*i,a=Math.min(e.max*i,r.length);this.uB.queue.writeBuffer(t,o*4,r,o,a-o),e.clear()}CB(){let t=this.CG;for(let r=0;r<t.length;r++){let e=t[r];e===void 0||e.mesh.primitivePositionUpdateCount===e.positionUpdateCount||(e.positionUpdateCount=e.mesh.primitivePositionUpdateCount,this.dB(e.engine,e.mesh,e.group,e.entityInfo,e.deform))}}dB(t,r,e,i,o){var N,H,q,Y,$;let a=this.RG,d=e.index*4;a[d]=e.rangeBase,a[d+1]=e.instanceCount,a[d+2]=e.viewIndex,a[d+3]=e.chunkBase,this.kG.add(e.index,e.index+1);let l=this.wG;for(let v=0;v<e.chunkCount;v++)l[(e.chunkBase+v)*2]=e.index,l[(e.chunkBase+v)*2+1]=v*ie;this.UG.add(e.chunkBase,e.chunkBase+e.chunkCount);let n=(N=z.getComponentCountPerBufferView(t).get(A))!=null?N:1,f=z.getLocationOffsetOfMemberOfComponent(t,A,"worldMatrix"),u=z.getLocationOffsetOfMemberOfComponent(t,A,"isVisible"),p=z.getLocationOffsetOfMemberOfComponent(t,A,"isBillboard"),g=r.AABB,c=!g.isVanilla(),s=g.minPoint._v,h=g.maxPoint._v,x=(s[0]+h[0])*.5,k=(s[1]+h[1])*.5,b=(s[2]+h[2])*.5,P=(h[0]-s[0])*.5,U=(h[1]-s[1])*.5,I=(h[2]-s[2])*.5,C=this.LG,G=this.$G,S=r.meshEntitiesInner,y=this.cG;for(let v=0;v<e.instanceCount;v++){let m=(e.rangeBase+v)*X,R=i[4*v],_=Math.floor(R/n),W=R%n;C[m]=R,C[m+1]=i[4*v+1],C[m+2]=i[4*v+2],C[m+3]=o!==void 0?y.getInstanceDeformedBase(o,v)+1:i[4*v+3],G[m+4]=x,G[m+5]=k,G[m+6]=b,C[m+7]=((H=f[_])!=null?H:0)+4*W,G[m+8]=P,G[m+9]=U,G[m+10]=I,C[m+11]=((q=u[_])!=null?q:0)*4+W,C[m+12]=((Y=p[_])!=null?Y:0)*4+W;let K=(($=S[v])==null?void 0:$.getTagValue("type"))==="background-assets";o!==void 0?(C[m+13]=ce|(K?J:0),C[m+14]=y.getInstanceBoundsSlot(o,v)):(C[m+13]=!c||K?J:0,C[m+14]=0),C[m+15]=0}this.WG.add(e.rangeBase,e.rangeBase+e.instanceCount)}mB(t,r){if(r<0)return-1;let e=t.componentRepository.getComponent(te,r);if(e==null)return-1;let i=this.XG.get(e);return i===void 0&&(i=this.qG.length,this.qG.push({camera:e}),this.XG.set(e,i)),i}vB(){var l;let t=this.qG,r=t.length;if(r===0)return!1;let e=!1;(this.mG==null||this.bG<r)&&((l=this.mG)==null||l.destroy(),this.bG=Math.max(8,this.bG*2,r),this.mG=this.uB.createBuffer({label:"GpuCulling.views",size:this.bG*le,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.KG=new Float32Array(this.bG*w),this.ZG=new Float32Array(this.bG*w),this.AG.cull.bindGroup=void 0,e=!0);let i=this.KG;for(let n=0;n<r;n++){let f=t[n].camera,u=n*w;if(!f._isAlive){i[u]=0;continue}f.updateFrustum();let p=f.frustum;i[u]=1,i[u+1]=0,i[u+2]=0,i[u+3]=0;for(let c=0;c<6;c++){let s=p.getPlane(c)._v,h=u+4+c*4;i[h]=s[0],i[h+1]=s[1],i[h+2]=s[2],i[h+3]=s[3]}let g=p.corners;for(let c=0;c<8;c++){let s=g[c]._v,h=u+28+c*4;i[h]=s[0],i[h+1]=s[1],i[h+2]=s[2],i[h+3]=1}}let o=r*w,a=this.ZG,d=e;if(!d){for(let n=0;n<o;n++)if(i[n]!==a[n]){d=!0;break}}return d&&(this.uB.queue.writeBuffer(this.mG,0,i,0,o),a.set(i.subarray(0,o))),d}};export{O as GpuCullingArgsByteSize,ee as WebGpuGpuCulling};
