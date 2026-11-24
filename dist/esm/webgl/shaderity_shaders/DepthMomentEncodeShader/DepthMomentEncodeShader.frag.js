var t=`

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

/* shaderity: @{vertexIn} */

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{getters} */


void main (){

/* shaderity: @{mainPrerequisites} */

  float depth = gl_FragCoord.z;
  float dx = dFdx(depth);
  float dy = dFdy(depth);

  rt0.x = depth; // M1
  rt0.y = sq(depth) + 0.25 * (sq(dx) + sq(dy)); // M2
  rt0.z = 0.0;
  rt0.w = 1.0;


}

`,r="fragment",d=!0,i={code:t,shaderStage:r,isFragmentShader:d};export{t as code,i as default,d as isFragmentShader,r as shaderStage};
