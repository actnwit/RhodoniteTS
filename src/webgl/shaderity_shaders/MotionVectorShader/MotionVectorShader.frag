

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

/* shaderity: @{vertexIn} */

in vec4 v_currentPosition_inClip;
in vec4 v_previousPosition_inClip;

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{getters} */


void main (){

/* shaderity: @{mainPrerequisites} */

  // The motion from the previous frame in texture coordinates. In WebGL, the texture coordinates of a
  // render target have the same orientation as NDC (both y up), so the NDC motion is halved.
  vec2 velocity = vec2(2.0, 2.0); // moves the history lookup off screen, i.e. rejects the history
  if (v_previousPosition_inClip.w > 0.0) {
    vec2 currentNdc = v_currentPosition_inClip.xy / v_currentPosition_inClip.w;
    vec2 previousNdc = v_previousPosition_inClip.xy / v_previousPosition_inClip.w;
    velocity = (currentNdc - previousNdc) * 0.5;
  }

  // z: the depth, used to pick the motion vector of the closest surface around a pixel.
  rt0 = vec4(velocity, gl_FragCoord.z, 1.0);
}
