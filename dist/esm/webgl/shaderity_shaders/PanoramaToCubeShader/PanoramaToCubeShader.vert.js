var i=`
#ifdef WEBGL2_MULTI_VIEW
#extension GL_OVR_multiview2 : require
#endif

precision highp float;
precision highp int;


/* shaderity: @{definitions} */

/* shaderity: @{vertexInOut} */

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

void main()
{

  #ifdef RN_USE_MATERIAL_SID_ATTRIBUTE
    #ifdef RN_IS_VERTEX_SHADER
      uint materialSID = a_materialSid;
      v_materialSid = materialSID;
    #else
      uint materialSID = v_materialSid;
    #endif
  #else
    uint materialSID = uint(u_currentComponentSIDs[0]); // index 0 data is the materialSID
  #endif

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = get_lightNumber(0u, 0u);
  #endif

  uint skeletalComponentSID = INVALID_ID;
  #ifdef RN_IS_SKINNING
    #ifdef RN_IS_VERTEX_SHADER
      skeletalComponentSID = a_instanceIds.y;
    #else
      skeletalComponentSID = INVALID_ID;
    #endif
  #endif

uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);

#if defined(WEBGL2_MULTI_VIEW) && defined(RN_IS_VERTEX_SHADER)
  cameraSID += uint(gl_ViewID_OVR);
#endif

#ifdef RN_IS_VERTEX_SHADER
  init_rand(uvec3(uint(gl_VertexID),0u,0u), uvec3(0u));
#else
  init_rand(uvec3(uint(gl_FragCoord.x), uint(gl_FragCoord.y),0u), uvec3(0u));
#endif


float x = float((gl_VertexID & 1) << 2);
float y = float((gl_VertexID & 2) << 1);
v_texcoord_0.x = x * 0.5;
v_texcoord_0.y = y * 0.5;
gl_Position = vec4(x - 1.0, y - 1.0, 0, 1);


}

`,t="vertex",a=!1,r={code:i,shaderStage:t,isFragmentShader:a};export{i as code,r as default,a as isFragmentShader,t as shaderStage};
