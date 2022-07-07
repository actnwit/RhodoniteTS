import Rn from '../../../dist/esm/index.mjs';
// import Rn from '../../../';

declare const window: any;

const myVertexShaderityObject: Rn.RnShaderityObject = {
  shaderStage: 'vertex',
  isFragmentShader: false,
  code: `
attribute vec3 a_position;
attribute vec3 a_color;
attribute vec3 a_normal;
attribute float a_instanceInfo;
attribute vec2 a_texcoord_0;
attribute vec4 a_joint;
attribute vec4 a_weight;
attribute vec4 a_baryCentricCoord;
varying vec3 v_color;
varying vec3 v_normal_inWorld;
varying vec4 v_position_inWorld;
varying vec2 v_texcoord_0;
varying vec3 v_baryCentricCoord;
const float Epsilon = 0.0000001;
#define saturateEpsilonToOne(x) clamp(x, Epsilon, 1.0)

uniform float u_materialSID; // skipProcess = true

uniform highp sampler2D u_dataTexture; // skipProcess = true

const int widthOfDataTexture = 4096;
const int heightOfDataTexture = 4096;
#if defined(GLSL_ES3) && defined(RN_IS_FASTEST_MODE) && defined(RN_IS_UBO_ENABLED)
    const int dataUBOVec4Size = -0.0625;
    vec4 fetchVec4FromVec4Block(int vec4Idx) {
        int vec4IdxForEachBlock = vec4Idx % dataUBOVec4Size;
        if (vec4Idx < dataUBOVec4Size) {
            return vec4Block0[vec4IdxForEachBlock];
        }

    }
#endif


highp vec4 fetchElement(int vec4_idx) {
    #if defined(GLSL_ES3) && defined(RN_IS_FASTEST_MODE) && defined(RN_IS_UBO_ENABLED)
        if (vec4_idx < dataUBOVec4Size) {
            return fetchVec4FromVec4Block(vec4_idx);
        }
        else {
            int idxOnDataTex = vec4_idx - dataUBOVec4Size;
            highp ivec2 uv = ivec2(idxOnDataTex % widthOfDataTexture, idxOnDataTex / widthOfDataTexture);
            return texelFetch( u_dataTexture, uv, 0 );
        }
        #elif defined(GLSL_ES3)
        highp ivec2 uv = ivec2(vec4_idx % widthOfDataTexture, vec4_idx / widthOfDataTexture);
        return texelFetch( u_dataTexture, uv, 0 );
    #else
        // This idea from https://qiita.com/YVT/items/c695ab4b3cf7faa93885
        highp vec2 invSize = vec2(1.0/float(widthOfDataTexture), 1.0/float(heightOfDataTexture));
        highp float t = (float(vec4_idx) + 0.5) * invSize.x;
        highp float x = fract(t);
        highp float y = (floor(t) + 0.5) * invSize.y;
        #ifdef GLSL_ES3
            return texture2D( u_dataTexture, vec2(x, y));
        #else
            return texture2D( u_dataTexture, vec2(x, y));
        #endif
    #endif
}
vec2 fetchVec2No16BytesAligned(int scalar_idx) {
    #ifdef GLSL_ES3
        int posIn4bytes = scalar_idx % 4;
    #else
        int posIn4bytes = int(mod(float(scalar_idx), 4.0));
    #endif

    int basePosIn16bytes = (scalar_idx - posIn4bytes) / 4;
    if (posIn4bytes == 0) {
        vec4 val = fetchElement(basePosIn16bytes);
        return val.xy;
    }
    else if (posIn4bytes == 1) {
        vec4 val0 = fetchElement(basePosIn16bytes);
        return vec2(val0.yz);
    }
    else if (posIn4bytes == 2) {
        vec4 val0 = fetchElement(basePosIn16bytes);
        vec4 val1 = fetchElement(basePosIn16bytes+1);
        return vec2(val0.zw);
    }
    else {
        // posIn4bytes == 3
        vec4 val0 = fetchElement(basePosIn16bytes);
        vec4 val1 = fetchElement(basePosIn16bytes+1);
        return vec2(val0.w, val1.x);
    }

}
vec3 fetchVec3No16BytesAligned(int scalar_idx) {
    #ifdef GLSL_ES3
        int posIn4bytes = scalar_idx % 4;
    #else
        int posIn4bytes = int(mod(float(scalar_idx), 4.0));
    #endif

    int basePosIn16bytes = (scalar_idx - posIn4bytes) / 4;
    if (posIn4bytes == 0) {
        vec4 val = fetchElement(basePosIn16bytes);
        return val.xyz;
    }
    else if (posIn4bytes == 1) {
        vec4 val0 = fetchElement(basePosIn16bytes);
        return vec3(val0.yzw);
    }
    else if (posIn4bytes == 2) {
        vec4 val0 = fetchElement(basePosIn16bytes);
        vec4 val1 = fetchElement(basePosIn16bytes+1);
        return vec3(val0.zw, val1.x);
    }
    else {
        // posIn4bytes == 3
        vec4 val0 = fetchElement(basePosIn16bytes);
        vec4 val1 = fetchElement(basePosIn16bytes+1);
        return vec3(val0.w, val1.xy);
    }

}
vec4 fetchVec4(int vec4_idx) {
    return fetchElement(vec4_idx);
}
float fetchScalarNo16BytesAligned(int scalar_idx) {
    #ifdef GLSL_ES3
        int posIn4bytes = scalar_idx % 4;
    #else
        int posIn4bytes = int(mod(float(scalar_idx), 4.0));
    #endif
    int basePosIn16bytes = (scalar_idx - posIn4bytes) / 4;
    vec4 val = fetchElement(basePosIn16bytes);
    if (posIn4bytes == 0) {
        return val.x;
    }
    else if (posIn4bytes == 1) {
        return val.y;
    }
    else if (posIn4bytes == 2) {
        return val.z;
    }
    else if (posIn4bytes == 3) {
        return val.w;
    }

}
mat2 fetchMat2No16BytesAligned(int scalar_idx) {
    int vec4_idx = scalar_idx*4;
    vec4 col0 = fetchElement(vec4_idx);
    mat2 val = mat2(
    col0.x, col0.y, col0.z, col0.w
    );
    return val;
}
mat2 fetchMat2(int vec4_idx) {
    vec4 col0 = fetchElement(vec4_idx);
    mat2 val = mat2(
    col0.x, col0.y, col0.z, col0.w
    );
    return val;
}
mat3 fetchMat3No16BytesAligned(int scalar_idx) {
    #ifdef GLSL_ES3
        int posIn4bytes = scalar_idx % 4;
    #else
        int posIn4bytes = int(mod(float(scalar_idx), 4.0));
    #endif

    int basePosIn16bytes = (scalar_idx - posIn4bytes) / 4;
    if (posIn4bytes == 0) {
        vec4 col0 = fetchElement(basePosIn16bytes);
        vec4 col1 = fetchElement(basePosIn16bytes + 1);
        vec4 col2 = fetchElement(basePosIn16bytes + 2);
        mat3 val = mat3(
        col0.x, col0.y, col0.z, col0.w, col1.x, col1.y, col1.z, col1.w, col2.x
        );
        return val;
    }
    else if (posIn4bytes == 1) {
        vec4 col0 = fetchElement(basePosIn16bytes);
        vec4 col1 = fetchElement(basePosIn16bytes + 1);
        vec4 col2 = fetchElement(basePosIn16bytes + 2);
        mat3 val = mat3(
        col0.y, col0.z, col0.w, col1.x, col1.y, col1.z, col1.w, col2.x, col2.y
        );
        return val;
    }
    else if (posIn4bytes == 2) {
        vec4 col0 = fetchElement(basePosIn16bytes);
        vec4 col1 = fetchElement(basePosIn16bytes + 1);
        vec4 col2 = fetchElement(basePosIn16bytes + 2);
        mat3 val = mat3(
        col0.z, col0.w, col1.x, col1.y, col1.z, col1.w, col2.x, col2.y, col2.z
        );
        return val;
    }
    else {
        // posIn4bytes == 3
        vec4 col0 = fetchElement(basePosIn16bytes);
        vec4 col1 = fetchElement(basePosIn16bytes + 1);
        vec4 col2 = fetchElement(basePosIn16bytes + 2);
        mat3 val = mat3(
        col0.w, col1.x, col1.y, col1.z, col1.w, col2.x, col2.y, col2.z, col2.w
        );
        return val;
    }

}
mat3 fetchMat3(int vec4_idx) {
    vec4 col0 = fetchElement(vec4_idx);
    vec4 col1 = fetchElement(vec4_idx + 1);
    vec4 col2 = fetchElement(vec4_idx + 2);
    mat3 val = mat3(
    col0.x, col0.y, col0.z, col0.w, col1.x, col1.y, col1.z, col1.w, col2.x
    );
    return val;
}
mat4 fetchMat4No16BytesAligned(int scalar_idx) {
    #ifdef GLSL_ES3
        int posIn4bytes = scalar_idx % 4;
    #else
        int posIn4bytes = int(mod(float(scalar_idx), 4.0));
    #endif

    int basePosIn16bytes = (scalar_idx - posIn4bytes) / 4;
    if (posIn4bytes == 0) {
        vec4 col0 = fetchElement(basePosIn16bytes);
        vec4 col1 = fetchElement(basePosIn16bytes + 1);
        vec4 col2 = fetchElement(basePosIn16bytes + 2);
        vec4 col3 = fetchElement(basePosIn16bytes + 3);
        mat4 val = mat4(
        col0.x, col0.y, col0.z, col0.w, col1.x, col1.y, col1.z, col1.w, col2.x, col2.y, col2.z, col2.w, col3.x, col3.y, col3.z, col3.w
        );
        return val;
    }
    else if (posIn4bytes == 1) {
        vec4 col0 = fetchElement(basePosIn16bytes);
        vec4 col1 = fetchElement(basePosIn16bytes + 1);
        vec4 col2 = fetchElement(basePosIn16bytes + 2);
        vec4 col3 = fetchElement(basePosIn16bytes + 3);
        vec4 col4 = fetchElement(basePosIn16bytes + 4);
        mat4 val = mat4(
        col0.y, col0.z, col0.w, col1.x, col1.y, col1.z, col1.w, col2.x, col2.y, col2.z, col2.w, col3.x, col3.y, col3.z, col3.w, col4.x
        );
        return val;
    }
    else if (posIn4bytes == 2) {
        vec4 col0 = fetchElement(basePosIn16bytes);
        vec4 col1 = fetchElement(basePosIn16bytes + 1);
        vec4 col2 = fetchElement(basePosIn16bytes + 2);
        vec4 col3 = fetchElement(basePosIn16bytes + 3);
        vec4 col4 = fetchElement(basePosIn16bytes + 4);
        mat4 val = mat4(
        col0.z, col0.w, col1.x, col1.y, col1.z, col1.w, col2.x, col2.y, col2.z, col2.w, col3.x, col3.y, col3.z, col3.w, col4.x, col4.y
        );
        return val;
    }
    else {
        // posIn4bytes == 3
        vec4 col0 = fetchElement(basePosIn16bytes);
        vec4 col1 = fetchElement(basePosIn16bytes + 1);
        vec4 col2 = fetchElement(basePosIn16bytes + 2);
        vec4 col3 = fetchElement(basePosIn16bytes + 3);
        vec4 col4 = fetchElement(basePosIn16bytes + 4);
        mat4 val = mat4(
        col0.w, col1.x, col1.y, col1.z, col1.w, col2.x, col2.y, col2.z, col2.w, col3.x, col3.y, col3.z, col3.w, col4.x, col4.y, col4.z
        );
        return val;
    }

}
mat4 fetchMat4(int vec4_idx) {
    vec4 col0 = fetchElement(vec4_idx);
    vec4 col1 = fetchElement(vec4_idx + 1);
    vec4 col2 = fetchElement(vec4_idx + 2);
    vec4 col3 = fetchElement(vec4_idx + 3);
    mat4 val = mat4(
    col0.x, col0.y, col0.z, col0.w, col1.x, col1.y, col1.z, col1.w, col2.x, col2.y, col2.z, col2.w, col3.x, col3.y, col3.z, col3.w
    );
    return val;
}
float rand(const vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}
vec3 descramble(vec3 v) {
    float seed = 0.0;
    v.x -= sin(fract(v.y*20.0));
    v.z -= cos(fract(-v.y*10.0));
    return v;
}
const float PI = 3.14159265358979323846;
uniform float u_pointSize;
float get_pointSize(float instanceId, int index) {
    return u_pointSize;
}
uniform vec3 u_pointDistanceAttenuation;
vec3 get_pointDistanceAttenuation(float instanceId, int index) {
    return u_pointDistanceAttenuation;
}
uniform float u_currentComponentSIDs[13];
float get_currentComponentSIDs(float instanceId, int index) {
    float val;
    for (int i = 0; i<13; i++) {
        if (i == index) {
            val = u_currentComponentSIDs[i];
            break;
        }

    }
    return val;
}
uniform mat4 u_viewMatrix;
mat4 get_viewMatrix(float instanceId, int index) {
    return u_viewMatrix;
}
uniform mat4 u_projectionMatrix;
mat4 get_projectionMatrix(float instanceId, int index) {
    return u_projectionMatrix;
}
uniform vec3 u_viewPosition;
vec3 get_viewPosition(float instanceId, int index) {
    return u_viewPosition;
}
uniform vec4 u_boneTranslatePackedQuat[50];
vec4 get_boneTranslatePackedQuat(float instanceId, int index) {
    vec4 val;
    for (int i = 0; i<50; i++) {
        if (i == index) {
            val = u_boneTranslatePackedQuat[i];
            break;
        }

    }
    return val;
}
uniform vec4 u_boneScalePackedQuat[50];
vec4 get_boneScalePackedQuat(float instanceId, int index) {
    vec4 val;
    for (int i = 0; i<50; i++) {
        if (i == index) {
            val = u_boneScalePackedQuat[i];
            break;
        }

    }
    return val;
}
uniform int u_skinningMode;
int get_skinningMode(float instanceId, int index) {
    return u_skinningMode;
}
uniform int u_lightNumber;
int get_lightNumber(float instanceId, int index) {
    return u_lightNumber;
}
uniform mat4 u_worldMatrix;
uniform mat3 u_normalMatrix;
mat4 get_worldMatrix(float instanceId) {
    return u_worldMatrix;
}
mat3 get_normalMatrix(float instanceId) {
    return u_normalMatrix;
}
float get_isVisible(float instanceId) {
    return 1.0;
}
#ifdef RN_IS_VERTEX_SHADER
    # ifdef RN_IS_MORPHING
    vec3 get_position(float vertexId, vec3 basePosition) {
        vec3 position = basePosition;
        int scalar_idx = 3 * int(vertexId);
        #ifdef GLSL_ES3
            int posIn4bytes = scalar_idx % 4;
        #else
            int posIn4bytes = int(mod(float(scalar_idx), 4.0));
        #endif
        for (int i = 0; i<41; i++) {
            int basePosIn16bytes = u_dataTextureMorphOffsetPosition[i] + (scalar_idx - posIn4bytes)/4;
            vec3 addPos = vec3(0.0);
            if (posIn4bytes == 0) {
                vec4 val = fetchElement(basePosIn16bytes);
                addPos = val.xyz;
            }
            else if (posIn4bytes == 1) {
                vec4 val0 = fetchElement(basePosIn16bytes);
                addPos = vec3(val0.yzw);
            }
            else if (posIn4bytes == 2) {
                vec4 val0 = fetchElement(basePosIn16bytes);
                vec4 val1 = fetchElement(basePosIn16bytes+1);
                addPos = vec3(val0.zw, val1.x);
            }
            else if (posIn4bytes == 3) {
                vec4 val0 = fetchElement(basePosIn16bytes);
                vec4 val1 = fetchElement(basePosIn16bytes+1);
                addPos = vec3(val0.w, val1.xy);
            }
            // int index = u_dataTextureMorphOffsetPosition[i] + 1 * int(vertexId);
            // vec3 addPos = fetchElement(u_dataTexture, index, widthOfDataTexture, heightOfDataTexture).xyz;

            position += addPos * u_morphWeights[i];
            if (i == u_morphTargetNumber-1) {
                break;
            }

        }
        return position;
    }
    # endif
#endif


mat3 toNormalMatrix(mat4 m) {
    float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3], a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3], a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3], a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3];
    float b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    float determinantVal = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    return mat3(
    a11 * b11 - a12 * b10 + a13 * b09, a12 * b08 - a10 * b11 - a13 * b07, a10 * b10 - a11 * b08 + a13 * b06, a02 * b10 - a01 * b11 - a03 * b09, a00 * b11 - a02 * b08 + a03 * b07, a01 * b08 - a00 * b10 - a03 * b06, a31 * b05 - a32 * b04 + a33 * b03, a32 * b02 - a30 * b05 - a33 * b01, a30 * b04 - a31 * b02 + a33 * b00) / determinantVal;
}
#ifdef RN_IS_SKINNING

    highp mat4 createMatrixFromQuaternionTranslationScale( highp vec4 quaternion, highp vec3 translation, highp vec3 scale ) {
        highp vec4 q = quaternion;
        highp vec3 t = translation;
        highp float sx = q.x * q.x;
        highp float sy = q.y * q.y;
        highp float sz = q.z * q.z;
        highp float cx = q.y * q.z;
        highp float cy = q.x * q.z;
        highp float cz = q.x * q.y;
        highp float wx = q.w * q.x;
        highp float wy = q.w * q.y;
        highp float wz = q.w * q.z;
        highp mat4 mat = mat4(
        1.0 - 2.0 * (sy + sz), 2.0 * (cz + wz), 2.0 * (cy - wy), 0.0, 2.0 * (cz - wz), 1.0 - 2.0 * (sx + sz), 2.0 * (cx + wx), 0.0, 2.0 * (cy + wy), 2.0 * (cx - wx), 1.0 - 2.0 * (sx + sy), 0.0, t.x, t.y, t.z, 1.0
        );
        highp mat4 uniformScaleMat = mat4(
        scale.x, 0.0, 0.0, 0.0, 0.0, scale.y, 0.0, 0.0, 0.0, 0.0, scale.z, 0.0, 0.0, 0.0, 0.0, 1.0
        );
        return mat*uniformScaleMat;
    }
    highp vec4 unpackedVec2ToNormalizedVec4(highp vec2 vec_xy, highp float criteria) {
        highp float r;
        highp float g;
        highp float b;
        highp float a;
        highp float ix = floor(vec_xy.x * criteria);
        highp float v1x = ix / criteria;
        highp float v1y = ix - floor(v1x) * criteria;
        r = ( v1x + 1.0 ) / (criteria-1.0);
        g = ( v1y + 1.0 ) / (criteria-1.0);
        highp float iy = floor( vec_xy.y * criteria);
        highp float v2x = iy / criteria;
        highp float v2y = iy - floor(v2x) * criteria;
        b = ( v2x + 1.0 ) / (criteria-1.0);
        a = ( v2y + 1.0 ) / (criteria-1.0);
        r -= 1.0/criteria;
        g -= 1.0/criteria;
        b -= 1.0/criteria;
        a -= 1.0/criteria;
        r = r*2.0-1.0;
        g = g*2.0-1.0;
        b = b*2.0-1.0;
        a = a*2.0-1.0;
        return vec4(r, g, b, a);
    }
    mat4 getSkinMatrix(float skeletalComponentSID) {
        #ifdef RN_BONE_DATA_TYPE_Mat44x1
            mat4 skinMat = a_weight.x * get_boneMatrix(skeletalComponentSID, int(a_joint.x));
            skinMat += a_weight.y * get_boneMatrix(skeletalComponentSID, int(a_joint.y));
            skinMat += a_weight.z * get_boneMatrix(skeletalComponentSID, int(a_joint.z));
            skinMat += a_weight.w * get_boneMatrix(skeletalComponentSID, int(a_joint.w));
            #elif defined(RN_BONE_DATA_TYPE_VEC4X2)
            vec2 criteria = vec2(4096.0, 4096.0);
            vec4 tq_x = get_boneTranslatePackedQuat(skeletalComponentSID, int(a_joint.x));
            vec4 sq_x = get_boneScalePackedQuat(skeletalComponentSID, int(a_joint.x));
            vec4 quat = unpackedVec2ToNormalizedVec4(vec2(tq_x.w, sq_x.w), criteria.x);
            mat4 skinMat = a_weight.x * createMatrixFromQuaternionTranslationScale(quat, tq_x.xyz, sq_x.xyz);
            vec4 tq_y = get_boneTranslatePackedQuat(skeletalComponentSID, int(a_joint.y));
            vec4 sq_y = get_boneScalePackedQuat(skeletalComponentSID, int(a_joint.y));
            quat = unpackedVec2ToNormalizedVec4(vec2(tq_y.w, sq_y.w), criteria.x);
            skinMat += a_weight.y * createMatrixFromQuaternionTranslationScale(quat, tq_y.xyz, sq_y.xyz);
            vec4 tq_z = get_boneTranslatePackedQuat(skeletalComponentSID, int(a_joint.z));
            vec4 sq_z = get_boneScalePackedQuat(skeletalComponentSID, int(a_joint.z));
            quat = unpackedVec2ToNormalizedVec4(vec2(tq_z.w, sq_z.w), criteria.x);
            skinMat += a_weight.z * createMatrixFromQuaternionTranslationScale(quat, tq_z.xyz, sq_z.xyz);
            vec4 tq_w = get_boneTranslatePackedQuat(skeletalComponentSID, int(a_joint.w));
            vec4 sq_w = get_boneScalePackedQuat(skeletalComponentSID, int(a_joint.w));
            quat = unpackedVec2ToNormalizedVec4(vec2(tq_w.w, sq_w.w), criteria.x);
            skinMat += a_weight.w * createMatrixFromQuaternionTranslationScale(quat, tq_w.xyz, sq_w.xyz);
            #elif defined(RN_BONE_DATA_TYPE_VEC4X2_OLD)
            vec4 ts_x = get_boneTranslateScale(skeletalComponentSID, int(a_joint.x));
            mat4 skinMat = a_weight.x * createMatrixFromQuaternionTranslationScale(
            get_boneQuaternion(skeletalComponentSID, int(a_joint.x)), ts_x.xyz, vec3(ts_x.w));
            vec4 ts_y = get_boneTranslateScale(skeletalComponentSID, int(a_joint.y));
            skinMat += a_weight.y * createMatrixFromQuaternionTranslationScale(
            get_boneQuaternion(skeletalComponentSID, int(a_joint.y)), ts_y.xyz, vec3(ts_y.w));
            vec4 ts_z = get_boneTranslateScale(skeletalComponentSID, int(a_joint.z));
            skinMat += a_weight.z * createMatrixFromQuaternionTranslationScale(
            get_boneQuaternion(skeletalComponentSID, int(a_joint.z)), ts_z.xyz, vec3(ts_z.w));
            vec4 ts_w = get_boneTranslateScale(skeletalComponentSID, int(a_joint.w));
            skinMat += a_weight.w * createMatrixFromQuaternionTranslationScale(
            get_boneQuaternion(skeletalComponentSID, int(a_joint.w)), ts_w.xyz, vec3(ts_w.w));
            #elif defined(RN_BONE_DATA_TYPE_VEC4X1)
            vec4 boneCompressedChunksX = get_boneCompressedChunk(skeletalComponentSID, int(a_joint.x));
            vec4 boneCompressedChunksY = get_boneCompressedChunk(skeletalComponentSID, int(a_joint.y));
            vec4 boneCompressedChunksZ = get_boneCompressedChunk(skeletalComponentSID, int(a_joint.z));
            vec4 boneCompressedChunksW = get_boneCompressedChunk(skeletalComponentSID, int(a_joint.w));
            vec2 criteria = vec2(4096.0, 4096.0);
            vec4 boneCompressedInfo = get_boneCompressedInfo(0.0, 0);
            vec4 ts_x = unpackedVec2ToNormalizedVec4(boneCompressedChunksX.zw, criteria.y)*boneCompressedInfo;
            mat4 skinMat = a_weight.x * createMatrixFromQuaternionTranslationScale(
            unpackedVec2ToNormalizedVec4(boneCompressedChunksX.xy, criteria.x), ts_x.xyz, vec3(ts_x.w));
            vec4 ts_y = unpackedVec2ToNormalizedVec4(boneCompressedChunksY.zw, criteria.y)*boneCompressedInfo;
            skinMat += a_weight.y * createMatrixFromQuaternionTranslationScale(
            unpackedVec2ToNormalizedVec4(boneCompressedChunksY.xy, criteria.x), ts_y.xyz, vec3(ts_y.w));
            vec4 ts_z = unpackedVec2ToNormalizedVec4(boneCompressedChunksZ.zw, criteria.y)*boneCompressedInfo;
            skinMat += a_weight.z * createMatrixFromQuaternionTranslationScale(
            unpackedVec2ToNormalizedVec4(boneCompressedChunksZ.xy, criteria.x), ts_z.xyz, vec3(ts_z.w));
            vec4 ts_w = unpackedVec2ToNormalizedVec4(boneCompressedChunksW.zw, criteria.y)*boneCompressedInfo;
            skinMat += a_weight.w * createMatrixFromQuaternionTranslationScale(
            unpackedVec2ToNormalizedVec4(boneCompressedChunksW.xy, criteria.x), ts_w.xyz, vec3(ts_w.w));
        #endif
        return skinMat;
    }
#endif



#ifdef RN_IS_SKINNING
    bool skinning(
    float skeletalComponentSID, in mat3 inNormalMatrix, out mat3 outNormalMatrix, in vec3 inPosition_inLocal, out vec4 outPosition_inWorld, in vec3 inNormal_inLocal, out vec3 outNormal_inWorld
    ) {
        mat4 skinMat = getSkinMatrix(skeletalComponentSID);
        outPosition_inWorld = skinMat * vec4(inPosition_inLocal, 1.0);
        outNormalMatrix = toNormalMatrix(skinMat);
        outNormal_inWorld = normalize(outNormalMatrix * inNormal_inLocal);
        return true;
    }
#endif

bool processGeometryWithMorphingAndSkinning(
float skeletalComponentSID, in mat4 worldMatrix, in mat3 inNormalMatrix, out mat3 outNormalMatrix, in vec3 inPosition_inLocal, out vec4 outPosition_inWorld, in vec3 inNormal_inLocal, out vec3 outNormal_inWorld
) {
    bool isSkinning = false;
    vec3 position_inLocal;
    #ifdef RN_IS_MORPHING
        if (u_morphTargetNumber == 0) {
        #endif
        position_inLocal = inPosition_inLocal;
        #ifdef RN_IS_MORPHING
        }
        else {
            float vertexIdx = a_baryCentricCoord.w;
            position_inLocal = get_position(vertexIdx, inPosition_inLocal);
        }
    #endif


    #ifdef RN_IS_SKINNING
        if (skeletalComponentSID >= 0.0) {
            isSkinning = skinning(skeletalComponentSID, inNormalMatrix, outNormalMatrix, position_inLocal, outPosition_inWorld, inNormal_inLocal, outNormal_inWorld);
        }
        else {
        #endif
        outNormalMatrix = inNormalMatrix;
        outPosition_inWorld = worldMatrix * vec4(position_inLocal, 1.0);
        outNormal_inWorld = normalize(inNormalMatrix * inNormal_inLocal);
        #ifdef RN_IS_SKINNING
        }
    #endif

    return isSkinning;
}
void main() {
    #ifdef RN_IS_FASTEST_MODE
        float materialSID = u_currentComponentSIDs[0]; // index 0 data is the materialSID


        int lightNumber = 0;
        #ifdef RN_IS_LIGHTING
            lightNumber = int(u_currentComponentSIDs[8]);
        #endif

        float skeletalComponentSID = -1.0;
        #ifdef RN_IS_SKINNING
            skeletalComponentSID = u_currentComponentSIDs[9];
        #endif

    #else

        float materialSID = u_materialSID;
        int lightNumber = 0;
        #ifdef RN_IS_LIGHTING
            lightNumber = get_lightNumber(0.0, 0);
        #endif

        float skeletalComponentSID = -1.0;
        #ifdef RN_IS_SKINNING
            skeletalComponentSID = float(get_skinningMode(0.0, 0));
        #endif

    #endif


    float cameraSID = u_currentComponentSIDs[7];
    mat4 worldMatrix = get_worldMatrix(a_instanceInfo);
    mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
    mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
    mat3 normalMatrix = get_normalMatrix(a_instanceInfo);

    // Skeletal

    processGeometryWithMorphingAndSkinning(
    skeletalComponentSID, worldMatrix, normalMatrix, normalMatrix, a_position, v_position_inWorld, a_normal, v_normal_inWorld
    );
    gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
    v_color = a_color;
    v_normal_inWorld = normalMatrix * a_normal;
    v_texcoord_0 = a_texcoord_0;
    v_baryCentricCoord = a_baryCentricCoord.xyz;
    float visibility = get_isVisible(a_instanceInfo);
    if (visibility < 0.5) {
        gl_Position = vec4(0.0);
    }
    // #ifdef RN_IS_POINTSPRITE

        vec4 position_inWorld = worldMatrix * vec4(a_position, 1.0);
        vec3 viewPosition = get_viewPosition(cameraSID, 0);
        float distanceFromCamera = length(position_inWorld.xyz - viewPosition);
        vec3 pointDistanceAttenuation = get_pointDistanceAttenuation(materialSID, 0);
        float distanceAttenuationFactor = sqrt(1.0/(pointDistanceAttenuation.x + pointDistanceAttenuation.y * distanceFromCamera + pointDistanceAttenuation.z * distanceFromCamera * distanceFromCamera));
        float maxPointSize = get_pointSize(materialSID, 0);
        gl_PointSize = clamp(distanceAttenuationFactor * maxPointSize, 0.0, maxPointSize);

    // #endif
}
// Vertex Attributes Binding Info
// a_position: POSITION
// a_color: COLOR_0
// a_normal: NORMAL
// a_instanceInfo: INSTANCE
// a_texcoord_0: TEXCOORD_0
// a_joint: JOINTS_0
// a_weight: WEIGHTS_0
// a_baryCentricCoord: BARY_CENTRIC_COORD
`,
};

const myFragmentShaderityObject: Rn.RnShaderityObject = {
  shaderStage: 'fragment',
  isFragmentShader: true,
  code: `

  #ifdef WEBGL1_EXT_SHADER_TEXTURE_LOD
      #extension GL_EXT_shader_texture_lod : require
  #endif

  #ifdef WEBGL1_EXT_STANDARD_DERIVATIVES
      #extension GL_OES_standard_derivatives : require
  #endif

  #ifdef WEBGL1_EXT_DRAW_BUFFERS
      #extension GL_EXT_draw_buffers : require
  #endif

  const float Epsilon = 0.0000001;
  #define saturateEpsilonToOne(x) clamp(x, Epsilon, 1.0)

  uniform float u_materialSID; // skipProcess = true

  uniform highp sampler2D u_dataTexture; // skipProcess = true

  const int widthOfDataTexture = 4096;
  const int heightOfDataTexture = 4096;
  #if defined(GLSL_ES3) && defined(RN_IS_FASTEST_MODE) && defined(RN_IS_UBO_ENABLED)
      const int dataUBOVec4Size = -0.0625;
      vec4 fetchVec4FromVec4Block(int vec4Idx) {
          int vec4IdxForEachBlock = vec4Idx % dataUBOVec4Size;
          if (vec4Idx < dataUBOVec4Size) {
              return vec4Block0[vec4IdxForEachBlock];
          }

      }
  #endif


  highp vec4 fetchElement(int vec4_idx) {
      #if defined(GLSL_ES3) && defined(RN_IS_FASTEST_MODE) && defined(RN_IS_UBO_ENABLED)
          if (vec4_idx < dataUBOVec4Size) {
              return fetchVec4FromVec4Block(vec4_idx);
          }
          else {
              int idxOnDataTex = vec4_idx - dataUBOVec4Size;
              highp ivec2 uv = ivec2(idxOnDataTex % widthOfDataTexture, idxOnDataTex / widthOfDataTexture);
              return texelFetch( u_dataTexture, uv, 0 );
          }
          #elif defined(GLSL_ES3)
          highp ivec2 uv = ivec2(vec4_idx % widthOfDataTexture, vec4_idx / widthOfDataTexture);
          return texelFetch( u_dataTexture, uv, 0 );
      #else
          // This idea from https://qiita.com/YVT/items/c695ab4b3cf7faa93885
          highp vec2 invSize = vec2(1.0/float(widthOfDataTexture), 1.0/float(heightOfDataTexture));
          highp float t = (float(vec4_idx) + 0.5) * invSize.x;
          highp float x = fract(t);
          highp float y = (floor(t) + 0.5) * invSize.y;
          #ifdef GLSL_ES3
              return texture2D( u_dataTexture, vec2(x, y));
          #else
              return texture2D( u_dataTexture, vec2(x, y));
          #endif
      #endif
  }
  vec2 fetchVec2No16BytesAligned(int scalar_idx) {
      #ifdef GLSL_ES3
          int posIn4bytes = scalar_idx % 4;
      #else
          int posIn4bytes = int(mod(float(scalar_idx), 4.0));
      #endif

      int basePosIn16bytes = (scalar_idx - posIn4bytes) / 4;
      if (posIn4bytes == 0) {
          vec4 val = fetchElement(basePosIn16bytes);
          return val.xy;
      }
      else if (posIn4bytes == 1) {
          vec4 val0 = fetchElement(basePosIn16bytes);
          return vec2(val0.yz);
      }
      else if (posIn4bytes == 2) {
          vec4 val0 = fetchElement(basePosIn16bytes);
          vec4 val1 = fetchElement(basePosIn16bytes+1);
          return vec2(val0.zw);
      }
      else {
          // posIn4bytes == 3
          vec4 val0 = fetchElement(basePosIn16bytes);
          vec4 val1 = fetchElement(basePosIn16bytes+1);
          return vec2(val0.w, val1.x);
      }

  }
  vec3 fetchVec3No16BytesAligned(int scalar_idx) {
      #ifdef GLSL_ES3
          int posIn4bytes = scalar_idx % 4;
      #else
          int posIn4bytes = int(mod(float(scalar_idx), 4.0));
      #endif

      int basePosIn16bytes = (scalar_idx - posIn4bytes) / 4;
      if (posIn4bytes == 0) {
          vec4 val = fetchElement(basePosIn16bytes);
          return val.xyz;
      }
      else if (posIn4bytes == 1) {
          vec4 val0 = fetchElement(basePosIn16bytes);
          return vec3(val0.yzw);
      }
      else if (posIn4bytes == 2) {
          vec4 val0 = fetchElement(basePosIn16bytes);
          vec4 val1 = fetchElement(basePosIn16bytes+1);
          return vec3(val0.zw, val1.x);
      }
      else {
          // posIn4bytes == 3
          vec4 val0 = fetchElement(basePosIn16bytes);
          vec4 val1 = fetchElement(basePosIn16bytes+1);
          return vec3(val0.w, val1.xy);
      }

  }
  vec4 fetchVec4(int vec4_idx) {
      return fetchElement(vec4_idx);
  }
  float fetchScalarNo16BytesAligned(int scalar_idx) {
      #ifdef GLSL_ES3
          int posIn4bytes = scalar_idx % 4;
      #else
          int posIn4bytes = int(mod(float(scalar_idx), 4.0));
      #endif
      int basePosIn16bytes = (scalar_idx - posIn4bytes) / 4;
      vec4 val = fetchElement(basePosIn16bytes);
      if (posIn4bytes == 0) {
          return val.x;
      }
      else if (posIn4bytes == 1) {
          return val.y;
      }
      else if (posIn4bytes == 2) {
          return val.z;
      }
      else if (posIn4bytes == 3) {
          return val.w;
      }

  }
  mat2 fetchMat2No16BytesAligned(int scalar_idx) {
      int vec4_idx = scalar_idx*4;
      vec4 col0 = fetchElement(vec4_idx);
      mat2 val = mat2(
      col0.x, col0.y, col0.z, col0.w
      );
      return val;
  }
  mat2 fetchMat2(int vec4_idx) {
      vec4 col0 = fetchElement(vec4_idx);
      mat2 val = mat2(
      col0.x, col0.y, col0.z, col0.w
      );
      return val;
  }
  mat3 fetchMat3No16BytesAligned(int scalar_idx) {
      #ifdef GLSL_ES3
          int posIn4bytes = scalar_idx % 4;
      #else
          int posIn4bytes = int(mod(float(scalar_idx), 4.0));
      #endif

      int basePosIn16bytes = (scalar_idx - posIn4bytes) / 4;
      if (posIn4bytes == 0) {
          vec4 col0 = fetchElement(basePosIn16bytes);
          vec4 col1 = fetchElement(basePosIn16bytes + 1);
          vec4 col2 = fetchElement(basePosIn16bytes + 2);
          mat3 val = mat3(
          col0.x, col0.y, col0.z, col0.w, col1.x, col1.y, col1.z, col1.w, col2.x
          );
          return val;
      }
      else if (posIn4bytes == 1) {
          vec4 col0 = fetchElement(basePosIn16bytes);
          vec4 col1 = fetchElement(basePosIn16bytes + 1);
          vec4 col2 = fetchElement(basePosIn16bytes + 2);
          mat3 val = mat3(
          col0.y, col0.z, col0.w, col1.x, col1.y, col1.z, col1.w, col2.x, col2.y
          );
          return val;
      }
      else if (posIn4bytes == 2) {
          vec4 col0 = fetchElement(basePosIn16bytes);
          vec4 col1 = fetchElement(basePosIn16bytes + 1);
          vec4 col2 = fetchElement(basePosIn16bytes + 2);
          mat3 val = mat3(
          col0.z, col0.w, col1.x, col1.y, col1.z, col1.w, col2.x, col2.y, col2.z
          );
          return val;
      }
      else {
          // posIn4bytes == 3
          vec4 col0 = fetchElement(basePosIn16bytes);
          vec4 col1 = fetchElement(basePosIn16bytes + 1);
          vec4 col2 = fetchElement(basePosIn16bytes + 2);
          mat3 val = mat3(
          col0.w, col1.x, col1.y, col1.z, col1.w, col2.x, col2.y, col2.z, col2.w
          );
          return val;
      }

  }
  mat3 fetchMat3(int vec4_idx) {
      vec4 col0 = fetchElement(vec4_idx);
      vec4 col1 = fetchElement(vec4_idx + 1);
      vec4 col2 = fetchElement(vec4_idx + 2);
      mat3 val = mat3(
      col0.x, col0.y, col0.z, col0.w, col1.x, col1.y, col1.z, col1.w, col2.x
      );
      return val;
  }
  mat4 fetchMat4No16BytesAligned(int scalar_idx) {
      #ifdef GLSL_ES3
          int posIn4bytes = scalar_idx % 4;
      #else
          int posIn4bytes = int(mod(float(scalar_idx), 4.0));
      #endif

      int basePosIn16bytes = (scalar_idx - posIn4bytes) / 4;
      if (posIn4bytes == 0) {
          vec4 col0 = fetchElement(basePosIn16bytes);
          vec4 col1 = fetchElement(basePosIn16bytes + 1);
          vec4 col2 = fetchElement(basePosIn16bytes + 2);
          vec4 col3 = fetchElement(basePosIn16bytes + 3);
          mat4 val = mat4(
          col0.x, col0.y, col0.z, col0.w, col1.x, col1.y, col1.z, col1.w, col2.x, col2.y, col2.z, col2.w, col3.x, col3.y, col3.z, col3.w
          );
          return val;
      }
      else if (posIn4bytes == 1) {
          vec4 col0 = fetchElement(basePosIn16bytes);
          vec4 col1 = fetchElement(basePosIn16bytes + 1);
          vec4 col2 = fetchElement(basePosIn16bytes + 2);
          vec4 col3 = fetchElement(basePosIn16bytes + 3);
          vec4 col4 = fetchElement(basePosIn16bytes + 4);
          mat4 val = mat4(
          col0.y, col0.z, col0.w, col1.x, col1.y, col1.z, col1.w, col2.x, col2.y, col2.z, col2.w, col3.x, col3.y, col3.z, col3.w, col4.x
          );
          return val;
      }
      else if (posIn4bytes == 2) {
          vec4 col0 = fetchElement(basePosIn16bytes);
          vec4 col1 = fetchElement(basePosIn16bytes + 1);
          vec4 col2 = fetchElement(basePosIn16bytes + 2);
          vec4 col3 = fetchElement(basePosIn16bytes + 3);
          vec4 col4 = fetchElement(basePosIn16bytes + 4);
          mat4 val = mat4(
          col0.z, col0.w, col1.x, col1.y, col1.z, col1.w, col2.x, col2.y, col2.z, col2.w, col3.x, col3.y, col3.z, col3.w, col4.x, col4.y
          );
          return val;
      }
      else {
          // posIn4bytes == 3
          vec4 col0 = fetchElement(basePosIn16bytes);
          vec4 col1 = fetchElement(basePosIn16bytes + 1);
          vec4 col2 = fetchElement(basePosIn16bytes + 2);
          vec4 col3 = fetchElement(basePosIn16bytes + 3);
          vec4 col4 = fetchElement(basePosIn16bytes + 4);
          mat4 val = mat4(
          col0.w, col1.x, col1.y, col1.z, col1.w, col2.x, col2.y, col2.z, col2.w, col3.x, col3.y, col3.z, col3.w, col4.x, col4.y, col4.z
          );
          return val;
      }

  }
  mat4 fetchMat4(int vec4_idx) {
      vec4 col0 = fetchElement(vec4_idx);
      vec4 col1 = fetchElement(vec4_idx + 1);
      vec4 col2 = fetchElement(vec4_idx + 2);
      vec4 col3 = fetchElement(vec4_idx + 3);
      mat4 val = mat4(
      col0.x, col0.y, col0.z, col0.w, col1.x, col1.y, col1.z, col1.w, col2.x, col2.y, col2.z, col2.w, col3.x, col3.y, col3.z, col3.w
      );
      return val;
  }
  float rand(const vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }
  vec3 descramble(vec3 v) {
      float seed = 0.0;
      v.x -= sin(fract(v.y*20.0));
      v.z -= cos(fract(-v.y*10.0));
      return v;
  }
  const float PI = 3.14159265358979323846;
  varying vec3 v_color;
  varying vec3 v_normal_inWorld;
  varying vec4 v_position_inWorld;
  varying vec2 v_texcoord_0;
  varying vec3 v_baryCentricCoord;
  vec4 rt0;
  vec4 rt1;
  vec4 rt2;
  vec4 rt3;

  // #pragma shaderity: require(../common/deliot2019SeamlessTexture.glsl)

  // uniform sampler2D u_tInvTexture; // initialValue = (1, white)
  // uniform vec3 u_colorSpaceOrigin;
  // uniform vec3 u_colorSpaceVector1;
  // uniform vec3 u_colorSpaceVector2;
  // uniform vec3 u_colorSpaceVector3;
  // uniform vec4 u_scaleTranslate;


  vec2 uvTransform(vec2 scale, vec2 offset, float rotation, vec2 uv) {
      mat3 translationMat = mat3(1, 0, 0, 0, 1, 0, offset.x, offset.y, 1);
      mat3 rotationMat = mat3(
      cos(rotation), -sin(rotation), 0, sin(rotation), cos(rotation), 0, 0, 0, 1
      );
      mat3 scaleMat = mat3(scale.x, 0, 0, 0, scale.y, 0, 0, 0, 1);
      mat3 matrix = translationMat * rotationMat * scaleMat;
      vec2 uvTransformed = ( matrix * vec3(uv.xy, 1) ).xy;
      return uvTransformed;
  }
  uniform int u_shadingModel;
  int get_shadingModel(float instanceId, int index) {
      return u_shadingModel;
  }
  uniform float u_alphaCutoff;
  float get_alphaCutoff(float instanceId, int index) {
      return u_alphaCutoff;
  }
  uniform float u_shininess;
  float get_shininess(float instanceId, int index) {
      return u_shininess;
  }
  uniform vec4 u_diffuseColorFactor;
  vec4 get_diffuseColorFactor(float instanceId, int index) {
      return u_diffuseColorFactor;
  }
  uniform sampler2D u_diffuseColorTexture;
  uniform sampler2D u_normalTexture;
  uniform vec4 u_diffuseColorTextureTransform;
  vec4 get_diffuseColorTextureTransform(float instanceId, int index) {
      return u_diffuseColorTextureTransform;
  }
  uniform float u_diffuseColorTextureRotation;
  float get_diffuseColorTextureRotation(float instanceId, int index) {
      return u_diffuseColorTextureRotation;
  }
  uniform float u_currentComponentSIDs[13];
  float get_currentComponentSIDs(float instanceId, int index) {
      float val;
      for (int i = 0; i<13; i++) {
          if (i == index) {
              val = u_currentComponentSIDs[i];
              break;
          }

      }
      return val;
  }
  uniform mat4 u_viewMatrix;
  mat4 get_viewMatrix(float instanceId, int index) {
      return u_viewMatrix;
  }
  uniform mat4 u_projectionMatrix;
  mat4 get_projectionMatrix(float instanceId, int index) {
      return u_projectionMatrix;
  }
  uniform vec3 u_viewPosition;
  vec3 get_viewPosition(float instanceId, int index) {
      return u_viewPosition;
  }
  uniform int u_skinningMode;
  int get_skinningMode(float instanceId, int index) {
      return u_skinningMode;
  }
  uniform vec3 u_lightPosition[4];
  vec3 get_lightPosition(float instanceId, int index) {
      vec3 val;
      for (int i = 0; i<4; i++) {
          if (i == index) {
              val = u_lightPosition[i];
              break;
          }

      }
      return val;
  }
  uniform vec3 u_lightDirection[4];
  vec3 get_lightDirection(float instanceId, int index) {
      vec3 val;
      for (int i = 0; i<4; i++) {
          if (i == index) {
              val = u_lightDirection[i];
              break;
          }

      }
      return val;
  }
  uniform vec3 u_lightIntensity[4];
  vec3 get_lightIntensity(float instanceId, int index) {
      vec3 val;
      for (int i = 0; i<4; i++) {
          if (i == index) {
              val = u_lightIntensity[i];
              break;
          }

      }
      return val;
  }
  uniform vec4 u_lightProperty[4];
  vec4 get_lightProperty(float instanceId, int index) {
      vec4 val;
      for (int i = 0; i<4; i++) {
          if (i == index) {
              val = u_lightProperty[i];
              break;
          }

      }
      return val;
  }
  uniform int u_lightNumber;
  int get_lightNumber(float instanceId, int index) {
      return u_lightNumber;
  }
  uniform vec2 u_backBufferTextureSize;
  vec2 get_backBufferTextureSize(float instanceId, int index) {
      return u_backBufferTextureSize;
  }
  uniform ivec2 u_vrState;
  ivec2 get_vrState(float instanceId, int index) {
      return u_vrState;
  }
  struct Light {
      int type; // 0 = directional, 1 = point, 2 = spot

      vec3 position;
      vec3 intensity;
      vec3 attenuatedIntensity;
      vec3 directionOfLightObject;
      vec3 direction; // direction of light vector, equal to normalize(light.pointToLight)

      vec3 pointToLight; // not normalized

      float spotAngleScale;
      float spotAngleOffset;
      float effectiveRange;
  };

  // https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md#range-property

  float getRangeAttenuation(Light light) {
      float distance = length(light.pointToLight);
      if (light.effectiveRange <= 0.0) // means no range limit {
          return 1.0 / pow(distance, 2.0);
      }
      return max(min(1.0 - pow(distance / light.effectiveRange, 4.0), 1.0), 0.0) / pow(distance, 2.0);
  }
  // https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md#inner-and-outer-cone-angles
  float getSpotAttenuation(Light light) {
      float cd = dot(light.directionOfLightObject, light.direction);
      float angularAttenuation = clamp(cd * light.spotAngleScale + light.spotAngleOffset, 0.0, 1.0);
      return angularAttenuation;
  }
  void getLightAttenuated(Light light) {
      light.attenuatedIntensity = light.intensity;
      // if (light.type == 0) { // Directional Light

      // Directional Light don't attenuate geometically
      // }
      if (light.type ! = 0) // Point Light and Spot Light {
          light.attenuatedIntensity *= getRangeAttenuation(light);
      }
      if (light.type == 2) // Spot light {
          light.attenuatedIntensity *= getSpotAttenuation(light);
      }

  }
  Light getLight(int lightIdx, vec3 v_position_inWorld) {
      vec3 lightPosition = get_lightPosition(0.0, lightIdx);
      vec3 direction_and_w_of_LightObject = get_lightDirection(0.0, lightIdx);
      vec3 lightIntensity = get_lightIntensity(0.0, lightIdx);
      vec4 lightProperty = get_lightProperty(0.0, lightIdx);
      Light light;
      light.directionOfLightObject = direction_and_w_of_LightObject;
      float lightType = lightProperty.x;
      light.effectiveRange = lightProperty.y;
      light.spotAngleScale = lightProperty.z;
      light.spotAngleOffset = lightProperty.w;
      light.intensity = lightIntensity;
      light.position = lightPosition;
      if (lightType < -0.5) {
          // disabled light
          light.intensity = vec3(0.0);
          light.type = -1;
      }
      else if (0.75 < lightType) {
          // is pointlight or spotlight
          light.pointToLight = lightPosition - v_position_inWorld;
          light.direction = normalize(light.pointToLight);
          light.type = 1;
      }
      else {
          // is Directional Light
          light.type = 0;
          light.direction = normalize(light.directionOfLightObject);
      }
      if (lightType > 1.75) {
          // is spotlight
          light.type = 2;
      }
      const float M_PI = 3.141592653589793;
      light.intensity *= M_PI; // Punctual Light


      // Attenuation
      light.attenuatedIntensity = light.intensity;
      getLightAttenuated(light);
      return light;
  }
  void main () {
      #ifdef RN_IS_FASTEST_MODE
          float materialSID = u_currentComponentSIDs[0]; // index 0 data is the materialSID


          int lightNumber = 0;
          #ifdef RN_IS_LIGHTING
              lightNumber = int(u_currentComponentSIDs[8]);
          #endif

          float skeletalComponentSID = -1.0;
          #ifdef RN_IS_SKINNING
              skeletalComponentSID = u_currentComponentSIDs[9];
          #endif

      #else

          float materialSID = u_materialSID;
          int lightNumber = 0;
          #ifdef RN_IS_LIGHTING
              lightNumber = get_lightNumber(0.0, 0);
          #endif

          float skeletalComponentSID = -1.0;
          #ifdef RN_IS_SKINNING
              skeletalComponentSID = float(get_skinningMode(0.0, 0));
          #endif

      #endif


      // Normal
      vec3 normal_inWorld = normalize(v_normal_inWorld);
      vec4 diffuseColorFactor = get_diffuseColorFactor(materialSID, 0);


      // diffuseColor (Considered to be premultiplied alpha)

      vec3 diffuseColor = vec3(0.0, 0.0, 0.0);
      float alpha = 1.0;
      if (v_color ! = diffuseColor && diffuseColorFactor.rgb ! = diffuseColor) {
          diffuseColor = v_color * diffuseColorFactor.rgb;
          alpha = diffuseColorFactor.a;
      }
      else if (v_color == diffuseColor) {
          diffuseColor = diffuseColorFactor.rgb;
          alpha = diffuseColorFactor.a;
      }
      else if (diffuseColorFactor.rgb == diffuseColor) {
          diffuseColor = v_color;
      }
      else {
          diffuseColor = vec3(1.0, 1.0, 1.0);
      }
      // diffuseColorTexture (Considered to be premultiplied alpha)
      vec4 diffuseColorTextureTransform = get_diffuseColorTextureTransform(materialSID, 0);
      float diffuseColorTextureRotation = get_diffuseColorTextureRotation(materialSID, 0);
      vec2 diffuseColorTexUv = uvTransform(diffuseColorTextureTransform.xy, diffuseColorTextureTransform.zw, diffuseColorTextureRotation, v_texcoord_0);
      vec4 textureColor = texture2D(u_diffuseColorTexture, diffuseColorTexUv);
      diffuseColor *= textureColor.rgb;
      alpha *= textureColor.a;
      #ifdef RN_IS_ALPHAMODE_MASK
          float alphaCutoff = get_alphaCutoff(materialSID, 0);
          if (alpha < alphaCutoff) {
              discard;
          }
      #endif


      // Lighting
      vec3 shadingColor = vec3(0.0, 0.0, 0.0);
      #ifdef RN_IS_LIGHTING
          int shadingModel = get_shadingModel(materialSID, 0);
          if (shadingModel > 0) {
              vec3 diffuse = vec3(0.0, 0.0, 0.0);
              vec3 specular = vec3(0.0, 0.0, 0.0);
              for (int i = 0; i < 4 ; i++) {
                  if (i >= lightNumber) {
                      break;
                  }
                  // Light
                  Light light = getLight(i, v_position_inWorld.xyz);

                  // Diffuse

                  diffuse += diffuseColor * max(0.0, dot(normal_inWorld, light.direction)) * light.attenuatedIntensity;
                  float shininess = get_shininess(materialSID, 0);
                  int shadingModel = get_shadingModel(materialSID, 0);
                  float cameraSID = u_currentComponentSIDs[7];
                  vec3 viewPosition = get_viewPosition(cameraSID, 0);

                  // Specular

                  if (shadingModel == 2) {
                      // BLINN
                      // ViewDirection
                      vec3 viewDirection = normalize(viewPosition - v_position_inWorld.xyz);
                      vec3 halfVector = normalize(light.direction + viewDirection);
                      specular += pow(max(0.0, dot(halfVector, normal_inWorld)), shininess);
                  }
                  else if (shadingModel == 3) {
                      // PHONG
                      vec3 viewDirection = normalize(viewPosition - v_position_inWorld.xyz);
                      vec3 R = reflect(light.direction, normal_inWorld);
                      specular += pow(max(0.0, dot(R, viewDirection)), shininess);
                  }

              }
              shadingColor = diffuse + specular;
          }
          else {
              shadingColor = diffuseColor;
          }
      #else
          shadingColor = diffuseColor;
      #endif

      rt0 = vec4(shadingColor * alpha, alpha);
      // rt0 = vec4(u_lightNumber, 0.0, 0.0, 1.0);

      // rt0 = vec4(1.0, 0.0, 0.0, 1.0);
      // rt0 = vec4(normal_inWorld*0.5+0.5, 1.0);

      #ifdef RN_IS_ALPHAMODE_OPAQUE
          rt0.a = 1.0;
          #elif defined(RN_IS_ALPHAMODE_MASK)
          rt0.a = 1.0;
      #endif


      gl_FragData[0] = rt0;
      gl_FragData[1] = rt1;
      gl_FragData[2] = rt2;
      gl_FragData[3] = rt3;
  }
`,
};

function createClassicUberMaterial({
  isSkinning = false,
  isLighting = false,
  isMorphing = false,
  alphaMode = Rn.AlphaMode.Opaque,
  maxInstancesNumber = Rn.Config.maxMaterialInstanceForEachType,
} = {}) {
  const materialName = 'MyCustomShader';

  const materialNode = new Rn.CustomMaterialContent({
    name: 'MyCustomShader',
    isSkinning,
    isLighting,
    isMorphing,
    alphaMode,
    useTangentAttribute: false,
    useNormalTexture: true,
    vertexShader: myVertexShaderityObject,
    pixelShader: myFragmentShaderityObject,
    additionalShaderSemanticInfo: [],
  });
  materialNode.isSingleOperation = true;
  const material = Rn.createMaterial(
    materialName,
    materialNode,
    maxInstancesNumber
  );

  return material;
}

(async window => {
  // Init Rhodonite
  await Rn.System.init({
    approach: Rn.ProcessApproach.UniformWebGL1,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  // Plane
  const planeEntity = Rn.MeshHelper.createPlane();
  planeEntity.rotate = Rn.Vector3.fromCopy3(Math.PI * 0.5, 0, 0);
  planeEntity.scale = Rn.Vector3.fromCopy3(0.5, 0.5, 0.5);
  const planeMesh = planeEntity.getMesh().mesh!;
  const planePrimitive = planeMesh.getPrimitiveAt(0);
  planePrimitive.material = createClassicUberMaterial();

  // Render Loop
  let count = 0;

  Rn.System.startRenderLoop(() => {
    if (!window._rendered && count > 0) {
      window._rendered = true;
      const p = document.createElement('p');
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      document.body.appendChild(p);
    }

    Rn.System.processAuto();
    count++;
  });

})(window);
