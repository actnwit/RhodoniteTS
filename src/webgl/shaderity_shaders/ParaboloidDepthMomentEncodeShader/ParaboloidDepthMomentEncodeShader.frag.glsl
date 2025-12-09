

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

/* shaderity: @{vertexIn} */

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{getters} */

uniform bool u_frontHemisphere; // initialValue=true

void main (){

/* shaderity: @{mainPrerequisites} */

  float denom = v_position_inWorld.w;
  if (denom < 0.0) {
    discard;
  }

  float depth = v_position_inWorld.z;
  float dx = dFdx(depth);
  float dy = dFdy(depth);

  bool frontHemisphere = get_frontHemisphere(uint(materialSID), 0u);
  if (frontHemisphere) {
    rt0.r = depth; // M1
    rt0.g = sq(depth) + 0.25 * (sq(dx) + sq(dy)); // M2
    rt0.b = 1.0;
    rt0.a = 1.0;
  } else {
    rt0.r = 1.0;
    rt0.g = 1.0;
    rt0.b = depth; // M1
    rt0.a = sq(depth) + 0.25 * (sq(dx) + sq(dy)); // M2
  }


}

