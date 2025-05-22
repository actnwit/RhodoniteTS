let materialSID = uniformDrawParameters.materialSid;
let currentPrimitiveIdx = uniformDrawParameters.currentPrimitiveIdx;
let morphTargetNumber = uniformDrawParameters.morphTargetNumber;
let cameraSID = uniformDrawParameters.cameraSID;

#ifdef RN_IS_VERTEX_SHADER

#ifdef RN_USE_INSTANCE
a_instanceIds = instance_ids;
#endif

a_position = position;

#ifdef RN_USE_NORMAL
a_normal = normal;
#endif

#ifdef RN_USE_TANGENT
a_tangent = tangent;
#endif

#ifdef RN_USE_TEXCOORD_0
a_texcoord_0 = texcoord_0;
#endif

#ifdef RN_USE_TEXCOORD_1
a_texcoord_1 = texcoord_1;
#endif

#if defined(RN_USE_COLOR_0_FLOAT) || defined(RN_USE_COLOR_0_INT) || defined(RN_USE_COLOR_0_UINT)
a_color_0 = color_0;
#endif

#ifdef RN_USE_JOINTS_0
a_joint = joints_0;
#endif

#ifdef RN_USE_WEIGHTS_0
a_weight = weights_0;
#endif

#ifdef RN_USE_BARY_CENTRIC_COORD
a_baryCentricCoord = baryCentricCoord;
#endif

#ifdef RN_USE_TEXCOORD_2
a_texcoord_2 = texcoord_2;
#endif

#endif // RN_IS_VERTEX_SHADER
