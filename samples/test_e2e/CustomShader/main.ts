import type { ShaderityObject } from 'shaderity';
import Rn from '../../../dist/esmdev/index.js';
import { getProcessApproach } from '../common/testHelpers.js';

declare const window: any;

// Init Rhodonite
const processApproach = getProcessApproach(Rn);
const engine = await Rn.Engine.init({
  approach: processApproach,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true, logLevel: Rn.LogLevel.Info }),
});

const light = Rn.createLightEntity(engine);
light.getLight().type = Rn.LightType.Point;
light.getLight().color = Rn.Vector3.fromCopyArray([1, 0, 0]);
light.position = Rn.Vector3.fromCopy3(0, 0, 1);
light.getLight().intensity = 0.2;

// Plane
const material = createCustomShader();
material.setParameter('shadingModel', 2);
const planeEntity = Rn.MeshHelper.createPlane(engine, { material });
planeEntity.localEulerAngles = Rn.Vector3.fromCopy3(Math.PI * 0.5, 0, 0);
planeEntity.localScale = Rn.Vector3.fromCopy3(1, 1, 1);
planeEntity.localPosition = Rn.Vector3.fromCopy3(0, 0, 0.01);

// Render Loop
let count = 0;

engine.startRenderLoop(() => {
  if (!window._rendered && count > 0) {
    window._rendered = true;
    const p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  engine.processAuto();
  count++;
});

function createCustomShader() {
  const vertexShaderGLSL = `

  /* shaderity: @{enableVertexExtensions} */
  /* shaderity: @{glslPrecision} */

  /* shaderity: @{definitions} */

  /* shaderity: @{vertexInOut} */

  /* shaderity: @{prerequisites} */

  /* shaderity: @{getters} */

  /* shaderity: @{matricesGetters} */

  /* shaderity: @{processGeometry} */

  void main()
  {

  /* shaderity: @{mainPrerequisites} */

    mat4 worldMatrix = get_worldMatrix(uint(a_instanceInfo.x));
    mat4 viewMatrix = get_viewMatrix(cameraSID);
    mat4 projectionMatrix = get_projectionMatrix(cameraSID);
    mat3 normalMatrix = get_normalMatrix(uint(a_instanceInfo.x));
    bool isBillboard = get_isBillboard(uint(a_instanceInfo.x));

    // Skeletal
    processGeometry(
      worldMatrix,
      normalMatrix,
      viewMatrix,
      a_position,
      a_normal,
      uvec4(a_joint),
      a_weight,
      isBillboard,
      normalMatrix,
      v_position_inWorld,
      v_normal_inWorld
    );

    gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;

    v_color = a_color;
    v_normal_inWorld = normalMatrix * a_normal;
    v_texcoord_0 = a_texcoord_0;
    v_baryCentricCoord = a_baryCentricCoord.xyz;

    bool visibility = get_isVisible(uint(a_instanceInfo.x));
    if (!visibility)
    {
      gl_Position = vec4(0.0);
    }
  }
  `;

  const fragmentShaderGLSL = `

  /* shaderity: @{glslPrecision} */

  /* shaderity: @{definitions} */

  /* shaderity: @{vertexIn} */
  in vec4 v_shadowCoord;

  /* shaderity: @{prerequisites} */

  uniform int u_shadingModel; // initialValue=0
  uniform float u_alphaCutoff; // initialValue=0.01
  uniform float u_shininess; // initialValue=5
  uniform vec4 u_diffuseColorFactor; // initialValue=(1,1,1,1)
  uniform sampler2D u_diffuseColorTexture; // initialValue=(0,white)
  uniform sampler2D u_normalTexture; // initialValue=(1,blue)
  uniform vec4 u_diffuseColorTextureTransform; // initialValue=(1,1,0,0)
  uniform float u_diffuseColorTextureRotation; // initialValue=0
  uniform sampler2DShadow u_depthTexture; // initialValue=(2,white)

  /* shaderity: @{renderTargetBegin} */

  /* shaderity: @{getters} */

  /* shaderity: @{matricesGetters} */

  /* shaderity: @{opticalDefinition} */

  void main ()
  {

  /* shaderity: @{mainPrerequisites} */

    // Normal
    vec3 normal_inWorld = normalize(v_normal_inWorld);

    vec4 diffuseColorFactor = get_diffuseColorFactor(materialSID, 0u);


    // diffuseColor (Considered to be premultiplied alpha)
    vec4 diffuseColor = vec4(1.0, 1.0, 1.0, 1.0);
    if (v_color != diffuseColor && diffuseColorFactor != diffuseColor) {
      diffuseColor = v_color * diffuseColorFactor;
    } else if (v_color == diffuseColor) {
      diffuseColor = diffuseColorFactor;
    } else if (diffuseColorFactor == diffuseColor) {
      diffuseColor = v_color;
    } else {
      diffuseColor = vec4(1.0, 1.0, 1.0, 1.0);
    }

    // diffuseColorTexture (Considered to be premultiplied alpha)
    vec4 diffuseColorTextureTransform = get_diffuseColorTextureTransform(materialSID, 0u);
    float diffuseColorTextureRotation = get_diffuseColorTextureRotation(materialSID, 0u);
    vec2 diffuseColorTexUv = uvTransform(diffuseColorTextureTransform.xy, diffuseColorTextureTransform.zw, diffuseColorTextureRotation, v_texcoord_0);
    vec4 textureColor = texture(u_diffuseColorTexture, diffuseColorTexUv);
    diffuseColor.rgb *= textureColor.rgb;
    diffuseColor.a *= textureColor.a;

    float alpha = diffuseColor.a;
  /* shaderity: @{alphaProcess} */
    diffuseColor.a = alpha;

    // Lighting
    vec3 shadingColor = vec3(0.0, 0.0, 0.0);
  #ifdef RN_IS_LIGHTING
    int shadingModel = get_shadingModel(materialSID, 0u);
    if (shadingModel > 0) {

      vec3 diffuse = vec3(0.0, 0.0, 0.0);
      vec3 specular = vec3(0.0, 0.0, 0.0);
      for (int i = 0; i < /* shaderity: @{Config.maxLightNumber} */ ; i++) {
        if (i >= lightNumber) {
          break;
        }

        // Light
        Light light = getLight(i, v_position_inWorld.xyz);

        // Diffuse
        diffuse += diffuseColor.rgb * max(0.0, dot(normal_inWorld, light.direction)) * light.attenuatedIntensity;

        float shininess = get_shininess(materialSID, 0u);
        int shadingModel = get_shadingModel(materialSID, 0u);

        vec3 viewPosition = get_viewPosition(cameraSID);

        // Specular
        if (shadingModel == 2) {// BLINN
          // ViewDirection
          vec3 viewDirection = normalize(viewPosition - v_position_inWorld.xyz);
          vec3 halfVector = normalize(light.direction + viewDirection);
          specular += pow(max(0.0, dot(halfVector, normal_inWorld)), shininess);
        } else if (shadingModel == 3) { // PHONG
          vec3 viewDirection = normalize(viewPosition - v_position_inWorld.xyz);
          vec3 R = reflect(light.direction, normal_inWorld);
          specular += pow(max(0.0, dot(R, viewDirection)), shininess);
        }

      }

      shadingColor = diffuse + specular;
    } else {
      shadingColor = diffuseColor.rgb;
    }
  #else
    shadingColor = diffuseColor.rgb;
  #endif

    rt0 = vec4(shadingColor * diffuseColor.a, diffuseColor.a);
  }

  `;
  const shaderityObjectVertexWebGL = {
    code: vertexShaderGLSL,
    shaderStage: 'vertex',
    isFragmentShader: false,
  };

  const shaderityObjectFragmentWebGL = {
    code: fragmentShaderGLSL,
    shaderStage: 'fragment',
    isFragmentShader: true,
  };

  const vertexShaderWGSL = `
/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */
/* shaderity: @{processGeometry} */

@vertex
fn main(
/* shaderity: @{vertexInput} */
) -> VertexOutput {

/* shaderity: @{mainPrerequisites} */

  var output : VertexOutput;
  let instanceId = u32(instance_ids.x);

  let worldMatrix = get_worldMatrix(instanceId);
  let viewMatrix = get_viewMatrix(cameraSID);
  let projectionMatrix = get_projectionMatrix(cameraSID);
  var normalMatrix = get_normalMatrix(instanceId);
  let isBillboard = get_isBillboard(instanceId);

  let skeletalComponentSID = i32(instance_ids.y);
  let blendShapeComponentSID = u32(instance_ids.z);


#ifdef RN_USE_NORMAL
#else
  let normal = vec3<f32>(0.0, 0.0, 0.0);
#endif

#ifdef RN_USE_JOINTS_0
  let joint = joints_0;
#else
  let joint = vec4<u32>(0, 0, 0, 0);
#endif
#ifdef RN_USE_WEIGHTS_0
  let weight = weights_0;
#else
  let weight = vec4<f32>(0.0, 0.0, 0.0, 0.0);
#endif
#ifdef RN_USE_BARY_CENTRIC_COORD
#else
  let baryCentricCoord = vec4<f32>(0.0, 0.0, 0.0, 0.0);
#endif

  // Skeletal
  var position_inWorld = vec4<f32>(0.0, 0.0, 0.0, 1.0);
  var normal_inWorld = vec3<f32>(0.0, 0.0, 0.0);
  let geom = processGeometry(
    worldMatrix,
    normalMatrix,
    viewMatrix,
    position,
    normal,
    joint,
    weight,
    isBillboard,
    &normalMatrix,
    &position_inWorld,
    &normal_inWorld
  );

  output.position = projectionMatrix * viewMatrix * position_inWorld;
  output.position_inWorld = position_inWorld;
  output.normal_inWorld = normal_inWorld;

#ifdef RN_USE_COLOR_0
  output.color_0 = vec4f(color_0);
#else
  output.color_0 = vec4f(1.0, 1.0, 1.0, 1.0);
#endif

#ifdef RN_USE_TEXCOORD_0
  output.texcoord_0 = texcoord_0;
#endif
#ifdef RN_USE_TEXCOORD_1
  output.texcoord_1 = texcoord_1;
#endif
#ifdef RN_USE_TEXCOORD_2
  output.texcoord_2 = texcoord_2;
#endif

  output.baryCentricCoord = baryCentricCoord.xyz;

  let visibility = get_isVisible(instanceId);
  if (!visibility)
  {
    output.position = vec4f(0.0, 0.0, 0.0, 1.0);
  }

#ifdef RN_USE_SHADOW_MAPPING
  output.shadowCoord = get_depthBiasPV(materialSID, 0) * position_inWorld;
#endif

  return output;

}

  `;

  const fragmentShaderWGSL = `
/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

/* shaderity: @{opticalDefinition} */


// #param shadingModel: u32; // initialValue=0
// #param alphaCutoff: f32; // initialValue=0.01
// #param shininess: f32; // initialValue=5
// #param diffuseColorFactor: vec4<f32>; // initialValue=(1,1,1,1)
@group(1) @binding(0) var diffuseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(0) var diffuseColorSampler: sampler;
@group(1) @binding(1) var normalTexture: texture_2d<f32>; // initialValue=blue
@group(2) @binding(1) var normalSampler: sampler;
// #param diffuseColorTextureTransform: vec4<f32>; // initialValue=(1,1,0,0)
// #param diffuseColorTextureRotation: f32; // initialValue=0
@group(1) @binding(2) var depthTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(2) var depthSampler: sampler;

@fragment
fn main (
  input: VertexOutput,
  @builtin(front_facing) isFront: bool,
) -> @location(0) vec4<f32> {

/* shaderity: @{mainPrerequisites} */

  // Normal
  let normal_inWorld = normalize(input.normal_inWorld);

  let diffuseColorFactor = get_diffuseColorFactor(materialSID, 0);

  // diffuseColor (Considered to be premultiplied alpha)
  var diffuseColor = vec3f(1.0, 1.0, 1.0);
  var alpha = 1.0;
#ifdef RN_USE_COLOR_0
  diffuseColor = input.color_0.rgb;
  alpha = input.color_0.a;
#endif
  diffuseColor *= diffuseColorFactor.rgb;
  alpha *= diffuseColorFactor.a;

#ifdef RN_USE_TEXCOORD_0
  // diffuseColorTexture (Considered to be premultiplied alpha)
  let diffuseColorTextureTransform = get_diffuseColorTextureTransform(materialSID, 0);
  let diffuseColorTextureRotation = get_diffuseColorTextureRotation(materialSID, 0);
  let diffuseColorTexUv = uvTransform(diffuseColorTextureTransform.xy, diffuseColorTextureTransform.zw, diffuseColorTextureRotation, input.texcoord_0);
  let textureColor = textureSample(diffuseColorTexture, diffuseColorSampler, diffuseColorTexUv);
  diffuseColor *= textureColor.rgb;
  alpha *= textureColor.a;
#endif

/* shaderity: @{alphaProcess} */

  // Lighting
  var shadingColor = vec3f(0.0, 0.0, 0.0);
#ifdef RN_IS_LIGHTING
  let shadingModel = get_shadingModel(materialSID, 0);
  if (shadingModel > 0) {

    var diffuse = vec3(0.0, 0.0, 0.0);
    var specular = vec3(0.0, 0.0, 0.0);
    let lightNumber = u32(get_lightNumber(0u, 0u));
    for (var i = 0u; i < lightNumber ; i++) {

      // Light
      let light: Light = getLight(i, input.position_inWorld.xyz);

      // Diffuse
      diffuse += diffuseColor * max(0.0, dot(normal_inWorld, light.direction)) * light.attenuatedIntensity;

      let shininess = get_shininess(materialSID, 0);
      let shadingModel = get_shadingModel(materialSID, 0);

      let viewPosition = get_viewPosition(cameraSID);

      // Specular
      if (shadingModel == 2) {// BLINN
        // ViewDirection
        let viewDirection = normalize(viewPosition - input.position_inWorld.xyz);
        let halfVector = normalize(light.direction + viewDirection);
        specular += pow(max(0.0, dot(halfVector, normal_inWorld)), shininess);
      } else if (shadingModel == 3) { // PHONG
        let viewDirection = normalize(viewPosition - input.position_inWorld.xyz);
        let R = reflect(light.direction, normal_inWorld);
        specular += pow(max(0.0, dot(R, viewDirection)), shininess);
      }

    }

    shadingColor = diffuse + specular;
  } else {
    shadingColor = diffuseColor;
  }
#else
  shadingColor = diffuseColor;
#endif

  var finalColor = vec4f(shadingColor * alpha, alpha);

  return finalColor;
}

  `;
  const shaderityObjectVertexWebGPU = {
    code: vertexShaderWGSL,
    shaderStage: 'vertex',
    isFragmentShader: false,
  };
  const shaderityObjectFragmentWebGPU = {
    code: fragmentShaderWGSL,
    shaderStage: 'fragment',
    isFragmentShader: true,
  };
  const materialContent = new Rn.CustomMaterialContent(engine, {
    name: 'CustomShader',
    isMorphing: false,
    isSkinning: true,
    isLighting: true,
    vertexShader: shaderityObjectVertexWebGL as ShaderityObject,
    pixelShader: shaderityObjectFragmentWebGL as ShaderityObject,
    vertexShaderWebGpu: shaderityObjectVertexWebGPU as ShaderityObject,
    pixelShaderWebGpu: shaderityObjectFragmentWebGPU as ShaderityObject,
    additionalShaderSemanticInfo: [],
  });

  const material = Rn.MaterialHelper.createMaterial(engine, materialContent);
  material.addShaderDefine('RN_IS_LIGHTING');
  material.addShaderDefine('RN_IS_SKINNING');

  return material;
}
