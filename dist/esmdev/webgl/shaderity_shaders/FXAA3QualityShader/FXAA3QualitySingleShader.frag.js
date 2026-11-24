// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/FXAA3QualityShader/FXAA3QualitySingleShader.frag
var code = `

/* shaderity: @{glslPrecision} */

/**
 * This file contains source code provided by NVIDIA Corporation.
 * FXAA antialiasing is developed by NVIDIA.
 * The codes of this file is modified from original code to work on WebGL1.
 * The modification for GLSL 100 is referred from Three.js, https://github.com/mrdoob/three.js/blob/5ba4c25bcb74577e1b1e14906f345135610a94f3/examples/js/shaders/FXAAShader.js
 * The original FXAA code is https://github.com/NVIDIAGameWorks/GraphicsSamples/blob/80e8ba8f5e8935821513207033490735dd3279d8/samples/es3-kepler/FXAA/FXAA3_11.h
 */

//----------------------------------------------------------------------------------
// File:        es3-kepler\\FXAA/FXAA3_11.h
// SDK Version: v3.00
// Email:       gameworks@nvidia.com
// Site:        http://developer.nvidia.com/
//
// Copyright (c) 2014-2015, NVIDIA CORPORATION. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions
// are met:
//  * Redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//  * Redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//  * Neither the name of NVIDIA CORPORATION nor the names of its
//    contributors may be used to endorse or promote products derived
//    from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS 'AS IS' AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
// PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
// PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
// OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//----------------------------------------------------------------------------------
/*============================================================================
                    NVIDIA FXAA 3.11 by TIMOTHY LOTTES
============================================================================*/


/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

/* shaderity: @{vertexIn} */

uniform sampler2D u_baseColorTexture; // initialValue=(1,white)

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{getters} */



  #define FXAA_PC 1
  #define FXAA_QUALITYPRESET 39
  #define FXAA_GREEN_AS_LUMA 0
  #define FXAA_GLSL_100 1

  /*============================================================================
                                INTEGRATION KNOBS
  ============================================================================*/
  //
  // FXAA_PS3 and FXAA_360 choose the console algorithm (FXAA3 CONSOLE).
  // FXAA_360_OPT is a prototype for the new optimized 360 version.
  //
  // 1 = Use API.
  // 0 = Don't use API.
  //
  /*--------------------------------------------------------------------------*/
  #ifndef FXAA_PS3
  #define FXAA_PS3 0
  #endif
  /*--------------------------------------------------------------------------*/
  #ifndef FXAA_360
  #define FXAA_360 0
  #endif
  /*--------------------------------------------------------------------------*/
  #ifndef FXAA_360_OPT
  #define FXAA_360_OPT 0
  #endif
  /*==========================================================================*/
  #ifndef FXAA_PC
  //
  // FXAA Quality
  // The high quality PC algorithm.
  //
  #define FXAA_PC 0
  #endif
  /*--------------------------------------------------------------------------*/
  #ifndef FXAA_PC_CONSOLE
  //
  // The console algorithm for PC is included
  // for developers targeting really low spec machines.
  // Likely better to just run FXAA_PC, and use a really low preset.
  //
  #define FXAA_PC_CONSOLE 0
  #endif
  /*--------------------------------------------------------------------------*/
  #ifndef FXAA_GLSL_120
  #define FXAA_GLSL_120 0
  #endif
  /*--------------------------------------------------------------------------*/
  #ifndef FXAA_GLSL_130
  #define FXAA_GLSL_130 0
  #endif
  /*--------------------------------------------------------------------------*/
  #ifndef FXAA_HLSL_3
  #define FXAA_HLSL_3 0
  #endif
  /*--------------------------------------------------------------------------*/
  #ifndef FXAA_HLSL_4
  #define FXAA_HLSL_4 0
  #endif
  /*--------------------------------------------------------------------------*/
  #ifndef FXAA_HLSL_5
  #define FXAA_HLSL_5 0
  #endif
  /*==========================================================================*/
  #ifndef FXAA_GREEN_AS_LUMA
  //
  // For those using non-linear color,
  // and either not able to get luma in alpha, or not wanting to,
  // this enables FXAA to run using green as a proxy for luma.
  // So with this enabled, no need to pack luma in alpha.
  //
  // This will turn off AA on anything which lacks some amount of green.
  // Pure red and blue or combination of only R and B, will get no AA.
  //
  // Might want to lower the settings for both,
  //    fxaaConsoleEdgeThresholdMin
  //    fxaaQualityEdgeThresholdMin
  // In order to insure AA does not get turned off on colors
  // which contain a minor amount of green.
  //
  // 1 = On.
  // 0 = Off.
  //
  #define FXAA_GREEN_AS_LUMA 0
  #endif
  /*--------------------------------------------------------------------------*/
  #ifndef FXAA_EARLY_EXIT
  //
  // Controls algorithm's early exit path.
  // On PS3 turning this ON adds 2 cycles to the shader.
  // On 360 turning this OFF adds 10ths of a millisecond to the shader.
  // Turning this off on console will result in a more blurry image.
  // So this defaults to on.
  //
  // 1 = On.
  // 0 = Off.
  //
  #define FXAA_EARLY_EXIT 1
  #endif
  /*--------------------------------------------------------------------------*/
  #ifndef FXAA_DISCARD
  //
  // Only valid for PC OpenGL currently.
  // Probably will not work when FXAA_GREEN_AS_LUMA = 1.
  //
  // 1 = Use discard on pixels which don't need AA.
  //     For APIs which enable concurrent TEX+ROP from same surface.
  // 0 = Return unchanged color on pixels which don't need AA.
  //
  #define FXAA_DISCARD 0
  #endif
  /*--------------------------------------------------------------------------*/
  #ifndef FXAA_FAST_PIXEL_OFFSET
  //
  // Used for GLSL 120 only.
  //
  // 1 = GL API supports fast pixel offsets
  // 0 = do not use fast pixel offsets
  //
  #ifdef GLEXT_gpu_shader4
  #define FXAA_FAST_PIXEL_OFFSET 1
  #endif
  #ifdef GLNV_gpu_shader5
  #define FXAA_FAST_PIXEL_OFFSET 1
  #endif
  #ifdef GLARB_gpu_shader5
  #define FXAA_FAST_PIXEL_OFFSET 1
  #endif
  #ifndef FXAA_FAST_PIXEL_OFFSET
  #define FXAA_FAST_PIXEL_OFFSET 0
  #endif
  #endif
  /*--------------------------------------------------------------------------*/
  #ifndef FXAA_GATHER4_ALPHA
  //
  // 1 = API supports gather4 on alpha channel.
  // 0 = API does not support gather4 on alpha channel.
  //
  #if (FXAA_HLSL_5 == 1)
  #define FXAA_GATHER4_ALPHA 1
  #endif
  #ifdef GLARB_gpu_shader5
  #define FXAA_GATHER4_ALPHA 1
  #endif
  #ifdef GLNV_gpu_shader5
  #define FXAA_GATHER4_ALPHA 1
  #endif
  #ifndef FXAA_GATHER4_ALPHA
  #define FXAA_GATHER4_ALPHA 0
  #endif
  #endif

  /*============================================================================
                        FXAA CONSOLE PS3 - TUNING KNOBS
  ============================================================================*/
  #ifndef FXAA_CONSOLEPS3_EDGE_SHARPNESS
  //
  // Consoles the sharpness of edges on PS3 only.
  // Non-PS3 tuning is done with shader input.
  //
  // Due to the PS3 being ALU bound,
  // there are only two safe values here: 4 and 8.
  // These options use the shaders ability to a free *|/ by 2|4|8.
  //
  // 8.0 is sharper
  // 4.0 is softer
  // 2.0 is really soft (good for vector graphics inputs)
  //
  #if 1
  #define FXAA_CONSOLEPS3_EDGE_SHARPNESS 8.0
  #endif
  #if 0
  #define FXAA_CONSOLEPS3_EDGE_SHARPNESS 4.0
  #endif
  #if 0
  #define FXAA_CONSOLEPS3_EDGE_SHARPNESS 2.0
  #endif
  #endif
  /*--------------------------------------------------------------------------*/
  #ifndef FXAA_CONSOLEPS3_EDGE_THRESHOLD
  //
  // Only effects PS3.
  // Non-PS3 tuning is done with shader input.
  //
  // The minimum amount of local contrast required to apply algorithm.
  // The console setting has a different mapping than the quality setting.
  //
  // This only applies when FXAA_EARLY_EXIT is 1.
  //
  // Due to the PS3 being ALU bound,
  // there are only two safe values here: 0.25 and 0.125.
  // These options use the shaders ability to a free *|/ by 2|4|8.
  //
  // 0.125 leaves less aliasing, but is softer
  // 0.25 leaves more aliasing, and is sharper
  //
  #if 1
  #define FXAA_CONSOLEPS3_EDGE_THRESHOLD 0.125
  #else
  #define FXAA_CONSOLEPS3_EDGE_THRESHOLD 0.25
  #endif
  #endif

  /*============================================================================
                          FXAA QUALITY - TUNING KNOBS
  ------------------------------------------------------------------------------
  NOTE the other tuning knobs are now in the shader function inputs!
  ============================================================================*/
  #ifndef FXAA_QUALITYPRESET
  //
  // Choose the quality preset.
  // This needs to be compiled into the shader as it effects code.
  // Best option to include multiple presets is to
  // in each shader define the preset, then include this file.
  //
  // OPTIONS
  // -----------------------------------------------------------------------
  // 10 to 15 - default medium dither (10=fastest, 15=highest quality)
  // 20 to 29 - less dither, more expensive (20=fastest, 29=highest quality)
  // 39       - no dither, very expensive
  //
  // NOTES
  // -----------------------------------------------------------------------
  // 12 = slightly faster then FXAA 3.9 and higher edge quality (default)
  // 13 = about same speed as FXAA 3.9 and better than 12
  // 23 = closest to FXAA 3.9 visually and performance wise
  //  _ = the lowest digit is directly related to performance
  // _  = the highest digit is directly related to style
  //
  #define FXAA_QUALITYPRESET 12
  #endif


  /*============================================================================
                             FXAA QUALITY - PRESETS
  ============================================================================*/

  /*============================================================================
                       FXAA QUALITY - MEDIUM DITHER PRESETS
  ============================================================================*/
  #if(FXAA_QUALITYPRESET == 10)
#define FXAA_QUALITYPS 3
#define FXAA_QUALITYP0 1.5
#define FXAA_QUALITYP1 3.0
#define FXAA_QUALITYP2 12.0
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_QUALITYPRESET == 11)
#define FXAA_QUALITYPS 4
#define FXAA_QUALITYP0 1.0
#define FXAA_QUALITYP1 1.5
#define FXAA_QUALITYP2 3.0
#define FXAA_QUALITYP3 12.0
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_QUALITYPRESET == 12)
#define FXAA_QUALITYPS 5
#define FXAA_QUALITYP0 1.0
#define FXAA_QUALITYP1 1.5
#define FXAA_QUALITYP2 2.0
#define FXAA_QUALITYP3 4.0
#define FXAA_QUALITYP4 12.0
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_QUALITYPRESET == 13)
#define FXAA_QUALITYPS 6
#define FXAA_QUALITYP0 1.0
#define FXAA_QUALITYP1 1.5
#define FXAA_QUALITYP2 2.0
#define FXAA_QUALITYP3 2.0
#define FXAA_QUALITYP4 4.0
#define FXAA_QUALITYP5 12.0
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_QUALITYPRESET == 14)
#define FXAA_QUALITYPS 7
#define FXAA_QUALITYP0 1.0
#define FXAA_QUALITYP1 1.5
#define FXAA_QUALITYP2 2.0
#define FXAA_QUALITYP3 2.0
#define FXAA_QUALITYP4 2.0
#define FXAA_QUALITYP5 4.0
#define FXAA_QUALITYP6 12.0
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_QUALITYPRESET == 15)
#define FXAA_QUALITYPS 8
#define FXAA_QUALITYP0 1.0
#define FXAA_QUALITYP1 1.5
#define FXAA_QUALITYP2 2.0
#define FXAA_QUALITYP3 2.0
#define FXAA_QUALITYP4 2.0
#define FXAA_QUALITYP5 2.0
#define FXAA_QUALITYP6 4.0
#define FXAA_QUALITYP7 12.0
#endif

/*============================================================================
                     FXAA QUALITY - LOW DITHER PRESETS
============================================================================*/
#if (FXAA_QUALITYPRESET == 20)
#define FXAA_QUALITYPS 3
#define FXAA_QUALITYP0 1.5
#define FXAA_QUALITYP1 2.0
#define FXAA_QUALITYP2 8.0
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_QUALITYPRESET == 21)
#define FXAA_QUALITYPS 4
#define FXAA_QUALITYP0 1.0
#define FXAA_QUALITYP1 1.5
#define FXAA_QUALITYP2 2.0
#define FXAA_QUALITYP3 8.0
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_QUALITYPRESET == 22)
#define FXAA_QUALITYPS 5
#define FXAA_QUALITYP0 1.0
#define FXAA_QUALITYP1 1.5
#define FXAA_QUALITYP2 2.0
#define FXAA_QUALITYP3 2.0
#define FXAA_QUALITYP4 8.0
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_QUALITYPRESET == 23)
#define FXAA_QUALITYPS 6
#define FXAA_QUALITYP0 1.0
#define FXAA_QUALITYP1 1.5
#define FXAA_QUALITYP2 2.0
#define FXAA_QUALITYP3 2.0
#define FXAA_QUALITYP4 2.0
#define FXAA_QUALITYP5 8.0
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_QUALITYPRESET == 24)
#define FXAA_QUALITYPS 7
#define FXAA_QUALITYP0 1.0
#define FXAA_QUALITYP1 1.5
#define FXAA_QUALITYP2 2.0
#define FXAA_QUALITYP3 2.0
#define FXAA_QUALITYP4 2.0
#define FXAA_QUALITYP5 3.0
#define FXAA_QUALITYP6 8.0
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_QUALITYPRESET == 25)
#define FXAA_QUALITYPS 8
#define FXAA_QUALITYP0 1.0
#define FXAA_QUALITYP1 1.5
#define FXAA_QUALITYP2 2.0
#define FXAA_QUALITYP3 2.0
#define FXAA_QUALITYP4 2.0
#define FXAA_QUALITYP5 2.0
#define FXAA_QUALITYP6 4.0
#define FXAA_QUALITYP7 8.0
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_QUALITYPRESET == 26)
#define FXAA_QUALITYPS 9
#define FXAA_QUALITYP0 1.0
#define FXAA_QUALITYP1 1.5
#define FXAA_QUALITYP2 2.0
#define FXAA_QUALITYP3 2.0
#define FXAA_QUALITYP4 2.0
#define FXAA_QUALITYP5 2.0
#define FXAA_QUALITYP6 2.0
#define FXAA_QUALITYP7 4.0
#define FXAA_QUALITYP8 8.0
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_QUALITYPRESET == 27)
#define FXAA_QUALITYPS 10
#define FXAA_QUALITYP0 1.0
#define FXAA_QUALITYP1 1.5
#define FXAA_QUALITYP2 2.0
#define FXAA_QUALITYP3 2.0
#define FXAA_QUALITYP4 2.0
#define FXAA_QUALITYP5 2.0
#define FXAA_QUALITYP6 2.0
#define FXAA_QUALITYP7 2.0
#define FXAA_QUALITYP8 4.0
#define FXAA_QUALITYP9 8.0
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_QUALITYPRESET == 28)
#define FXAA_QUALITYPS 11
#define FXAA_QUALITYP0 1.0
#define FXAA_QUALITYP1 1.5
#define FXAA_QUALITYP2 2.0
#define FXAA_QUALITYP3 2.0
#define FXAA_QUALITYP4 2.0
#define FXAA_QUALITYP5 2.0
#define FXAA_QUALITYP6 2.0
#define FXAA_QUALITYP7 2.0
#define FXAA_QUALITYP8 2.0
#define FXAA_QUALITYP9 4.0
#define FXAA_QUALITYP10 8.0
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_QUALITYPRESET == 29)
#define FXAA_QUALITYPS 12
#define FXAA_QUALITYP0 1.0
#define FXAA_QUALITYP1 1.5
#define FXAA_QUALITYP2 2.0
#define FXAA_QUALITYP3 2.0
#define FXAA_QUALITYP4 2.0
#define FXAA_QUALITYP5 2.0
#define FXAA_QUALITYP6 2.0
#define FXAA_QUALITYP7 2.0
#define FXAA_QUALITYP8 2.0
#define FXAA_QUALITYP9 2.0
#define FXAA_QUALITYP10 4.0
#define FXAA_QUALITYP11 8.0
#endif

/*============================================================================
                     FXAA QUALITY - EXTREME QUALITY
============================================================================*/
#if (FXAA_QUALITYPRESET == 39)
#define FXAA_QUALITYPS 12
#define FXAA_QUALITYP0 1.0
#define FXAA_QUALITYP1 1.0
#define FXAA_QUALITYP2 1.0
#define FXAA_QUALITYP3 1.0
#define FXAA_QUALITYP4 1.0
#define FXAA_QUALITYP5 1.5
#define FXAA_QUALITYP6 2.0
#define FXAA_QUALITYP7 2.0
#define FXAA_QUALITYP8 2.0
#define FXAA_QUALITYP9 2.0
#define FXAA_QUALITYP10 4.0
#define FXAA_QUALITYP11 8.0
#endif



/*============================================================================
                                API PORTING
============================================================================*/
#if (FXAA_GLSL_100 == 1) || (FXAA_GLSL_120 == 1) || (FXAA_GLSL_130 == 1)
#define FxaaBool bool
#define FxaaDiscard discard
#define FxaaFloat float
#define FxaaFloat2 vec2
#define FxaaFloat3 vec3
#define FxaaFloat4 vec4
#define FxaaHalf float
#define FxaaHalf2 vec2
#define FxaaHalf3 vec3
#define FxaaHalf4 vec4
#define FxaaInt2 ivec2
#define FxaaSat(x) clamp(x, 0.0, 1.0)
#define FxaaTex sampler2D
#else
#define FxaaBool bool
#define FxaaDiscard clip(-1)
#define FxaaFloat float
#define FxaaFloat2 float2
#define FxaaFloat3 float3
#define FxaaFloat4 float4
#define FxaaHalf half
#define FxaaHalf2 half2
#define FxaaHalf3 half3
#define FxaaHalf4 half4
#define FxaaSat(x) saturate(x)
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_GLSL_100 == 1)
#define FxaaTexTop(t, p) texture(t, p, 0.0)
#define FxaaTexOff(t, p, o, r) texture(t, p + (o * r), 0.0)
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_GLSL_120 == 1)
// Requires,
//  #version 120
// And at least,
//  #extension GLEXT_gpu_shader4 : enable
//  (or set FXAA_FAST_PIXEL_OFFSET 1 to work like DX9)
#define FxaaTexTop(t, p) texture2DLod(t, p, 0.0)
#if (FXAA_FAST_PIXEL_OFFSET == 1)
#define FxaaTexOff(t, p, o, r) texture2DLodOffset(t, p, 0.0, o)
#else
#define FxaaTexOff(t, p, o, r) texture2DLod(t, p + (o * r), 0.0)
#endif
#if (FXAA_GATHER4_ALPHA == 1)
// use #extension GLARB_gpu_shader5 : enable
#define FxaaTexAlpha4(t, p) textureGather(t, p, 3)
#define FxaaTexOffAlpha4(t, p, o) textureGatherOffset(t, p, o, 3)
#define FxaaTexGreen4(t, p) textureGather(t, p, 1)
#define FxaaTexOffGreen4(t, p, o) textureGatherOffset(t, p, o, 1)
#endif
#endif
/*--------------------------------------------------------------------------*/
#if (FXAA_GLSL_130 == 1)
// Requires "#version 130" or better
#define FxaaTexTop(t, p) textureLod(t, p, 0.0)
#define FxaaTexOff(t, p, o, r) textureLodOffset(t, p, 0.0, o)
#if (FXAA_GATHER4_ALPHA == 1)
// use #extension GLARB_gpu_shader5 : enable
#define FxaaTexAlpha4(t, p) textureGather(t, p, 3)
#define FxaaTexOffAlpha4(t, p, o) textureGatherOffset(t, p, o, 3)
#define FxaaTexGreen4(t, p) textureGather(t, p, 1)
#define FxaaTexOffGreen4(t, p, o) textureGatherOffset(t, p, o, 1)
#endif
#endif


/*============================================================================
                   GREEN AS LUMA OPTION SUPPORT FUNCTION
============================================================================*/
#if (FXAA_GREEN_AS_LUMA == 0)
  FxaaFloat FxaaLuma(FxaaFloat4 rgba) { return dot(rgba.rgb, vec3(0.298912, 0.586611, 0.114478)); }
  // FxaaFloat FxaaLuma(FxaaFloat4 rgba) { return rgba.w; }
#else
  FxaaFloat FxaaLuma(FxaaFloat4 rgba) { return rgba.y; }
#endif









/*============================================================================
                             FXAA3 QUALITY - PC
============================================================================*/
#if (FXAA_PC == 1)
  /*--------------------------------------------------------------------------*/
  FxaaFloat4 FxaaPixelShader(
    //
    // Use noperspective interpolation here (turn off perspective interpolation).
    // {xy} = center of pixel
    FxaaFloat2 pos,
    //
    // Used only for FXAA Console, and not used on the 360 version.
    // Use noperspective interpolation here (turn off perspective interpolation).
    // {xy} = upper left of pixel
    // {zw} = lower right of pixel
    FxaaFloat4 fxaaConsolePosPos,
    //
    // Input color texture.
    // {rgb_} = color in linear or perceptual color space
    // if (FXAA_GREEN_AS_LUMA == 0)
    //     {_a} = luma in perceptual color space (not linear)
    FxaaTex tex,
    //
    // Only used on the optimized 360 version of FXAA Console.
    // For everything but 360, just use the same input here as for "tex".
    // For 360, same texture, just alias with a 2nd sampler.
    // This sampler needs to have an exponent bias of -1.
    FxaaTex fxaaConsole360TexExpBiasNegOne,
    //
    // Only used on the optimized 360 version of FXAA Console.
    // For everything but 360, just use the same input here as for "tex".
    // For 360, same texture, just alias with a 3nd sampler.
    // This sampler needs to have an exponent bias of -2.
    FxaaTex fxaaConsole360TexExpBiasNegTwo,
    //
    // Only used on FXAA Quality.
    // This must be from a constant/uniform.
    // {x_} = 1.0/screenWidthInPixels
    // {_y} = 1.0/screenHeightInPixels
    FxaaFloat2 fxaaQualityRcpFrame,
    //
    // Only used on FXAA Console.
    // This must be from a constant/uniform.
    // This effects sub-pixel AA quality and inversely sharpness.
    //   Where N ranges between,
    //     N = 0.50 (default)
    //     N = 0.33 (sharper)
    // {x_} = -N/screenWidthInPixels
    // {_y} = -N/screenHeightInPixels
    // {z_} =  N/screenWidthInPixels
    // {_w} =  N/screenHeightInPixels
    FxaaFloat4 fxaaConsoleRcpFrameOpt,
    //
    // Only used on FXAA Console.
    // Not used on 360, but used on PS3 and PC.
    // This must be from a constant/uniform.
    // {x_} = -2.0/screenWidthInPixels
    // {_y} = -2.0/screenHeightInPixels
    // {z_} =  2.0/screenWidthInPixels
    // {_w} =  2.0/screenHeightInPixels
    FxaaFloat4 fxaaConsoleRcpFrameOpt2,
    //
    // Only used on FXAA Console.
    // Only used on 360 in place of fxaaConsoleRcpFrameOpt2.
    // This must be from a constant/uniform.
    // {x_} =  8.0/screenWidthInPixels
    // {_y} =  8.0/screenHeightInPixels
    // {z_} = -4.0/screenWidthInPixels
    // {_w} = -4.0/screenHeightInPixels
    FxaaFloat4 fxaaConsole360RcpFrameOpt2,
    //
    // Only used on FXAA Quality.
    // This used to be the FXAA_QUALITYSUBPIX define.
    // It is here now to allow easier tuning.
    // Choose the amount of sub-pixel aliasing removal.
    // This can effect sharpness.
    //   1.00 - upper limit (softer)
    //   0.75 - default amount of filtering
    //   0.50 - lower limit (sharper, less sub-pixel aliasing removal)
    //   0.25 - almost off
    //   0.00 - completely off
    FxaaFloat fxaaQualitySubpix,
    //
    // Only used on FXAA Quality.
    // This used to be the FXAA_QUALITYEDGE_THRESHOLD define.
    // It is here now to allow easier tuning.
    // The minimum amount of local contrast required to apply algorithm.
    //   0.333 - too little (faster)
    //   0.250 - low quality
    //   0.166 - default
    //   0.125 - high quality
    //   0.063 - overkill (slower)
    FxaaFloat fxaaQualityEdgeThreshold,
    //
    // Only used on FXAA Quality.
    // This used to be the FXAA_QUALITYEDGE_THRESHOLD_MIN define.
    // It is here now to allow easier tuning.
    // Trims the algorithm from processing darks.
    //   0.0833 - upper limit (default, the start of visible unfiltered edges)
    //   0.0625 - high quality (faster)
    //   0.0312 - visible limit (slower)
    // Special notes when using FXAA_GREEN_AS_LUMA,
    //   Likely want to set this to zero.
    //   As colors that are mostly not-green
    //   will appear very dark in the green channel!
    //   Tune by looking at mostly non-green content,
    //   then start at zero and increase until aliasing is a problem.
    FxaaFloat fxaaQualityEdgeThresholdMin,
    //
    // Only used on FXAA Console.
    // This used to be the FXAA_CONSOLEEDGE_SHARPNESS define.
    // It is here now to allow easier tuning.
    // This does not effect PS3, as this needs to be compiled in.
    //   Use FXAA_CONSOLEPS3_EDGE_SHARPNESS for PS3.
    //   Due to the PS3 being ALU bound,
    //   there are only three safe values here: 2 and 4 and 8.
    //   These options use the shaders ability to a free *|/ by 2|4|8.
    // For all other platforms can be a non-power of two.
    //   8.0 is sharper (default!!!)
    //   4.0 is softer
    //   2.0 is really soft (good only for vector graphics inputs)
    FxaaFloat fxaaConsoleEdgeSharpness,
    //
    // Only used on FXAA Console.
    // This used to be the FXAA_CONSOLEEDGE_THRESHOLD define.
    // It is here now to allow easier tuning.
    // This does not effect PS3, as this needs to be compiled in.
    //   Use FXAA_CONSOLEPS3_EDGE_THRESHOLD for PS3.
    //   Due to the PS3 being ALU bound,
    //   there are only two safe values here: 1/4 and 1/8.
    //   These options use the shaders ability to a free *|/ by 2|4|8.
    // The console setting has a different mapping than the quality setting.
    // Other platforms can use other values.
    //   0.125 leaves less aliasing, but is softer (default!!!)
    //   0.25 leaves more aliasing, and is sharper
    FxaaFloat fxaaConsoleEdgeThreshold,
    //
    // Only used on FXAA Console.
    // This used to be the FXAA_CONSOLEEDGE_THRESHOLD_MIN define.
    // It is here now to allow easier tuning.
    // Trims the algorithm from processing darks.
    // The console setting has a different mapping than the quality setting.
    // This only applies when FXAA_EARLY_EXIT is 1.
    // This does not apply to PS3,
    // PS3 was simplified to avoid more shader instructions.
    //   0.06 - faster but more aliasing in darks
    //   0.05 - default
    //   0.04 - slower and less aliasing in darks
    // Special notes when using FXAA_GREEN_AS_LUMA,
    //   Likely want to set this to zero.
    //   As colors that are mostly not-green
    //   will appear very dark in the green channel!
    //   Tune by looking at mostly non-green content,
    //   then start at zero and increase until aliasing is a problem.
    FxaaFloat fxaaConsoleEdgeThresholdMin,
    //
    // Extra constants for 360 FXAA Console only.
    // Use zeros or anything else for other platforms.
    // These must be in physical constant registers and NOT immedates.
    // Immedates will result in compiler un-optimizing.
    // {xyzw} = float4(1.0, -1.0, 0.25, -0.25)
    FxaaFloat4 fxaaConsole360ConstDir
  ) {
  /*--------------------------------------------------------------------------*/
  FxaaFloat2 posM;
  posM.x = pos.x;
  posM.y = pos.y;
  #if (FXAA_GATHER4_ALPHA == 1)
  #if (FXAA_DISCARD == 0)
    FxaaFloat4 rgbyM = FxaaTexTop(tex, posM);
  #if (FXAA_GREEN_AS_LUMA == 0)
  #define lumaM rgbyM.w
  #else
  #define lumaM rgbyM.y
  #endif
  #endif
  #if (FXAA_GREEN_AS_LUMA == 0)
    FxaaFloat4 luma4A = FxaaTexAlpha4(tex, posM);
  FxaaFloat4 luma4B = FxaaTexOffAlpha4(tex, posM, FxaaInt2(-1, -1));
  #else
  FxaaFloat4 luma4A = FxaaTexGreen4(tex, posM);
  FxaaFloat4 luma4B = FxaaTexOffGreen4(tex, posM, FxaaInt2(-1, -1));
  #endif
  #if (FXAA_DISCARD == 1)
  #define lumaM luma4A.w
  #endif
  #define lumaE luma4A.z
  #define lumaS luma4A.x
  #define lumaSE luma4A.y
  #define lumaNW luma4B.w
  #define lumaN luma4B.z
  #define lumaW luma4B.x
  #else
  FxaaFloat4 rgbyM = FxaaTexTop(tex, posM);
  #if (FXAA_GREEN_AS_LUMA == 0)
  #define lumaM rgbyM.w
  #else
  #define lumaM rgbyM.y
  #endif
  #if (FXAA_GLSL_100 == 1)
    FxaaFloat lumaS = FxaaLuma(FxaaTexOff(tex, posM, FxaaFloat2(0.0, 1.0), fxaaQualityRcpFrame.xy));
  FxaaFloat lumaE = FxaaLuma(FxaaTexOff(tex, posM, FxaaFloat2(1.0, 0.0), fxaaQualityRcpFrame.xy));
  FxaaFloat lumaN = FxaaLuma(FxaaTexOff(tex, posM, FxaaFloat2(0.0, -1.0), fxaaQualityRcpFrame.xy));
  FxaaFloat lumaW = FxaaLuma(FxaaTexOff(tex, posM, FxaaFloat2(-1.0, 0.0), fxaaQualityRcpFrame.xy));
  #else
  FxaaFloat lumaS = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2(0, 1), fxaaQualityRcpFrame.xy));
  FxaaFloat lumaE = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2(1, 0), fxaaQualityRcpFrame.xy));
  FxaaFloat lumaW = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2(-1, 0), fxaaQualityRcpFrame.xy));
  FxaaFloat lumaN = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2(0, -1), fxaaQualityRcpFrame.xy));
  #endif
  #endif
  /*--------------------------------------------------------------------------*/
  FxaaFloat maxSM = max(lumaS, lumaM);
  FxaaFloat minSM = min(lumaS, lumaM);
  FxaaFloat maxESM = max(lumaE, maxSM);
  FxaaFloat minESM = min(lumaE, minSM);
  FxaaFloat maxWN = max(lumaN, lumaW);
  FxaaFloat minWN = min(lumaN, lumaW);
  FxaaFloat rangeMax = max(maxWN, maxESM);
  FxaaFloat rangeMin = min(minWN, minESM);
  FxaaFloat rangeMaxScaled = rangeMax * fxaaQualityEdgeThreshold;
  FxaaFloat range = rangeMax - rangeMin;
  FxaaFloat rangeMaxClamped = max(fxaaQualityEdgeThresholdMin, rangeMaxScaled);
  FxaaBool earlyExit = range < rangeMaxClamped;
  /*--------------------------------------------------------------------------*/
  if (earlyExit)
  #if (FXAA_DISCARD == 1)
    FxaaDiscard;
  #else
  return rgbyM;
  #endif
  /*--------------------------------------------------------------------------*/
  #if (FXAA_GATHER4_ALPHA == 0)
  #if (FXAA_GLSL_100 == 1)
    FxaaFloat lumaNW = FxaaLuma(FxaaTexOff(tex, posM, FxaaFloat2(-1.0, -1.0), fxaaQualityRcpFrame.xy));
  FxaaFloat lumaSE = FxaaLuma(FxaaTexOff(tex, posM, FxaaFloat2(1.0, 1.0), fxaaQualityRcpFrame.xy));
  FxaaFloat lumaNE = FxaaLuma(FxaaTexOff(tex, posM, FxaaFloat2(1.0, -1.0), fxaaQualityRcpFrame.xy));
  FxaaFloat lumaSW = FxaaLuma(FxaaTexOff(tex, posM, FxaaFloat2(-1.0, 1.0), fxaaQualityRcpFrame.xy));
  #else
  FxaaFloat lumaNW = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2(-1, -1), fxaaQualityRcpFrame.xy));
  FxaaFloat lumaSE = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2(1, 1), fxaaQualityRcpFrame.xy));
  FxaaFloat lumaNE = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2(1, -1), fxaaQualityRcpFrame.xy));
  FxaaFloat lumaSW = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2(-1, 1), fxaaQualityRcpFrame.xy));
  #endif
  #else
  FxaaFloat lumaNE = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2(1, -1), fxaaQualityRcpFrame.xy));
  FxaaFloat lumaSW = FxaaLuma(FxaaTexOff(tex, posM, FxaaInt2(-1, 1), fxaaQualityRcpFrame.xy));
  #endif
  /*--------------------------------------------------------------------------*/
  FxaaFloat lumaNS = lumaN + lumaS;
  FxaaFloat lumaWE = lumaW + lumaE;
  FxaaFloat subpixRcpRange = 1.0 / range;
  FxaaFloat subpixNSWE = lumaNS + lumaWE;
  FxaaFloat edgeHorz1 = (-2.0 * lumaM) + lumaNS;
  FxaaFloat edgeVert1 = (-2.0 * lumaM) + lumaWE;
  /*--------------------------------------------------------------------------*/
  FxaaFloat lumaNESE = lumaNE + lumaSE;
  FxaaFloat lumaNWNE = lumaNW + lumaNE;
  FxaaFloat edgeHorz2 = (-2.0 * lumaE) + lumaNESE;
  FxaaFloat edgeVert2 = (-2.0 * lumaN) + lumaNWNE;
  /*--------------------------------------------------------------------------*/
  FxaaFloat lumaNWSW = lumaNW + lumaSW;
  FxaaFloat lumaSWSE = lumaSW + lumaSE;
  FxaaFloat edgeHorz4 = (abs(edgeHorz1) * 2.0) + abs(edgeHorz2);
  FxaaFloat edgeVert4 = (abs(edgeVert1) * 2.0) + abs(edgeVert2);
  FxaaFloat edgeHorz3 = (-2.0 * lumaW) + lumaNWSW;
  FxaaFloat edgeVert3 = (-2.0 * lumaS) + lumaSWSE;
  FxaaFloat edgeHorz = abs(edgeHorz3) + edgeHorz4;
  FxaaFloat edgeVert = abs(edgeVert3) + edgeVert4;
  /*--------------------------------------------------------------------------*/
  FxaaFloat subpixNWSWNESE = lumaNWSW + lumaNESE;
  FxaaFloat lengthSign = fxaaQualityRcpFrame.x;
  FxaaBool horzSpan = edgeHorz >= edgeVert;
  FxaaFloat subpixA = subpixNSWE * 2.0 + subpixNWSWNESE;
  /*--------------------------------------------------------------------------*/
  if (!horzSpan) lumaN = lumaW;
  if (!horzSpan) lumaS = lumaE;
  if (horzSpan) lengthSign = fxaaQualityRcpFrame.y;
  FxaaFloat subpixB = (subpixA * (1.0 / 12.0)) - lumaM;
  /*--------------------------------------------------------------------------*/
  FxaaFloat gradientN = lumaN - lumaM;
  FxaaFloat gradientS = lumaS - lumaM;
  FxaaFloat lumaNN = lumaN + lumaM;
  FxaaFloat lumaSS = lumaS + lumaM;
  FxaaBool pairN = abs(gradientN) >= abs(gradientS);
  FxaaFloat gradient = max(abs(gradientN), abs(gradientS));
  if (pairN) lengthSign = -lengthSign;
  FxaaFloat subpixC = FxaaSat(abs(subpixB) * subpixRcpRange);
  /*--------------------------------------------------------------------------*/
  FxaaFloat2 posB;
  posB.x = posM.x;
  posB.y = posM.y;
  FxaaFloat2 offNP;
  offNP.x = (!horzSpan) ? 0.0 : fxaaQualityRcpFrame.x;
  offNP.y = (horzSpan) ? 0.0 : fxaaQualityRcpFrame.y;
  if (!horzSpan) posB.x += lengthSign * 0.5;
  if (horzSpan) posB.y += lengthSign * 0.5;
  /*--------------------------------------------------------------------------*/
  FxaaFloat2 posN;
  posN.x = posB.x - offNP.x * FXAA_QUALITYP0;
  posN.y = posB.y - offNP.y * FXAA_QUALITYP0;
  FxaaFloat2 posP;
  posP.x = posB.x + offNP.x * FXAA_QUALITYP0;
  posP.y = posB.y + offNP.y * FXAA_QUALITYP0;
  FxaaFloat subpixD = ((-2.0) * subpixC) + 3.0;
  FxaaFloat lumaEndN = FxaaLuma(FxaaTexTop(tex, posN));
  FxaaFloat subpixE = subpixC * subpixC;
  FxaaFloat lumaEndP = FxaaLuma(FxaaTexTop(tex, posP));
  /*--------------------------------------------------------------------------*/
  if (!pairN) lumaNN = lumaSS;
  FxaaFloat gradientScaled = gradient * 1.0 / 4.0;
  FxaaFloat lumaMM = lumaM - lumaNN * 0.5;
  FxaaFloat subpixF = subpixD * subpixE;
  FxaaBool lumaMLTZero = lumaMM < 0.0;
  /*--------------------------------------------------------------------------*/
  lumaEndN -= lumaNN * 0.5;
  lumaEndP -= lumaNN * 0.5;
  FxaaBool doneN = abs(lumaEndN) >= gradientScaled;
  FxaaBool doneP = abs(lumaEndP) >= gradientScaled;
  if (!doneN) posN.x -= offNP.x * FXAA_QUALITYP1;
  if (!doneN) posN.y -= offNP.y * FXAA_QUALITYP1;
  FxaaBool doneNP = (!doneN) || (!doneP);
  if (!doneP) posP.x += offNP.x * FXAA_QUALITYP1;
  if (!doneP) posP.y += offNP.y * FXAA_QUALITYP1;
  /*--------------------------------------------------------------------------*/
  if (doneNP) {
    if (!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));
    if (!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));
    if (!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
    if (!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
    doneN = abs(lumaEndN) >= gradientScaled;
    doneP = abs(lumaEndP) >= gradientScaled;
    if (!doneN) posN.x -= offNP.x * FXAA_QUALITYP2;
    if (!doneN) posN.y -= offNP.y * FXAA_QUALITYP2;
    doneNP = (!doneN) || (!doneP);
    if (!doneP) posP.x += offNP.x * FXAA_QUALITYP2;
    if (!doneP) posP.y += offNP.y * FXAA_QUALITYP2;
    /*--------------------------------------------------------------------------*/
    #if (FXAA_QUALITYPS > 3)
      if (doneNP) {
        if (!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));
        if (!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));
        if (!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
        if (!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
        doneN = abs(lumaEndN) >= gradientScaled;
        doneP = abs(lumaEndP) >= gradientScaled;
        if (!doneN) posN.x -= offNP.x * FXAA_QUALITYP3;
        if (!doneN) posN.y -= offNP.y * FXAA_QUALITYP3;
        doneNP = (!doneN) || (!doneP);
        if (!doneP) posP.x += offNP.x * FXAA_QUALITYP3;
        if (!doneP) posP.y += offNP.y * FXAA_QUALITYP3;
        /*--------------------------------------------------------------------------*/
        #if (FXAA_QUALITYPS > 4)
          if (doneNP) {
            if (!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));
            if (!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));
            if (!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
            if (!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
            doneN = abs(lumaEndN) >= gradientScaled;
            doneP = abs(lumaEndP) >= gradientScaled;
            if (!doneN) posN.x -= offNP.x * FXAA_QUALITYP4;
            if (!doneN) posN.y -= offNP.y * FXAA_QUALITYP4;
            doneNP = (!doneN) || (!doneP);
            if (!doneP) posP.x += offNP.x * FXAA_QUALITYP4;
            if (!doneP) posP.y += offNP.y * FXAA_QUALITYP4;
            /*--------------------------------------------------------------------------*/
            #if (FXAA_QUALITYPS > 5)
              if (doneNP) {
                if (!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));
                if (!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));
                if (!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
                if (!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
                doneN = abs(lumaEndN) >= gradientScaled;
                doneP = abs(lumaEndP) >= gradientScaled;
                if (!doneN) posN.x -= offNP.x * FXAA_QUALITYP5;
                if (!doneN) posN.y -= offNP.y * FXAA_QUALITYP5;
                doneNP = (!doneN) || (!doneP);
                if (!doneP) posP.x += offNP.x * FXAA_QUALITYP5;
                if (!doneP) posP.y += offNP.y * FXAA_QUALITYP5;
                /*--------------------------------------------------------------------------*/
                #if (FXAA_QUALITYPS > 6)
                  if (doneNP) {
                    if (!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));
                    if (!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));
                    if (!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
                    if (!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
                    doneN = abs(lumaEndN) >= gradientScaled;
                    doneP = abs(lumaEndP) >= gradientScaled;
                    if (!doneN) posN.x -= offNP.x * FXAA_QUALITYP6;
                    if (!doneN) posN.y -= offNP.y * FXAA_QUALITYP6;
                    doneNP = (!doneN) || (!doneP);
                    if (!doneP) posP.x += offNP.x * FXAA_QUALITYP6;
                    if (!doneP) posP.y += offNP.y * FXAA_QUALITYP6;
                    /*--------------------------------------------------------------------------*/
                    #if (FXAA_QUALITYPS > 7)
                      if (doneNP) {
                        if (!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));
                        if (!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));
                        if (!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
                        if (!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
                        doneN = abs(lumaEndN) >= gradientScaled;
                        doneP = abs(lumaEndP) >= gradientScaled;
                        if (!doneN) posN.x -= offNP.x * FXAA_QUALITYP7;
                        if (!doneN) posN.y -= offNP.y * FXAA_QUALITYP7;
                        doneNP = (!doneN) || (!doneP);
                        if (!doneP) posP.x += offNP.x * FXAA_QUALITYP7;
                        if (!doneP) posP.y += offNP.y * FXAA_QUALITYP7;
                        /*--------------------------------------------------------------------------*/
                        #if (FXAA_QUALITYPS > 8)
                          if (doneNP) {
                            if (!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));
                            if (!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));
                            if (!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
                            if (!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
                            doneN = abs(lumaEndN) >= gradientScaled;
                            doneP = abs(lumaEndP) >= gradientScaled;
                            if (!doneN) posN.x -= offNP.x * FXAA_QUALITYP8;
                            if (!doneN) posN.y -= offNP.y * FXAA_QUALITYP8;
                            doneNP = (!doneN) || (!doneP);
                            if (!doneP) posP.x += offNP.x * FXAA_QUALITYP8;
                            if (!doneP) posP.y += offNP.y * FXAA_QUALITYP8;
                            /*--------------------------------------------------------------------------*/
                            #if (FXAA_QUALITYPS > 9)
                              if (doneNP) {
                                if (!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));
                                if (!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));
                                if (!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
                                if (!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
                                doneN = abs(lumaEndN) >= gradientScaled;
                                doneP = abs(lumaEndP) >= gradientScaled;
                                if (!doneN) posN.x -= offNP.x * FXAA_QUALITYP9;
                                if (!doneN) posN.y -= offNP.y * FXAA_QUALITYP9;
                                doneNP = (!doneN) || (!doneP);
                                if (!doneP) posP.x += offNP.x * FXAA_QUALITYP9;
                                if (!doneP) posP.y += offNP.y * FXAA_QUALITYP9;
                                /*--------------------------------------------------------------------------*/
                                #if (FXAA_QUALITYPS > 10)
                                  if (doneNP) {
                                    if (!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));
                                    if (!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));
                                    if (!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
                                    if (!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
                                    doneN = abs(lumaEndN) >= gradientScaled;
                                    doneP = abs(lumaEndP) >= gradientScaled;
                                    if (!doneN) posN.x -= offNP.x * FXAA_QUALITYP10;
                                    if (!doneN) posN.y -= offNP.y * FXAA_QUALITYP10;
                                    doneNP = (!doneN) || (!doneP);
                                    if (!doneP) posP.x += offNP.x * FXAA_QUALITYP10;
                                    if (!doneP) posP.y += offNP.y * FXAA_QUALITYP10;
                                    /*--------------------------------------------------------------------------*/
                                    #if (FXAA_QUALITYPS > 11)
                                      if (doneNP) {
                                        if (!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));
                                        if (!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));
                                        if (!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
                                        if (!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
                                        doneN = abs(lumaEndN) >= gradientScaled;
                                        doneP = abs(lumaEndP) >= gradientScaled;
                                        if (!doneN) posN.x -= offNP.x * FXAA_QUALITYP11;
                                        if (!doneN) posN.y -= offNP.y * FXAA_QUALITYP11;
                                        doneNP = (!doneN) || (!doneP);
                                        if (!doneP) posP.x += offNP.x * FXAA_QUALITYP11;
                                        if (!doneP) posP.y += offNP.y * FXAA_QUALITYP11;
                                        /*--------------------------------------------------------------------------*/
                                        #if (FXAA_QUALITYPS > 12)
                                          if (doneNP) {
                                            if (!doneN) lumaEndN = FxaaLuma(FxaaTexTop(tex, posN.xy));
                                            if (!doneP) lumaEndP = FxaaLuma(FxaaTexTop(tex, posP.xy));
                                            if (!doneN) lumaEndN = lumaEndN - lumaNN * 0.5;
                                            if (!doneP) lumaEndP = lumaEndP - lumaNN * 0.5;
                                            doneN = abs(lumaEndN) >= gradientScaled;
                                            doneP = abs(lumaEndP) >= gradientScaled;
                                            if (!doneN) posN.x -= offNP.x * FXAA_QUALITYP12;
                                            if (!doneN) posN.y -= offNP.y * FXAA_QUALITYP12;
                                            doneNP = (!doneN) || (!doneP);
                                            if (!doneP) posP.x += offNP.x * FXAA_QUALITYP12;
                                            if (!doneP) posP.y += offNP.y * FXAA_QUALITYP12;
                                            /*--------------------------------------------------------------------------*/
                                          }
                                        #endif
                                        /*--------------------------------------------------------------------------*/
                                      }
                                    #endif
                                    /*--------------------------------------------------------------------------*/
                                  }
                                #endif
                                /*--------------------------------------------------------------------------*/
                              }
                            #endif
                            /*--------------------------------------------------------------------------*/
                          }
                        #endif
                        /*--------------------------------------------------------------------------*/
                      }
                    #endif
                    /*--------------------------------------------------------------------------*/
                  }
                #endif
                /*--------------------------------------------------------------------------*/
              }
            #endif
            /*--------------------------------------------------------------------------*/
          }
        #endif
        /*--------------------------------------------------------------------------*/
      }
    #endif
    /*--------------------------------------------------------------------------*/
  }
  /*--------------------------------------------------------------------------*/
  FxaaFloat dstN = posM.x - posN.x;
  FxaaFloat dstP = posP.x - posM.x;
  if (!horzSpan) dstN = posM.y - posN.y;
  if (!horzSpan) dstP = posP.y - posM.y;
  /*--------------------------------------------------------------------------*/
  FxaaBool goodSpanN = (lumaEndN < 0.0) != lumaMLTZero;
  FxaaFloat spanLength = (dstP + dstN);
  FxaaBool goodSpanP = (lumaEndP < 0.0) != lumaMLTZero;
  FxaaFloat spanLengthRcp = 1.0 / spanLength;
  /*--------------------------------------------------------------------------*/
  FxaaBool directionN = dstN < dstP;
  FxaaFloat dst = min(dstN, dstP);
  FxaaBool goodSpan = directionN ? goodSpanN : goodSpanP;
  FxaaFloat subpixG = subpixF * subpixF;
  FxaaFloat pixelOffset = (dst * (-spanLengthRcp)) + 0.5;
  FxaaFloat subpixH = subpixG * fxaaQualitySubpix;
  /*--------------------------------------------------------------------------*/
  FxaaFloat pixelOffsetGood = goodSpan ? pixelOffset : 0.0;
  FxaaFloat pixelOffsetSubpix = max(pixelOffsetGood, subpixH);
  if (!horzSpan) posM.x += pixelOffsetSubpix * lengthSign;
  if (horzSpan) posM.y += pixelOffsetSubpix * lengthSign;
  #if (FXAA_DISCARD == 1)
    return FxaaTexTop(tex, posM);
  #else
  return FxaaFloat4(FxaaTexTop(tex, posM).xyz, lumaM);
  #endif
}
/*==========================================================================*/
#endif


void main(){
/* shaderity: @{mainPrerequisites} */

  vec2 screenInfo = vec2(textureSize(u_baseColorTexture, 0));
  rt0 = FxaaPixelShader(
      v_texcoord_0,
      vec4(0.0),
      u_baseColorTexture,
      u_baseColorTexture,
      u_baseColorTexture,
      1.0 / screenInfo,
      vec4(0.0),
      vec4(0.0),
      vec4(0.0),
      0.75,
      0.166,
      0.0833,
      0.0,
      0.0,
      0.0,
      vec4(0.0)
  );
  rt0.a = 1.0;



}
`;
var shaderStage = "fragment";
var isFragmentShader = true;
var FXAA3QualitySingleShader_default = { code, shaderStage, isFragmentShader };
export {
  code,
  FXAA3QualitySingleShader_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvRlhBQTNRdWFsaXR5U2hhZGVyL0ZYQUEzUXVhbGl0eVNpbmdsZVNoYWRlci5mcmFnIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJcXG5cXG4vKiBzaGFkZXJpdHk6IEB7Z2xzbFByZWNpc2lvbn0gKi9cXG5cXG4vKipcXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgc291cmNlIGNvZGUgcHJvdmlkZWQgYnkgTlZJRElBIENvcnBvcmF0aW9uLlxcbiAqIEZYQUEgYW50aWFsaWFzaW5nIGlzIGRldmVsb3BlZCBieSBOVklESUEuXFxuICogVGhlIGNvZGVzIG9mIHRoaXMgZmlsZSBpcyBtb2RpZmllZCBmcm9tIG9yaWdpbmFsIGNvZGUgdG8gd29yayBvbiBXZWJHTDEuXFxuICogVGhlIG1vZGlmaWNhdGlvbiBmb3IgR0xTTCAxMDAgaXMgcmVmZXJyZWQgZnJvbSBUaHJlZS5qcywgaHR0cHM6Ly9naXRodWIuY29tL21yZG9vYi90aHJlZS5qcy9ibG9iLzViYTRjMjViY2I3NDU3N2UxYjFlMTQ5MDZmMzQ1MTM1NjEwYTk0ZjMvZXhhbXBsZXMvanMvc2hhZGVycy9GWEFBU2hhZGVyLmpzXFxuICogVGhlIG9yaWdpbmFsIEZYQUEgY29kZSBpcyBodHRwczovL2dpdGh1Yi5jb20vTlZJRElBR2FtZVdvcmtzL0dyYXBoaWNzU2FtcGxlcy9ibG9iLzgwZThiYThmNWU4OTM1ODIxNTEzMjA3MDMzNDkwNzM1ZGQzMjc5ZDgvc2FtcGxlcy9lczMta2VwbGVyL0ZYQUEvRlhBQTNfMTEuaFxcbiAqL1xcblxcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxcbi8vIEZpbGU6ICAgICAgICBlczMta2VwbGVyXFxcXEZYQUEvRlhBQTNfMTEuaFxcbi8vIFNESyBWZXJzaW9uOiB2My4wMFxcbi8vIEVtYWlsOiAgICAgICBnYW1ld29ya3NAbnZpZGlhLmNvbVxcbi8vIFNpdGU6ICAgICAgICBodHRwOi8vZGV2ZWxvcGVyLm52aWRpYS5jb20vXFxuLy9cXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNSwgTlZJRElBIENPUlBPUkFUSU9OLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxcbi8vXFxuLy8gUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XFxuLy8gbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zXFxuLy8gYXJlIG1ldDpcXG4vLyAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxcbi8vICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cXG4vLyAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxcbi8vICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGVcXG4vLyAgICBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxcbi8vICAqIE5laXRoZXIgdGhlIG5hbWUgb2YgTlZJRElBIENPUlBPUkFUSU9OIG5vciB0aGUgbmFtZXMgb2YgaXRzXFxuLy8gICAgY29udHJpYnV0b3JzIG1heSBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0cyBkZXJpdmVkXFxuLy8gICAgZnJvbSB0aGlzIHNvZnR3YXJlIHdpdGhvdXQgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxcbi8vXFxuLy8gVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgJ0FTIElTJyBBTkQgQU5ZXFxuLy8gRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEVcXG4vLyBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVJcXG4vLyBQVVJQT1NFIEFSRSBESVNDTEFJTUVELiAgSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBPV05FUiBPUlxcbi8vIENPTlRSSUJVVE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLFxcbi8vIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTyxcXG4vLyBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSwgREFUQSwgT1JcXG4vLyBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZXFxuLy8gT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXFxuLy8gKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFXFxuLy8gT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cXG4vL1xcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxcbi8qPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxcbiAgICAgICAgICAgICAgICAgICAgTlZJRElBIEZYQUEgMy4xMSBieSBUSU1PVEhZIExPVFRFU1xcbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xcblxcblxcbi8qIHNoYWRlcml0eTogQHtkZWZpbml0aW9uc30gKi9cXG5cXG4vKiBzaGFkZXJpdHk6IEB7cHJlcmVxdWlzaXRlc30gKi9cXG5cXG4vKiBzaGFkZXJpdHk6IEB7dmVydGV4SW59ICovXFxuXFxudW5pZm9ybSBzYW1wbGVyMkQgdV9iYXNlQ29sb3JUZXh0dXJlOyAvLyBpbml0aWFsVmFsdWU9KDEsd2hpdGUpXFxuXFxuLyogc2hhZGVyaXR5OiBAe3JlbmRlclRhcmdldEJlZ2lufSAqL1xcblxcbi8qIHNoYWRlcml0eTogQHtnZXR0ZXJzfSAqL1xcblxcblxcblxcbiAgI2RlZmluZSBGWEFBX1BDIDFcXG4gICNkZWZpbmUgRlhBQV9RVUFMSVRZUFJFU0VUIDM5XFxuICAjZGVmaW5lIEZYQUFfR1JFRU5fQVNfTFVNQSAwXFxuICAjZGVmaW5lIEZYQUFfR0xTTF8xMDAgMVxcblxcbiAgLyo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJTlRFR1JBVElPTiBLTk9CU1xcbiAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXFxuICAvL1xcbiAgLy8gRlhBQV9QUzMgYW5kIEZYQUFfMzYwIGNob29zZSB0aGUgY29uc29sZSBhbGdvcml0aG0gKEZYQUEzIENPTlNPTEUpLlxcbiAgLy8gRlhBQV8zNjBfT1BUIGlzIGEgcHJvdG90eXBlIGZvciB0aGUgbmV3IG9wdGltaXplZCAzNjAgdmVyc2lvbi5cXG4gIC8vXFxuICAvLyAxID0gVXNlIEFQSS5cXG4gIC8vIDAgPSBEb24ndCB1c2UgQVBJLlxcbiAgLy9cXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgI2lmbmRlZiBGWEFBX1BTM1xcbiAgI2RlZmluZSBGWEFBX1BTMyAwXFxuICAjZW5kaWZcXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgI2lmbmRlZiBGWEFBXzM2MFxcbiAgI2RlZmluZSBGWEFBXzM2MCAwXFxuICAjZW5kaWZcXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgI2lmbmRlZiBGWEFBXzM2MF9PUFRcXG4gICNkZWZpbmUgRlhBQV8zNjBfT1BUIDBcXG4gICNlbmRpZlxcbiAgLyo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXFxuICAjaWZuZGVmIEZYQUFfUENcXG4gIC8vXFxuICAvLyBGWEFBIFF1YWxpdHlcXG4gIC8vIFRoZSBoaWdoIHF1YWxpdHkgUEMgYWxnb3JpdGhtLlxcbiAgLy9cXG4gICNkZWZpbmUgRlhBQV9QQyAwXFxuICAjZW5kaWZcXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgI2lmbmRlZiBGWEFBX1BDX0NPTlNPTEVcXG4gIC8vXFxuICAvLyBUaGUgY29uc29sZSBhbGdvcml0aG0gZm9yIFBDIGlzIGluY2x1ZGVkXFxuICAvLyBmb3IgZGV2ZWxvcGVycyB0YXJnZXRpbmcgcmVhbGx5IGxvdyBzcGVjIG1hY2hpbmVzLlxcbiAgLy8gTGlrZWx5IGJldHRlciB0byBqdXN0IHJ1biBGWEFBX1BDLCBhbmQgdXNlIGEgcmVhbGx5IGxvdyBwcmVzZXQuXFxuICAvL1xcbiAgI2RlZmluZSBGWEFBX1BDX0NPTlNPTEUgMFxcbiAgI2VuZGlmXFxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4gICNpZm5kZWYgRlhBQV9HTFNMXzEyMFxcbiAgI2RlZmluZSBGWEFBX0dMU0xfMTIwIDBcXG4gICNlbmRpZlxcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuICAjaWZuZGVmIEZYQUFfR0xTTF8xMzBcXG4gICNkZWZpbmUgRlhBQV9HTFNMXzEzMCAwXFxuICAjZW5kaWZcXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgI2lmbmRlZiBGWEFBX0hMU0xfM1xcbiAgI2RlZmluZSBGWEFBX0hMU0xfMyAwXFxuICAjZW5kaWZcXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgI2lmbmRlZiBGWEFBX0hMU0xfNFxcbiAgI2RlZmluZSBGWEFBX0hMU0xfNCAwXFxuICAjZW5kaWZcXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgI2lmbmRlZiBGWEFBX0hMU0xfNVxcbiAgI2RlZmluZSBGWEFBX0hMU0xfNSAwXFxuICAjZW5kaWZcXG4gIC8qPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xcbiAgI2lmbmRlZiBGWEFBX0dSRUVOX0FTX0xVTUFcXG4gIC8vXFxuICAvLyBGb3IgdGhvc2UgdXNpbmcgbm9uLWxpbmVhciBjb2xvcixcXG4gIC8vIGFuZCBlaXRoZXIgbm90IGFibGUgdG8gZ2V0IGx1bWEgaW4gYWxwaGEsIG9yIG5vdCB3YW50aW5nIHRvLFxcbiAgLy8gdGhpcyBlbmFibGVzIEZYQUEgdG8gcnVuIHVzaW5nIGdyZWVuIGFzIGEgcHJveHkgZm9yIGx1bWEuXFxuICAvLyBTbyB3aXRoIHRoaXMgZW5hYmxlZCwgbm8gbmVlZCB0byBwYWNrIGx1bWEgaW4gYWxwaGEuXFxuICAvL1xcbiAgLy8gVGhpcyB3aWxsIHR1cm4gb2ZmIEFBIG9uIGFueXRoaW5nIHdoaWNoIGxhY2tzIHNvbWUgYW1vdW50IG9mIGdyZWVuLlxcbiAgLy8gUHVyZSByZWQgYW5kIGJsdWUgb3IgY29tYmluYXRpb24gb2Ygb25seSBSIGFuZCBCLCB3aWxsIGdldCBubyBBQS5cXG4gIC8vXFxuICAvLyBNaWdodCB3YW50IHRvIGxvd2VyIHRoZSBzZXR0aW5ncyBmb3IgYm90aCxcXG4gIC8vICAgIGZ4YWFDb25zb2xlRWRnZVRocmVzaG9sZE1pblxcbiAgLy8gICAgZnhhYVF1YWxpdHlFZGdlVGhyZXNob2xkTWluXFxuICAvLyBJbiBvcmRlciB0byBpbnN1cmUgQUEgZG9lcyBub3QgZ2V0IHR1cm5lZCBvZmYgb24gY29sb3JzXFxuICAvLyB3aGljaCBjb250YWluIGEgbWlub3IgYW1vdW50IG9mIGdyZWVuLlxcbiAgLy9cXG4gIC8vIDEgPSBPbi5cXG4gIC8vIDAgPSBPZmYuXFxuICAvL1xcbiAgI2RlZmluZSBGWEFBX0dSRUVOX0FTX0xVTUEgMFxcbiAgI2VuZGlmXFxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4gICNpZm5kZWYgRlhBQV9FQVJMWV9FWElUXFxuICAvL1xcbiAgLy8gQ29udHJvbHMgYWxnb3JpdGhtJ3MgZWFybHkgZXhpdCBwYXRoLlxcbiAgLy8gT24gUFMzIHR1cm5pbmcgdGhpcyBPTiBhZGRzIDIgY3ljbGVzIHRvIHRoZSBzaGFkZXIuXFxuICAvLyBPbiAzNjAgdHVybmluZyB0aGlzIE9GRiBhZGRzIDEwdGhzIG9mIGEgbWlsbGlzZWNvbmQgdG8gdGhlIHNoYWRlci5cXG4gIC8vIFR1cm5pbmcgdGhpcyBvZmYgb24gY29uc29sZSB3aWxsIHJlc3VsdCBpbiBhIG1vcmUgYmx1cnJ5IGltYWdlLlxcbiAgLy8gU28gdGhpcyBkZWZhdWx0cyB0byBvbi5cXG4gIC8vXFxuICAvLyAxID0gT24uXFxuICAvLyAwID0gT2ZmLlxcbiAgLy9cXG4gICNkZWZpbmUgRlhBQV9FQVJMWV9FWElUIDFcXG4gICNlbmRpZlxcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuICAjaWZuZGVmIEZYQUFfRElTQ0FSRFxcbiAgLy9cXG4gIC8vIE9ubHkgdmFsaWQgZm9yIFBDIE9wZW5HTCBjdXJyZW50bHkuXFxuICAvLyBQcm9iYWJseSB3aWxsIG5vdCB3b3JrIHdoZW4gRlhBQV9HUkVFTl9BU19MVU1BID0gMS5cXG4gIC8vXFxuICAvLyAxID0gVXNlIGRpc2NhcmQgb24gcGl4ZWxzIHdoaWNoIGRvbid0IG5lZWQgQUEuXFxuICAvLyAgICAgRm9yIEFQSXMgd2hpY2ggZW5hYmxlIGNvbmN1cnJlbnQgVEVYK1JPUCBmcm9tIHNhbWUgc3VyZmFjZS5cXG4gIC8vIDAgPSBSZXR1cm4gdW5jaGFuZ2VkIGNvbG9yIG9uIHBpeGVscyB3aGljaCBkb24ndCBuZWVkIEFBLlxcbiAgLy9cXG4gICNkZWZpbmUgRlhBQV9ESVNDQVJEIDBcXG4gICNlbmRpZlxcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuICAjaWZuZGVmIEZYQUFfRkFTVF9QSVhFTF9PRkZTRVRcXG4gIC8vXFxuICAvLyBVc2VkIGZvciBHTFNMIDEyMCBvbmx5LlxcbiAgLy9cXG4gIC8vIDEgPSBHTCBBUEkgc3VwcG9ydHMgZmFzdCBwaXhlbCBvZmZzZXRzXFxuICAvLyAwID0gZG8gbm90IHVzZSBmYXN0IHBpeGVsIG9mZnNldHNcXG4gIC8vXFxuICAjaWZkZWYgR0xFWFRfZ3B1X3NoYWRlcjRcXG4gICNkZWZpbmUgRlhBQV9GQVNUX1BJWEVMX09GRlNFVCAxXFxuICAjZW5kaWZcXG4gICNpZmRlZiBHTE5WX2dwdV9zaGFkZXI1XFxuICAjZGVmaW5lIEZYQUFfRkFTVF9QSVhFTF9PRkZTRVQgMVxcbiAgI2VuZGlmXFxuICAjaWZkZWYgR0xBUkJfZ3B1X3NoYWRlcjVcXG4gICNkZWZpbmUgRlhBQV9GQVNUX1BJWEVMX09GRlNFVCAxXFxuICAjZW5kaWZcXG4gICNpZm5kZWYgRlhBQV9GQVNUX1BJWEVMX09GRlNFVFxcbiAgI2RlZmluZSBGWEFBX0ZBU1RfUElYRUxfT0ZGU0VUIDBcXG4gICNlbmRpZlxcbiAgI2VuZGlmXFxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4gICNpZm5kZWYgRlhBQV9HQVRIRVI0X0FMUEhBXFxuICAvL1xcbiAgLy8gMSA9IEFQSSBzdXBwb3J0cyBnYXRoZXI0IG9uIGFscGhhIGNoYW5uZWwuXFxuICAvLyAwID0gQVBJIGRvZXMgbm90IHN1cHBvcnQgZ2F0aGVyNCBvbiBhbHBoYSBjaGFubmVsLlxcbiAgLy9cXG4gICNpZiAoRlhBQV9ITFNMXzUgPT0gMSlcXG4gICNkZWZpbmUgRlhBQV9HQVRIRVI0X0FMUEhBIDFcXG4gICNlbmRpZlxcbiAgI2lmZGVmIEdMQVJCX2dwdV9zaGFkZXI1XFxuICAjZGVmaW5lIEZYQUFfR0FUSEVSNF9BTFBIQSAxXFxuICAjZW5kaWZcXG4gICNpZmRlZiBHTE5WX2dwdV9zaGFkZXI1XFxuICAjZGVmaW5lIEZYQUFfR0FUSEVSNF9BTFBIQSAxXFxuICAjZW5kaWZcXG4gICNpZm5kZWYgRlhBQV9HQVRIRVI0X0FMUEhBXFxuICAjZGVmaW5lIEZYQUFfR0FUSEVSNF9BTFBIQSAwXFxuICAjZW5kaWZcXG4gICNlbmRpZlxcblxcbiAgLyo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XFxuICAgICAgICAgICAgICAgICAgICAgICAgRlhBQSBDT05TT0xFIFBTMyAtIFRVTklORyBLTk9CU1xcbiAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXFxuICAjaWZuZGVmIEZYQUFfQ09OU09MRVBTM19FREdFX1NIQVJQTkVTU1xcbiAgLy9cXG4gIC8vIENvbnNvbGVzIHRoZSBzaGFycG5lc3Mgb2YgZWRnZXMgb24gUFMzIG9ubHkuXFxuICAvLyBOb24tUFMzIHR1bmluZyBpcyBkb25lIHdpdGggc2hhZGVyIGlucHV0LlxcbiAgLy9cXG4gIC8vIER1ZSB0byB0aGUgUFMzIGJlaW5nIEFMVSBib3VuZCxcXG4gIC8vIHRoZXJlIGFyZSBvbmx5IHR3byBzYWZlIHZhbHVlcyBoZXJlOiA0IGFuZCA4LlxcbiAgLy8gVGhlc2Ugb3B0aW9ucyB1c2UgdGhlIHNoYWRlcnMgYWJpbGl0eSB0byBhIGZyZWUgKnwvIGJ5IDJ8NHw4LlxcbiAgLy9cXG4gIC8vIDguMCBpcyBzaGFycGVyXFxuICAvLyA0LjAgaXMgc29mdGVyXFxuICAvLyAyLjAgaXMgcmVhbGx5IHNvZnQgKGdvb2QgZm9yIHZlY3RvciBncmFwaGljcyBpbnB1dHMpXFxuICAvL1xcbiAgI2lmIDFcXG4gICNkZWZpbmUgRlhBQV9DT05TT0xFUFMzX0VER0VfU0hBUlBORVNTIDguMFxcbiAgI2VuZGlmXFxuICAjaWYgMFxcbiAgI2RlZmluZSBGWEFBX0NPTlNPTEVQUzNfRURHRV9TSEFSUE5FU1MgNC4wXFxuICAjZW5kaWZcXG4gICNpZiAwXFxuICAjZGVmaW5lIEZYQUFfQ09OU09MRVBTM19FREdFX1NIQVJQTkVTUyAyLjBcXG4gICNlbmRpZlxcbiAgI2VuZGlmXFxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4gICNpZm5kZWYgRlhBQV9DT05TT0xFUFMzX0VER0VfVEhSRVNIT0xEXFxuICAvL1xcbiAgLy8gT25seSBlZmZlY3RzIFBTMy5cXG4gIC8vIE5vbi1QUzMgdHVuaW5nIGlzIGRvbmUgd2l0aCBzaGFkZXIgaW5wdXQuXFxuICAvL1xcbiAgLy8gVGhlIG1pbmltdW0gYW1vdW50IG9mIGxvY2FsIGNvbnRyYXN0IHJlcXVpcmVkIHRvIGFwcGx5IGFsZ29yaXRobS5cXG4gIC8vIFRoZSBjb25zb2xlIHNldHRpbmcgaGFzIGEgZGlmZmVyZW50IG1hcHBpbmcgdGhhbiB0aGUgcXVhbGl0eSBzZXR0aW5nLlxcbiAgLy9cXG4gIC8vIFRoaXMgb25seSBhcHBsaWVzIHdoZW4gRlhBQV9FQVJMWV9FWElUIGlzIDEuXFxuICAvL1xcbiAgLy8gRHVlIHRvIHRoZSBQUzMgYmVpbmcgQUxVIGJvdW5kLFxcbiAgLy8gdGhlcmUgYXJlIG9ubHkgdHdvIHNhZmUgdmFsdWVzIGhlcmU6IDAuMjUgYW5kIDAuMTI1LlxcbiAgLy8gVGhlc2Ugb3B0aW9ucyB1c2UgdGhlIHNoYWRlcnMgYWJpbGl0eSB0byBhIGZyZWUgKnwvIGJ5IDJ8NHw4LlxcbiAgLy9cXG4gIC8vIDAuMTI1IGxlYXZlcyBsZXNzIGFsaWFzaW5nLCBidXQgaXMgc29mdGVyXFxuICAvLyAwLjI1IGxlYXZlcyBtb3JlIGFsaWFzaW5nLCBhbmQgaXMgc2hhcnBlclxcbiAgLy9cXG4gICNpZiAxXFxuICAjZGVmaW5lIEZYQUFfQ09OU09MRVBTM19FREdFX1RIUkVTSE9MRCAwLjEyNVxcbiAgI2Vsc2VcXG4gICNkZWZpbmUgRlhBQV9DT05TT0xFUFMzX0VER0VfVEhSRVNIT0xEIDAuMjVcXG4gICNlbmRpZlxcbiAgI2VuZGlmXFxuXFxuICAvKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cXG4gICAgICAgICAgICAgICAgICAgICAgICAgIEZYQUEgUVVBTElUWSAtIFRVTklORyBLTk9CU1xcbiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXFxuICBOT1RFIHRoZSBvdGhlciB0dW5pbmcga25vYnMgYXJlIG5vdyBpbiB0aGUgc2hhZGVyIGZ1bmN0aW9uIGlucHV0cyFcXG4gID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xcbiAgI2lmbmRlZiBGWEFBX1FVQUxJVFlQUkVTRVRcXG4gIC8vXFxuICAvLyBDaG9vc2UgdGhlIHF1YWxpdHkgcHJlc2V0LlxcbiAgLy8gVGhpcyBuZWVkcyB0byBiZSBjb21waWxlZCBpbnRvIHRoZSBzaGFkZXIgYXMgaXQgZWZmZWN0cyBjb2RlLlxcbiAgLy8gQmVzdCBvcHRpb24gdG8gaW5jbHVkZSBtdWx0aXBsZSBwcmVzZXRzIGlzIHRvXFxuICAvLyBpbiBlYWNoIHNoYWRlciBkZWZpbmUgdGhlIHByZXNldCwgdGhlbiBpbmNsdWRlIHRoaXMgZmlsZS5cXG4gIC8vXFxuICAvLyBPUFRJT05TXFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxcbiAgLy8gMTAgdG8gMTUgLSBkZWZhdWx0IG1lZGl1bSBkaXRoZXIgKDEwPWZhc3Rlc3QsIDE1PWhpZ2hlc3QgcXVhbGl0eSlcXG4gIC8vIDIwIHRvIDI5IC0gbGVzcyBkaXRoZXIsIG1vcmUgZXhwZW5zaXZlICgyMD1mYXN0ZXN0LCAyOT1oaWdoZXN0IHF1YWxpdHkpXFxuICAvLyAzOSAgICAgICAtIG5vIGRpdGhlciwgdmVyeSBleHBlbnNpdmVcXG4gIC8vXFxuICAvLyBOT1RFU1xcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cXG4gIC8vIDEyID0gc2xpZ2h0bHkgZmFzdGVyIHRoZW4gRlhBQSAzLjkgYW5kIGhpZ2hlciBlZGdlIHF1YWxpdHkgKGRlZmF1bHQpXFxuICAvLyAxMyA9IGFib3V0IHNhbWUgc3BlZWQgYXMgRlhBQSAzLjkgYW5kIGJldHRlciB0aGFuIDEyXFxuICAvLyAyMyA9IGNsb3Nlc3QgdG8gRlhBQSAzLjkgdmlzdWFsbHkgYW5kIHBlcmZvcm1hbmNlIHdpc2VcXG4gIC8vICBfID0gdGhlIGxvd2VzdCBkaWdpdCBpcyBkaXJlY3RseSByZWxhdGVkIHRvIHBlcmZvcm1hbmNlXFxuICAvLyBfICA9IHRoZSBoaWdoZXN0IGRpZ2l0IGlzIGRpcmVjdGx5IHJlbGF0ZWQgdG8gc3R5bGVcXG4gIC8vXFxuICAjZGVmaW5lIEZYQUFfUVVBTElUWVBSRVNFVCAxMlxcbiAgI2VuZGlmXFxuXFxuXFxuICAvKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZYQUEgUVVBTElUWSAtIFBSRVNFVFNcXG4gID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xcblxcbiAgLyo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XFxuICAgICAgICAgICAgICAgICAgICAgICBGWEFBIFFVQUxJVFkgLSBNRURJVU0gRElUSEVSIFBSRVNFVFNcXG4gID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xcbiAgI2lmKEZYQUFfUVVBTElUWVBSRVNFVCA9PSAxMClcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVBTIDNcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAwIDEuNVxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDEgMy4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMiAxMi4wXFxuI2VuZGlmXFxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuI2lmIChGWEFBX1FVQUxJVFlQUkVTRVQgPT0gMTEpXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQUyA0XFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMCAxLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAxIDEuNVxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDIgMy4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMyAxMi4wXFxuI2VuZGlmXFxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuI2lmIChGWEFBX1FVQUxJVFlQUkVTRVQgPT0gMTIpXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQUyA1XFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMCAxLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAxIDEuNVxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDIgMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMyA0LjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVA0IDEyLjBcXG4jZW5kaWZcXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4jaWYgKEZYQUFfUVVBTElUWVBSRVNFVCA9PSAxMylcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVBTIDZcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAwIDEuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDEgMS41XFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMiAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAzIDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDQgNC4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQNSAxMi4wXFxuI2VuZGlmXFxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuI2lmIChGWEFBX1FVQUxJVFlQUkVTRVQgPT0gMTQpXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQUyA3XFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMCAxLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAxIDEuNVxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDIgMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMyAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVA0IDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDUgNC4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQNiAxMi4wXFxuI2VuZGlmXFxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuI2lmIChGWEFBX1FVQUxJVFlQUkVTRVQgPT0gMTUpXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQUyA4XFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMCAxLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAxIDEuNVxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDIgMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMyAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVA0IDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDUgMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQNiA0LjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVA3IDEyLjBcXG4jZW5kaWZcXG5cXG4vKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cXG4gICAgICAgICAgICAgICAgICAgICBGWEFBIFFVQUxJVFkgLSBMT1cgRElUSEVSIFBSRVNFVFNcXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ki9cXG4jaWYgKEZYQUFfUVVBTElUWVBSRVNFVCA9PSAyMClcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVBTIDNcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAwIDEuNVxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDEgMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMiA4LjBcXG4jZW5kaWZcXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4jaWYgKEZYQUFfUVVBTElUWVBSRVNFVCA9PSAyMSlcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVBTIDRcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAwIDEuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDEgMS41XFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMiAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAzIDguMFxcbiNlbmRpZlxcbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiNpZiAoRlhBQV9RVUFMSVRZUFJFU0VUID09IDIyKVxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUFMgNVxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDAgMS4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMSAxLjVcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAyIDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDMgMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQNCA4LjBcXG4jZW5kaWZcXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4jaWYgKEZYQUFfUVVBTElUWVBSRVNFVCA9PSAyMylcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVBTIDZcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAwIDEuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDEgMS41XFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMiAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAzIDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDQgMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQNSA4LjBcXG4jZW5kaWZcXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4jaWYgKEZYQUFfUVVBTElUWVBSRVNFVCA9PSAyNClcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVBTIDdcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAwIDEuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDEgMS41XFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMiAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAzIDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDQgMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQNSAzLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVA2IDguMFxcbiNlbmRpZlxcbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiNpZiAoRlhBQV9RVUFMSVRZUFJFU0VUID09IDI1KVxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUFMgOFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDAgMS4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMSAxLjVcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAyIDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDMgMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQNCAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVA1IDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDYgNC4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQNyA4LjBcXG4jZW5kaWZcXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4jaWYgKEZYQUFfUVVBTElUWVBSRVNFVCA9PSAyNilcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVBTIDlcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAwIDEuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDEgMS41XFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMiAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAzIDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDQgMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQNSAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVA2IDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDcgNC4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQOCA4LjBcXG4jZW5kaWZcXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4jaWYgKEZYQUFfUVVBTElUWVBSRVNFVCA9PSAyNylcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVBTIDEwXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMCAxLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAxIDEuNVxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDIgMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMyAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVA0IDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDUgMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQNiAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVA3IDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDggNC4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQOSA4LjBcXG4jZW5kaWZcXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4jaWYgKEZYQUFfUVVBTElUWVBSRVNFVCA9PSAyOClcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVBTIDExXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMCAxLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAxIDEuNVxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDIgMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMyAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVA0IDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDUgMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQNiAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVA3IDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDggMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQOSA0LjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAxMCA4LjBcXG4jZW5kaWZcXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4jaWYgKEZYQUFfUVVBTElUWVBSRVNFVCA9PSAyOSlcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVBTIDEyXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMCAxLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAxIDEuNVxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDIgMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMyAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVA0IDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDUgMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQNiAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVA3IDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDggMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQOSAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAxMCA0LjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAxMSA4LjBcXG4jZW5kaWZcXG5cXG4vKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cXG4gICAgICAgICAgICAgICAgICAgICBGWEFBIFFVQUxJVFkgLSBFWFRSRU1FIFFVQUxJVFlcXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ki9cXG4jaWYgKEZYQUFfUVVBTElUWVBSRVNFVCA9PSAzOSlcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVBTIDEyXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMCAxLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAxIDEuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDIgMS4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQMyAxLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVA0IDEuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDUgMS41XFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQNiAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVA3IDIuMFxcbiNkZWZpbmUgRlhBQV9RVUFMSVRZUDggMi4wXFxuI2RlZmluZSBGWEFBX1FVQUxJVFlQOSAyLjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAxMCA0LjBcXG4jZGVmaW5lIEZYQUFfUVVBTElUWVAxMSA4LjBcXG4jZW5kaWZcXG5cXG5cXG5cXG4vKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFQSSBQT1JUSU5HXFxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXFxuI2lmIChGWEFBX0dMU0xfMTAwID09IDEpIHx8IChGWEFBX0dMU0xfMTIwID09IDEpIHx8IChGWEFBX0dMU0xfMTMwID09IDEpXFxuI2RlZmluZSBGeGFhQm9vbCBib29sXFxuI2RlZmluZSBGeGFhRGlzY2FyZCBkaXNjYXJkXFxuI2RlZmluZSBGeGFhRmxvYXQgZmxvYXRcXG4jZGVmaW5lIEZ4YWFGbG9hdDIgdmVjMlxcbiNkZWZpbmUgRnhhYUZsb2F0MyB2ZWMzXFxuI2RlZmluZSBGeGFhRmxvYXQ0IHZlYzRcXG4jZGVmaW5lIEZ4YWFIYWxmIGZsb2F0XFxuI2RlZmluZSBGeGFhSGFsZjIgdmVjMlxcbiNkZWZpbmUgRnhhYUhhbGYzIHZlYzNcXG4jZGVmaW5lIEZ4YWFIYWxmNCB2ZWM0XFxuI2RlZmluZSBGeGFhSW50MiBpdmVjMlxcbiNkZWZpbmUgRnhhYVNhdCh4KSBjbGFtcCh4LCAwLjAsIDEuMClcXG4jZGVmaW5lIEZ4YWFUZXggc2FtcGxlcjJEXFxuI2Vsc2VcXG4jZGVmaW5lIEZ4YWFCb29sIGJvb2xcXG4jZGVmaW5lIEZ4YWFEaXNjYXJkIGNsaXAoLTEpXFxuI2RlZmluZSBGeGFhRmxvYXQgZmxvYXRcXG4jZGVmaW5lIEZ4YWFGbG9hdDIgZmxvYXQyXFxuI2RlZmluZSBGeGFhRmxvYXQzIGZsb2F0M1xcbiNkZWZpbmUgRnhhYUZsb2F0NCBmbG9hdDRcXG4jZGVmaW5lIEZ4YWFIYWxmIGhhbGZcXG4jZGVmaW5lIEZ4YWFIYWxmMiBoYWxmMlxcbiNkZWZpbmUgRnhhYUhhbGYzIGhhbGYzXFxuI2RlZmluZSBGeGFhSGFsZjQgaGFsZjRcXG4jZGVmaW5lIEZ4YWFTYXQoeCkgc2F0dXJhdGUoeClcXG4jZW5kaWZcXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4jaWYgKEZYQUFfR0xTTF8xMDAgPT0gMSlcXG4jZGVmaW5lIEZ4YWFUZXhUb3AodCwgcCkgdGV4dHVyZSh0LCBwLCAwLjApXFxuI2RlZmluZSBGeGFhVGV4T2ZmKHQsIHAsIG8sIHIpIHRleHR1cmUodCwgcCArIChvICogciksIDAuMClcXG4jZW5kaWZcXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4jaWYgKEZYQUFfR0xTTF8xMjAgPT0gMSlcXG4vLyBSZXF1aXJlcyxcXG4vLyAgI3ZlcnNpb24gMTIwXFxuLy8gQW5kIGF0IGxlYXN0LFxcbi8vICAjZXh0ZW5zaW9uIEdMRVhUX2dwdV9zaGFkZXI0IDogZW5hYmxlXFxuLy8gIChvciBzZXQgRlhBQV9GQVNUX1BJWEVMX09GRlNFVCAxIHRvIHdvcmsgbGlrZSBEWDkpXFxuI2RlZmluZSBGeGFhVGV4VG9wKHQsIHApIHRleHR1cmUyRExvZCh0LCBwLCAwLjApXFxuI2lmIChGWEFBX0ZBU1RfUElYRUxfT0ZGU0VUID09IDEpXFxuI2RlZmluZSBGeGFhVGV4T2ZmKHQsIHAsIG8sIHIpIHRleHR1cmUyRExvZE9mZnNldCh0LCBwLCAwLjAsIG8pXFxuI2Vsc2VcXG4jZGVmaW5lIEZ4YWFUZXhPZmYodCwgcCwgbywgcikgdGV4dHVyZTJETG9kKHQsIHAgKyAobyAqIHIpLCAwLjApXFxuI2VuZGlmXFxuI2lmIChGWEFBX0dBVEhFUjRfQUxQSEEgPT0gMSlcXG4vLyB1c2UgI2V4dGVuc2lvbiBHTEFSQl9ncHVfc2hhZGVyNSA6IGVuYWJsZVxcbiNkZWZpbmUgRnhhYVRleEFscGhhNCh0LCBwKSB0ZXh0dXJlR2F0aGVyKHQsIHAsIDMpXFxuI2RlZmluZSBGeGFhVGV4T2ZmQWxwaGE0KHQsIHAsIG8pIHRleHR1cmVHYXRoZXJPZmZzZXQodCwgcCwgbywgMylcXG4jZGVmaW5lIEZ4YWFUZXhHcmVlbjQodCwgcCkgdGV4dHVyZUdhdGhlcih0LCBwLCAxKVxcbiNkZWZpbmUgRnhhYVRleE9mZkdyZWVuNCh0LCBwLCBvKSB0ZXh0dXJlR2F0aGVyT2Zmc2V0KHQsIHAsIG8sIDEpXFxuI2VuZGlmXFxuI2VuZGlmXFxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuI2lmIChGWEFBX0dMU0xfMTMwID09IDEpXFxuLy8gUmVxdWlyZXMgXFxcIiN2ZXJzaW9uIDEzMFxcXCIgb3IgYmV0dGVyXFxuI2RlZmluZSBGeGFhVGV4VG9wKHQsIHApIHRleHR1cmVMb2QodCwgcCwgMC4wKVxcbiNkZWZpbmUgRnhhYVRleE9mZih0LCBwLCBvLCByKSB0ZXh0dXJlTG9kT2Zmc2V0KHQsIHAsIDAuMCwgbylcXG4jaWYgKEZYQUFfR0FUSEVSNF9BTFBIQSA9PSAxKVxcbi8vIHVzZSAjZXh0ZW5zaW9uIEdMQVJCX2dwdV9zaGFkZXI1IDogZW5hYmxlXFxuI2RlZmluZSBGeGFhVGV4QWxwaGE0KHQsIHApIHRleHR1cmVHYXRoZXIodCwgcCwgMylcXG4jZGVmaW5lIEZ4YWFUZXhPZmZBbHBoYTQodCwgcCwgbykgdGV4dHVyZUdhdGhlck9mZnNldCh0LCBwLCBvLCAzKVxcbiNkZWZpbmUgRnhhYVRleEdyZWVuNCh0LCBwKSB0ZXh0dXJlR2F0aGVyKHQsIHAsIDEpXFxuI2RlZmluZSBGeGFhVGV4T2ZmR3JlZW40KHQsIHAsIG8pIHRleHR1cmVHYXRoZXJPZmZzZXQodCwgcCwgbywgMSlcXG4jZW5kaWZcXG4jZW5kaWZcXG5cXG5cXG4vKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cXG4gICAgICAgICAgICAgICAgICAgR1JFRU4gQVMgTFVNQSBPUFRJT04gU1VQUE9SVCBGVU5DVElPTlxcbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xcbiNpZiAoRlhBQV9HUkVFTl9BU19MVU1BID09IDApXFxuICBGeGFhRmxvYXQgRnhhYUx1bWEoRnhhYUZsb2F0NCByZ2JhKSB7IHJldHVybiBkb3QocmdiYS5yZ2IsIHZlYzMoMC4yOTg5MTIsIDAuNTg2NjExLCAwLjExNDQ3OCkpOyB9XFxuICAvLyBGeGFhRmxvYXQgRnhhYUx1bWEoRnhhYUZsb2F0NCByZ2JhKSB7IHJldHVybiByZ2JhLnc7IH1cXG4jZWxzZVxcbiAgRnhhYUZsb2F0IEZ4YWFMdW1hKEZ4YWFGbG9hdDQgcmdiYSkgeyByZXR1cm4gcmdiYS55OyB9XFxuI2VuZGlmXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuLyo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBGWEFBMyBRVUFMSVRZIC0gUENcXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ki9cXG4jaWYgKEZYQUFfUEMgPT0gMSlcXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgRnhhYUZsb2F0NCBGeGFhUGl4ZWxTaGFkZXIoXFxuICAgIC8vXFxuICAgIC8vIFVzZSBub3BlcnNwZWN0aXZlIGludGVycG9sYXRpb24gaGVyZSAodHVybiBvZmYgcGVyc3BlY3RpdmUgaW50ZXJwb2xhdGlvbikuXFxuICAgIC8vIHt4eX0gPSBjZW50ZXIgb2YgcGl4ZWxcXG4gICAgRnhhYUZsb2F0MiBwb3MsXFxuICAgIC8vXFxuICAgIC8vIFVzZWQgb25seSBmb3IgRlhBQSBDb25zb2xlLCBhbmQgbm90IHVzZWQgb24gdGhlIDM2MCB2ZXJzaW9uLlxcbiAgICAvLyBVc2Ugbm9wZXJzcGVjdGl2ZSBpbnRlcnBvbGF0aW9uIGhlcmUgKHR1cm4gb2ZmIHBlcnNwZWN0aXZlIGludGVycG9sYXRpb24pLlxcbiAgICAvLyB7eHl9ID0gdXBwZXIgbGVmdCBvZiBwaXhlbFxcbiAgICAvLyB7end9ID0gbG93ZXIgcmlnaHQgb2YgcGl4ZWxcXG4gICAgRnhhYUZsb2F0NCBmeGFhQ29uc29sZVBvc1BvcyxcXG4gICAgLy9cXG4gICAgLy8gSW5wdXQgY29sb3IgdGV4dHVyZS5cXG4gICAgLy8ge3JnYl99ID0gY29sb3IgaW4gbGluZWFyIG9yIHBlcmNlcHR1YWwgY29sb3Igc3BhY2VcXG4gICAgLy8gaWYgKEZYQUFfR1JFRU5fQVNfTFVNQSA9PSAwKVxcbiAgICAvLyAgICAge19hfSA9IGx1bWEgaW4gcGVyY2VwdHVhbCBjb2xvciBzcGFjZSAobm90IGxpbmVhcilcXG4gICAgRnhhYVRleCB0ZXgsXFxuICAgIC8vXFxuICAgIC8vIE9ubHkgdXNlZCBvbiB0aGUgb3B0aW1pemVkIDM2MCB2ZXJzaW9uIG9mIEZYQUEgQ29uc29sZS5cXG4gICAgLy8gRm9yIGV2ZXJ5dGhpbmcgYnV0IDM2MCwganVzdCB1c2UgdGhlIHNhbWUgaW5wdXQgaGVyZSBhcyBmb3IgXFxcInRleFxcXCIuXFxuICAgIC8vIEZvciAzNjAsIHNhbWUgdGV4dHVyZSwganVzdCBhbGlhcyB3aXRoIGEgMm5kIHNhbXBsZXIuXFxuICAgIC8vIFRoaXMgc2FtcGxlciBuZWVkcyB0byBoYXZlIGFuIGV4cG9uZW50IGJpYXMgb2YgLTEuXFxuICAgIEZ4YWFUZXggZnhhYUNvbnNvbGUzNjBUZXhFeHBCaWFzTmVnT25lLFxcbiAgICAvL1xcbiAgICAvLyBPbmx5IHVzZWQgb24gdGhlIG9wdGltaXplZCAzNjAgdmVyc2lvbiBvZiBGWEFBIENvbnNvbGUuXFxuICAgIC8vIEZvciBldmVyeXRoaW5nIGJ1dCAzNjAsIGp1c3QgdXNlIHRoZSBzYW1lIGlucHV0IGhlcmUgYXMgZm9yIFxcXCJ0ZXhcXFwiLlxcbiAgICAvLyBGb3IgMzYwLCBzYW1lIHRleHR1cmUsIGp1c3QgYWxpYXMgd2l0aCBhIDNuZCBzYW1wbGVyLlxcbiAgICAvLyBUaGlzIHNhbXBsZXIgbmVlZHMgdG8gaGF2ZSBhbiBleHBvbmVudCBiaWFzIG9mIC0yLlxcbiAgICBGeGFhVGV4IGZ4YWFDb25zb2xlMzYwVGV4RXhwQmlhc05lZ1R3byxcXG4gICAgLy9cXG4gICAgLy8gT25seSB1c2VkIG9uIEZYQUEgUXVhbGl0eS5cXG4gICAgLy8gVGhpcyBtdXN0IGJlIGZyb20gYSBjb25zdGFudC91bmlmb3JtLlxcbiAgICAvLyB7eF99ID0gMS4wL3NjcmVlbldpZHRoSW5QaXhlbHNcXG4gICAgLy8ge195fSA9IDEuMC9zY3JlZW5IZWlnaHRJblBpeGVsc1xcbiAgICBGeGFhRmxvYXQyIGZ4YWFRdWFsaXR5UmNwRnJhbWUsXFxuICAgIC8vXFxuICAgIC8vIE9ubHkgdXNlZCBvbiBGWEFBIENvbnNvbGUuXFxuICAgIC8vIFRoaXMgbXVzdCBiZSBmcm9tIGEgY29uc3RhbnQvdW5pZm9ybS5cXG4gICAgLy8gVGhpcyBlZmZlY3RzIHN1Yi1waXhlbCBBQSBxdWFsaXR5IGFuZCBpbnZlcnNlbHkgc2hhcnBuZXNzLlxcbiAgICAvLyAgIFdoZXJlIE4gcmFuZ2VzIGJldHdlZW4sXFxuICAgIC8vICAgICBOID0gMC41MCAoZGVmYXVsdClcXG4gICAgLy8gICAgIE4gPSAwLjMzIChzaGFycGVyKVxcbiAgICAvLyB7eF99ID0gLU4vc2NyZWVuV2lkdGhJblBpeGVsc1xcbiAgICAvLyB7X3l9ID0gLU4vc2NyZWVuSGVpZ2h0SW5QaXhlbHNcXG4gICAgLy8ge3pffSA9ICBOL3NjcmVlbldpZHRoSW5QaXhlbHNcXG4gICAgLy8ge193fSA9ICBOL3NjcmVlbkhlaWdodEluUGl4ZWxzXFxuICAgIEZ4YWFGbG9hdDQgZnhhYUNvbnNvbGVSY3BGcmFtZU9wdCxcXG4gICAgLy9cXG4gICAgLy8gT25seSB1c2VkIG9uIEZYQUEgQ29uc29sZS5cXG4gICAgLy8gTm90IHVzZWQgb24gMzYwLCBidXQgdXNlZCBvbiBQUzMgYW5kIFBDLlxcbiAgICAvLyBUaGlzIG11c3QgYmUgZnJvbSBhIGNvbnN0YW50L3VuaWZvcm0uXFxuICAgIC8vIHt4X30gPSAtMi4wL3NjcmVlbldpZHRoSW5QaXhlbHNcXG4gICAgLy8ge195fSA9IC0yLjAvc2NyZWVuSGVpZ2h0SW5QaXhlbHNcXG4gICAgLy8ge3pffSA9ICAyLjAvc2NyZWVuV2lkdGhJblBpeGVsc1xcbiAgICAvLyB7X3d9ID0gIDIuMC9zY3JlZW5IZWlnaHRJblBpeGVsc1xcbiAgICBGeGFhRmxvYXQ0IGZ4YWFDb25zb2xlUmNwRnJhbWVPcHQyLFxcbiAgICAvL1xcbiAgICAvLyBPbmx5IHVzZWQgb24gRlhBQSBDb25zb2xlLlxcbiAgICAvLyBPbmx5IHVzZWQgb24gMzYwIGluIHBsYWNlIG9mIGZ4YWFDb25zb2xlUmNwRnJhbWVPcHQyLlxcbiAgICAvLyBUaGlzIG11c3QgYmUgZnJvbSBhIGNvbnN0YW50L3VuaWZvcm0uXFxuICAgIC8vIHt4X30gPSAgOC4wL3NjcmVlbldpZHRoSW5QaXhlbHNcXG4gICAgLy8ge195fSA9ICA4LjAvc2NyZWVuSGVpZ2h0SW5QaXhlbHNcXG4gICAgLy8ge3pffSA9IC00LjAvc2NyZWVuV2lkdGhJblBpeGVsc1xcbiAgICAvLyB7X3d9ID0gLTQuMC9zY3JlZW5IZWlnaHRJblBpeGVsc1xcbiAgICBGeGFhRmxvYXQ0IGZ4YWFDb25zb2xlMzYwUmNwRnJhbWVPcHQyLFxcbiAgICAvL1xcbiAgICAvLyBPbmx5IHVzZWQgb24gRlhBQSBRdWFsaXR5LlxcbiAgICAvLyBUaGlzIHVzZWQgdG8gYmUgdGhlIEZYQUFfUVVBTElUWVNVQlBJWCBkZWZpbmUuXFxuICAgIC8vIEl0IGlzIGhlcmUgbm93IHRvIGFsbG93IGVhc2llciB0dW5pbmcuXFxuICAgIC8vIENob29zZSB0aGUgYW1vdW50IG9mIHN1Yi1waXhlbCBhbGlhc2luZyByZW1vdmFsLlxcbiAgICAvLyBUaGlzIGNhbiBlZmZlY3Qgc2hhcnBuZXNzLlxcbiAgICAvLyAgIDEuMDAgLSB1cHBlciBsaW1pdCAoc29mdGVyKVxcbiAgICAvLyAgIDAuNzUgLSBkZWZhdWx0IGFtb3VudCBvZiBmaWx0ZXJpbmdcXG4gICAgLy8gICAwLjUwIC0gbG93ZXIgbGltaXQgKHNoYXJwZXIsIGxlc3Mgc3ViLXBpeGVsIGFsaWFzaW5nIHJlbW92YWwpXFxuICAgIC8vICAgMC4yNSAtIGFsbW9zdCBvZmZcXG4gICAgLy8gICAwLjAwIC0gY29tcGxldGVseSBvZmZcXG4gICAgRnhhYUZsb2F0IGZ4YWFRdWFsaXR5U3VicGl4LFxcbiAgICAvL1xcbiAgICAvLyBPbmx5IHVzZWQgb24gRlhBQSBRdWFsaXR5LlxcbiAgICAvLyBUaGlzIHVzZWQgdG8gYmUgdGhlIEZYQUFfUVVBTElUWUVER0VfVEhSRVNIT0xEIGRlZmluZS5cXG4gICAgLy8gSXQgaXMgaGVyZSBub3cgdG8gYWxsb3cgZWFzaWVyIHR1bmluZy5cXG4gICAgLy8gVGhlIG1pbmltdW0gYW1vdW50IG9mIGxvY2FsIGNvbnRyYXN0IHJlcXVpcmVkIHRvIGFwcGx5IGFsZ29yaXRobS5cXG4gICAgLy8gICAwLjMzMyAtIHRvbyBsaXR0bGUgKGZhc3RlcilcXG4gICAgLy8gICAwLjI1MCAtIGxvdyBxdWFsaXR5XFxuICAgIC8vICAgMC4xNjYgLSBkZWZhdWx0XFxuICAgIC8vICAgMC4xMjUgLSBoaWdoIHF1YWxpdHlcXG4gICAgLy8gICAwLjA2MyAtIG92ZXJraWxsIChzbG93ZXIpXFxuICAgIEZ4YWFGbG9hdCBmeGFhUXVhbGl0eUVkZ2VUaHJlc2hvbGQsXFxuICAgIC8vXFxuICAgIC8vIE9ubHkgdXNlZCBvbiBGWEFBIFF1YWxpdHkuXFxuICAgIC8vIFRoaXMgdXNlZCB0byBiZSB0aGUgRlhBQV9RVUFMSVRZRURHRV9USFJFU0hPTERfTUlOIGRlZmluZS5cXG4gICAgLy8gSXQgaXMgaGVyZSBub3cgdG8gYWxsb3cgZWFzaWVyIHR1bmluZy5cXG4gICAgLy8gVHJpbXMgdGhlIGFsZ29yaXRobSBmcm9tIHByb2Nlc3NpbmcgZGFya3MuXFxuICAgIC8vICAgMC4wODMzIC0gdXBwZXIgbGltaXQgKGRlZmF1bHQsIHRoZSBzdGFydCBvZiB2aXNpYmxlIHVuZmlsdGVyZWQgZWRnZXMpXFxuICAgIC8vICAgMC4wNjI1IC0gaGlnaCBxdWFsaXR5IChmYXN0ZXIpXFxuICAgIC8vICAgMC4wMzEyIC0gdmlzaWJsZSBsaW1pdCAoc2xvd2VyKVxcbiAgICAvLyBTcGVjaWFsIG5vdGVzIHdoZW4gdXNpbmcgRlhBQV9HUkVFTl9BU19MVU1BLFxcbiAgICAvLyAgIExpa2VseSB3YW50IHRvIHNldCB0aGlzIHRvIHplcm8uXFxuICAgIC8vICAgQXMgY29sb3JzIHRoYXQgYXJlIG1vc3RseSBub3QtZ3JlZW5cXG4gICAgLy8gICB3aWxsIGFwcGVhciB2ZXJ5IGRhcmsgaW4gdGhlIGdyZWVuIGNoYW5uZWwhXFxuICAgIC8vICAgVHVuZSBieSBsb29raW5nIGF0IG1vc3RseSBub24tZ3JlZW4gY29udGVudCxcXG4gICAgLy8gICB0aGVuIHN0YXJ0IGF0IHplcm8gYW5kIGluY3JlYXNlIHVudGlsIGFsaWFzaW5nIGlzIGEgcHJvYmxlbS5cXG4gICAgRnhhYUZsb2F0IGZ4YWFRdWFsaXR5RWRnZVRocmVzaG9sZE1pbixcXG4gICAgLy9cXG4gICAgLy8gT25seSB1c2VkIG9uIEZYQUEgQ29uc29sZS5cXG4gICAgLy8gVGhpcyB1c2VkIHRvIGJlIHRoZSBGWEFBX0NPTlNPTEVFREdFX1NIQVJQTkVTUyBkZWZpbmUuXFxuICAgIC8vIEl0IGlzIGhlcmUgbm93IHRvIGFsbG93IGVhc2llciB0dW5pbmcuXFxuICAgIC8vIFRoaXMgZG9lcyBub3QgZWZmZWN0IFBTMywgYXMgdGhpcyBuZWVkcyB0byBiZSBjb21waWxlZCBpbi5cXG4gICAgLy8gICBVc2UgRlhBQV9DT05TT0xFUFMzX0VER0VfU0hBUlBORVNTIGZvciBQUzMuXFxuICAgIC8vICAgRHVlIHRvIHRoZSBQUzMgYmVpbmcgQUxVIGJvdW5kLFxcbiAgICAvLyAgIHRoZXJlIGFyZSBvbmx5IHRocmVlIHNhZmUgdmFsdWVzIGhlcmU6IDIgYW5kIDQgYW5kIDguXFxuICAgIC8vICAgVGhlc2Ugb3B0aW9ucyB1c2UgdGhlIHNoYWRlcnMgYWJpbGl0eSB0byBhIGZyZWUgKnwvIGJ5IDJ8NHw4LlxcbiAgICAvLyBGb3IgYWxsIG90aGVyIHBsYXRmb3JtcyBjYW4gYmUgYSBub24tcG93ZXIgb2YgdHdvLlxcbiAgICAvLyAgIDguMCBpcyBzaGFycGVyIChkZWZhdWx0ISEhKVxcbiAgICAvLyAgIDQuMCBpcyBzb2Z0ZXJcXG4gICAgLy8gICAyLjAgaXMgcmVhbGx5IHNvZnQgKGdvb2Qgb25seSBmb3IgdmVjdG9yIGdyYXBoaWNzIGlucHV0cylcXG4gICAgRnhhYUZsb2F0IGZ4YWFDb25zb2xlRWRnZVNoYXJwbmVzcyxcXG4gICAgLy9cXG4gICAgLy8gT25seSB1c2VkIG9uIEZYQUEgQ29uc29sZS5cXG4gICAgLy8gVGhpcyB1c2VkIHRvIGJlIHRoZSBGWEFBX0NPTlNPTEVFREdFX1RIUkVTSE9MRCBkZWZpbmUuXFxuICAgIC8vIEl0IGlzIGhlcmUgbm93IHRvIGFsbG93IGVhc2llciB0dW5pbmcuXFxuICAgIC8vIFRoaXMgZG9lcyBub3QgZWZmZWN0IFBTMywgYXMgdGhpcyBuZWVkcyB0byBiZSBjb21waWxlZCBpbi5cXG4gICAgLy8gICBVc2UgRlhBQV9DT05TT0xFUFMzX0VER0VfVEhSRVNIT0xEIGZvciBQUzMuXFxuICAgIC8vICAgRHVlIHRvIHRoZSBQUzMgYmVpbmcgQUxVIGJvdW5kLFxcbiAgICAvLyAgIHRoZXJlIGFyZSBvbmx5IHR3byBzYWZlIHZhbHVlcyBoZXJlOiAxLzQgYW5kIDEvOC5cXG4gICAgLy8gICBUaGVzZSBvcHRpb25zIHVzZSB0aGUgc2hhZGVycyBhYmlsaXR5IHRvIGEgZnJlZSAqfC8gYnkgMnw0fDguXFxuICAgIC8vIFRoZSBjb25zb2xlIHNldHRpbmcgaGFzIGEgZGlmZmVyZW50IG1hcHBpbmcgdGhhbiB0aGUgcXVhbGl0eSBzZXR0aW5nLlxcbiAgICAvLyBPdGhlciBwbGF0Zm9ybXMgY2FuIHVzZSBvdGhlciB2YWx1ZXMuXFxuICAgIC8vICAgMC4xMjUgbGVhdmVzIGxlc3MgYWxpYXNpbmcsIGJ1dCBpcyBzb2Z0ZXIgKGRlZmF1bHQhISEpXFxuICAgIC8vICAgMC4yNSBsZWF2ZXMgbW9yZSBhbGlhc2luZywgYW5kIGlzIHNoYXJwZXJcXG4gICAgRnhhYUZsb2F0IGZ4YWFDb25zb2xlRWRnZVRocmVzaG9sZCxcXG4gICAgLy9cXG4gICAgLy8gT25seSB1c2VkIG9uIEZYQUEgQ29uc29sZS5cXG4gICAgLy8gVGhpcyB1c2VkIHRvIGJlIHRoZSBGWEFBX0NPTlNPTEVFREdFX1RIUkVTSE9MRF9NSU4gZGVmaW5lLlxcbiAgICAvLyBJdCBpcyBoZXJlIG5vdyB0byBhbGxvdyBlYXNpZXIgdHVuaW5nLlxcbiAgICAvLyBUcmltcyB0aGUgYWxnb3JpdGhtIGZyb20gcHJvY2Vzc2luZyBkYXJrcy5cXG4gICAgLy8gVGhlIGNvbnNvbGUgc2V0dGluZyBoYXMgYSBkaWZmZXJlbnQgbWFwcGluZyB0aGFuIHRoZSBxdWFsaXR5IHNldHRpbmcuXFxuICAgIC8vIFRoaXMgb25seSBhcHBsaWVzIHdoZW4gRlhBQV9FQVJMWV9FWElUIGlzIDEuXFxuICAgIC8vIFRoaXMgZG9lcyBub3QgYXBwbHkgdG8gUFMzLFxcbiAgICAvLyBQUzMgd2FzIHNpbXBsaWZpZWQgdG8gYXZvaWQgbW9yZSBzaGFkZXIgaW5zdHJ1Y3Rpb25zLlxcbiAgICAvLyAgIDAuMDYgLSBmYXN0ZXIgYnV0IG1vcmUgYWxpYXNpbmcgaW4gZGFya3NcXG4gICAgLy8gICAwLjA1IC0gZGVmYXVsdFxcbiAgICAvLyAgIDAuMDQgLSBzbG93ZXIgYW5kIGxlc3MgYWxpYXNpbmcgaW4gZGFya3NcXG4gICAgLy8gU3BlY2lhbCBub3RlcyB3aGVuIHVzaW5nIEZYQUFfR1JFRU5fQVNfTFVNQSxcXG4gICAgLy8gICBMaWtlbHkgd2FudCB0byBzZXQgdGhpcyB0byB6ZXJvLlxcbiAgICAvLyAgIEFzIGNvbG9ycyB0aGF0IGFyZSBtb3N0bHkgbm90LWdyZWVuXFxuICAgIC8vICAgd2lsbCBhcHBlYXIgdmVyeSBkYXJrIGluIHRoZSBncmVlbiBjaGFubmVsIVxcbiAgICAvLyAgIFR1bmUgYnkgbG9va2luZyBhdCBtb3N0bHkgbm9uLWdyZWVuIGNvbnRlbnQsXFxuICAgIC8vICAgdGhlbiBzdGFydCBhdCB6ZXJvIGFuZCBpbmNyZWFzZSB1bnRpbCBhbGlhc2luZyBpcyBhIHByb2JsZW0uXFxuICAgIEZ4YWFGbG9hdCBmeGFhQ29uc29sZUVkZ2VUaHJlc2hvbGRNaW4sXFxuICAgIC8vXFxuICAgIC8vIEV4dHJhIGNvbnN0YW50cyBmb3IgMzYwIEZYQUEgQ29uc29sZSBvbmx5LlxcbiAgICAvLyBVc2UgemVyb3Mgb3IgYW55dGhpbmcgZWxzZSBmb3Igb3RoZXIgcGxhdGZvcm1zLlxcbiAgICAvLyBUaGVzZSBtdXN0IGJlIGluIHBoeXNpY2FsIGNvbnN0YW50IHJlZ2lzdGVycyBhbmQgTk9UIGltbWVkYXRlcy5cXG4gICAgLy8gSW1tZWRhdGVzIHdpbGwgcmVzdWx0IGluIGNvbXBpbGVyIHVuLW9wdGltaXppbmcuXFxuICAgIC8vIHt4eXp3fSA9IGZsb2F0NCgxLjAsIC0xLjAsIDAuMjUsIC0wLjI1KVxcbiAgICBGeGFhRmxvYXQ0IGZ4YWFDb25zb2xlMzYwQ29uc3REaXJcXG4gICkge1xcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuICBGeGFhRmxvYXQyIHBvc007XFxuICBwb3NNLnggPSBwb3MueDtcXG4gIHBvc00ueSA9IHBvcy55O1xcbiAgI2lmIChGWEFBX0dBVEhFUjRfQUxQSEEgPT0gMSlcXG4gICNpZiAoRlhBQV9ESVNDQVJEID09IDApXFxuICAgIEZ4YWFGbG9hdDQgcmdieU0gPSBGeGFhVGV4VG9wKHRleCwgcG9zTSk7XFxuICAjaWYgKEZYQUFfR1JFRU5fQVNfTFVNQSA9PSAwKVxcbiAgI2RlZmluZSBsdW1hTSByZ2J5TS53XFxuICAjZWxzZVxcbiAgI2RlZmluZSBsdW1hTSByZ2J5TS55XFxuICAjZW5kaWZcXG4gICNlbmRpZlxcbiAgI2lmIChGWEFBX0dSRUVOX0FTX0xVTUEgPT0gMClcXG4gICAgRnhhYUZsb2F0NCBsdW1hNEEgPSBGeGFhVGV4QWxwaGE0KHRleCwgcG9zTSk7XFxuICBGeGFhRmxvYXQ0IGx1bWE0QiA9IEZ4YWFUZXhPZmZBbHBoYTQodGV4LCBwb3NNLCBGeGFhSW50MigtMSwgLTEpKTtcXG4gICNlbHNlXFxuICBGeGFhRmxvYXQ0IGx1bWE0QSA9IEZ4YWFUZXhHcmVlbjQodGV4LCBwb3NNKTtcXG4gIEZ4YWFGbG9hdDQgbHVtYTRCID0gRnhhYVRleE9mZkdyZWVuNCh0ZXgsIHBvc00sIEZ4YWFJbnQyKC0xLCAtMSkpO1xcbiAgI2VuZGlmXFxuICAjaWYgKEZYQUFfRElTQ0FSRCA9PSAxKVxcbiAgI2RlZmluZSBsdW1hTSBsdW1hNEEud1xcbiAgI2VuZGlmXFxuICAjZGVmaW5lIGx1bWFFIGx1bWE0QS56XFxuICAjZGVmaW5lIGx1bWFTIGx1bWE0QS54XFxuICAjZGVmaW5lIGx1bWFTRSBsdW1hNEEueVxcbiAgI2RlZmluZSBsdW1hTlcgbHVtYTRCLndcXG4gICNkZWZpbmUgbHVtYU4gbHVtYTRCLnpcXG4gICNkZWZpbmUgbHVtYVcgbHVtYTRCLnhcXG4gICNlbHNlXFxuICBGeGFhRmxvYXQ0IHJnYnlNID0gRnhhYVRleFRvcCh0ZXgsIHBvc00pO1xcbiAgI2lmIChGWEFBX0dSRUVOX0FTX0xVTUEgPT0gMClcXG4gICNkZWZpbmUgbHVtYU0gcmdieU0ud1xcbiAgI2Vsc2VcXG4gICNkZWZpbmUgbHVtYU0gcmdieU0ueVxcbiAgI2VuZGlmXFxuICAjaWYgKEZYQUFfR0xTTF8xMDAgPT0gMSlcXG4gICAgRnhhYUZsb2F0IGx1bWFTID0gRnhhYUx1bWEoRnhhYVRleE9mZih0ZXgsIHBvc00sIEZ4YWFGbG9hdDIoMC4wLCAxLjApLCBmeGFhUXVhbGl0eVJjcEZyYW1lLnh5KSk7XFxuICBGeGFhRmxvYXQgbHVtYUUgPSBGeGFhTHVtYShGeGFhVGV4T2ZmKHRleCwgcG9zTSwgRnhhYUZsb2F0MigxLjAsIDAuMCksIGZ4YWFRdWFsaXR5UmNwRnJhbWUueHkpKTtcXG4gIEZ4YWFGbG9hdCBsdW1hTiA9IEZ4YWFMdW1hKEZ4YWFUZXhPZmYodGV4LCBwb3NNLCBGeGFhRmxvYXQyKDAuMCwgLTEuMCksIGZ4YWFRdWFsaXR5UmNwRnJhbWUueHkpKTtcXG4gIEZ4YWFGbG9hdCBsdW1hVyA9IEZ4YWFMdW1hKEZ4YWFUZXhPZmYodGV4LCBwb3NNLCBGeGFhRmxvYXQyKC0xLjAsIDAuMCksIGZ4YWFRdWFsaXR5UmNwRnJhbWUueHkpKTtcXG4gICNlbHNlXFxuICBGeGFhRmxvYXQgbHVtYVMgPSBGeGFhTHVtYShGeGFhVGV4T2ZmKHRleCwgcG9zTSwgRnhhYUludDIoMCwgMSksIGZ4YWFRdWFsaXR5UmNwRnJhbWUueHkpKTtcXG4gIEZ4YWFGbG9hdCBsdW1hRSA9IEZ4YWFMdW1hKEZ4YWFUZXhPZmYodGV4LCBwb3NNLCBGeGFhSW50MigxLCAwKSwgZnhhYVF1YWxpdHlSY3BGcmFtZS54eSkpO1xcbiAgRnhhYUZsb2F0IGx1bWFXID0gRnhhYUx1bWEoRnhhYVRleE9mZih0ZXgsIHBvc00sIEZ4YWFJbnQyKC0xLCAwKSwgZnhhYVF1YWxpdHlSY3BGcmFtZS54eSkpO1xcbiAgRnhhYUZsb2F0IGx1bWFOID0gRnhhYUx1bWEoRnhhYVRleE9mZih0ZXgsIHBvc00sIEZ4YWFJbnQyKDAsIC0xKSwgZnhhYVF1YWxpdHlSY3BGcmFtZS54eSkpO1xcbiAgI2VuZGlmXFxuICAjZW5kaWZcXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgRnhhYUZsb2F0IG1heFNNID0gbWF4KGx1bWFTLCBsdW1hTSk7XFxuICBGeGFhRmxvYXQgbWluU00gPSBtaW4obHVtYVMsIGx1bWFNKTtcXG4gIEZ4YWFGbG9hdCBtYXhFU00gPSBtYXgobHVtYUUsIG1heFNNKTtcXG4gIEZ4YWFGbG9hdCBtaW5FU00gPSBtaW4obHVtYUUsIG1pblNNKTtcXG4gIEZ4YWFGbG9hdCBtYXhXTiA9IG1heChsdW1hTiwgbHVtYVcpO1xcbiAgRnhhYUZsb2F0IG1pbldOID0gbWluKGx1bWFOLCBsdW1hVyk7XFxuICBGeGFhRmxvYXQgcmFuZ2VNYXggPSBtYXgobWF4V04sIG1heEVTTSk7XFxuICBGeGFhRmxvYXQgcmFuZ2VNaW4gPSBtaW4obWluV04sIG1pbkVTTSk7XFxuICBGeGFhRmxvYXQgcmFuZ2VNYXhTY2FsZWQgPSByYW5nZU1heCAqIGZ4YWFRdWFsaXR5RWRnZVRocmVzaG9sZDtcXG4gIEZ4YWFGbG9hdCByYW5nZSA9IHJhbmdlTWF4IC0gcmFuZ2VNaW47XFxuICBGeGFhRmxvYXQgcmFuZ2VNYXhDbGFtcGVkID0gbWF4KGZ4YWFRdWFsaXR5RWRnZVRocmVzaG9sZE1pbiwgcmFuZ2VNYXhTY2FsZWQpO1xcbiAgRnhhYUJvb2wgZWFybHlFeGl0ID0gcmFuZ2UgPCByYW5nZU1heENsYW1wZWQ7XFxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4gIGlmIChlYXJseUV4aXQpXFxuICAjaWYgKEZYQUFfRElTQ0FSRCA9PSAxKVxcbiAgICBGeGFhRGlzY2FyZDtcXG4gICNlbHNlXFxuICByZXR1cm4gcmdieU07XFxuICAjZW5kaWZcXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgI2lmIChGWEFBX0dBVEhFUjRfQUxQSEEgPT0gMClcXG4gICNpZiAoRlhBQV9HTFNMXzEwMCA9PSAxKVxcbiAgICBGeGFhRmxvYXQgbHVtYU5XID0gRnhhYUx1bWEoRnhhYVRleE9mZih0ZXgsIHBvc00sIEZ4YWFGbG9hdDIoLTEuMCwgLTEuMCksIGZ4YWFRdWFsaXR5UmNwRnJhbWUueHkpKTtcXG4gIEZ4YWFGbG9hdCBsdW1hU0UgPSBGeGFhTHVtYShGeGFhVGV4T2ZmKHRleCwgcG9zTSwgRnhhYUZsb2F0MigxLjAsIDEuMCksIGZ4YWFRdWFsaXR5UmNwRnJhbWUueHkpKTtcXG4gIEZ4YWFGbG9hdCBsdW1hTkUgPSBGeGFhTHVtYShGeGFhVGV4T2ZmKHRleCwgcG9zTSwgRnhhYUZsb2F0MigxLjAsIC0xLjApLCBmeGFhUXVhbGl0eVJjcEZyYW1lLnh5KSk7XFxuICBGeGFhRmxvYXQgbHVtYVNXID0gRnhhYUx1bWEoRnhhYVRleE9mZih0ZXgsIHBvc00sIEZ4YWFGbG9hdDIoLTEuMCwgMS4wKSwgZnhhYVF1YWxpdHlSY3BGcmFtZS54eSkpO1xcbiAgI2Vsc2VcXG4gIEZ4YWFGbG9hdCBsdW1hTlcgPSBGeGFhTHVtYShGeGFhVGV4T2ZmKHRleCwgcG9zTSwgRnhhYUludDIoLTEsIC0xKSwgZnhhYVF1YWxpdHlSY3BGcmFtZS54eSkpO1xcbiAgRnhhYUZsb2F0IGx1bWFTRSA9IEZ4YWFMdW1hKEZ4YWFUZXhPZmYodGV4LCBwb3NNLCBGeGFhSW50MigxLCAxKSwgZnhhYVF1YWxpdHlSY3BGcmFtZS54eSkpO1xcbiAgRnhhYUZsb2F0IGx1bWFORSA9IEZ4YWFMdW1hKEZ4YWFUZXhPZmYodGV4LCBwb3NNLCBGeGFhSW50MigxLCAtMSksIGZ4YWFRdWFsaXR5UmNwRnJhbWUueHkpKTtcXG4gIEZ4YWFGbG9hdCBsdW1hU1cgPSBGeGFhTHVtYShGeGFhVGV4T2ZmKHRleCwgcG9zTSwgRnhhYUludDIoLTEsIDEpLCBmeGFhUXVhbGl0eVJjcEZyYW1lLnh5KSk7XFxuICAjZW5kaWZcXG4gICNlbHNlXFxuICBGeGFhRmxvYXQgbHVtYU5FID0gRnhhYUx1bWEoRnhhYVRleE9mZih0ZXgsIHBvc00sIEZ4YWFJbnQyKDEsIC0xKSwgZnhhYVF1YWxpdHlSY3BGcmFtZS54eSkpO1xcbiAgRnhhYUZsb2F0IGx1bWFTVyA9IEZ4YWFMdW1hKEZ4YWFUZXhPZmYodGV4LCBwb3NNLCBGeGFhSW50MigtMSwgMSksIGZ4YWFRdWFsaXR5UmNwRnJhbWUueHkpKTtcXG4gICNlbmRpZlxcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuICBGeGFhRmxvYXQgbHVtYU5TID0gbHVtYU4gKyBsdW1hUztcXG4gIEZ4YWFGbG9hdCBsdW1hV0UgPSBsdW1hVyArIGx1bWFFO1xcbiAgRnhhYUZsb2F0IHN1YnBpeFJjcFJhbmdlID0gMS4wIC8gcmFuZ2U7XFxuICBGeGFhRmxvYXQgc3VicGl4TlNXRSA9IGx1bWFOUyArIGx1bWFXRTtcXG4gIEZ4YWFGbG9hdCBlZGdlSG9yejEgPSAoLTIuMCAqIGx1bWFNKSArIGx1bWFOUztcXG4gIEZ4YWFGbG9hdCBlZGdlVmVydDEgPSAoLTIuMCAqIGx1bWFNKSArIGx1bWFXRTtcXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgRnhhYUZsb2F0IGx1bWFORVNFID0gbHVtYU5FICsgbHVtYVNFO1xcbiAgRnhhYUZsb2F0IGx1bWFOV05FID0gbHVtYU5XICsgbHVtYU5FO1xcbiAgRnhhYUZsb2F0IGVkZ2VIb3J6MiA9ICgtMi4wICogbHVtYUUpICsgbHVtYU5FU0U7XFxuICBGeGFhRmxvYXQgZWRnZVZlcnQyID0gKC0yLjAgKiBsdW1hTikgKyBsdW1hTldORTtcXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgRnhhYUZsb2F0IGx1bWFOV1NXID0gbHVtYU5XICsgbHVtYVNXO1xcbiAgRnhhYUZsb2F0IGx1bWFTV1NFID0gbHVtYVNXICsgbHVtYVNFO1xcbiAgRnhhYUZsb2F0IGVkZ2VIb3J6NCA9IChhYnMoZWRnZUhvcnoxKSAqIDIuMCkgKyBhYnMoZWRnZUhvcnoyKTtcXG4gIEZ4YWFGbG9hdCBlZGdlVmVydDQgPSAoYWJzKGVkZ2VWZXJ0MSkgKiAyLjApICsgYWJzKGVkZ2VWZXJ0Mik7XFxuICBGeGFhRmxvYXQgZWRnZUhvcnozID0gKC0yLjAgKiBsdW1hVykgKyBsdW1hTldTVztcXG4gIEZ4YWFGbG9hdCBlZGdlVmVydDMgPSAoLTIuMCAqIGx1bWFTKSArIGx1bWFTV1NFO1xcbiAgRnhhYUZsb2F0IGVkZ2VIb3J6ID0gYWJzKGVkZ2VIb3J6MykgKyBlZGdlSG9yejQ7XFxuICBGeGFhRmxvYXQgZWRnZVZlcnQgPSBhYnMoZWRnZVZlcnQzKSArIGVkZ2VWZXJ0NDtcXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgRnhhYUZsb2F0IHN1YnBpeE5XU1dORVNFID0gbHVtYU5XU1cgKyBsdW1hTkVTRTtcXG4gIEZ4YWFGbG9hdCBsZW5ndGhTaWduID0gZnhhYVF1YWxpdHlSY3BGcmFtZS54O1xcbiAgRnhhYUJvb2wgaG9yelNwYW4gPSBlZGdlSG9yeiA+PSBlZGdlVmVydDtcXG4gIEZ4YWFGbG9hdCBzdWJwaXhBID0gc3VicGl4TlNXRSAqIDIuMCArIHN1YnBpeE5XU1dORVNFO1xcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuICBpZiAoIWhvcnpTcGFuKSBsdW1hTiA9IGx1bWFXO1xcbiAgaWYgKCFob3J6U3BhbikgbHVtYVMgPSBsdW1hRTtcXG4gIGlmIChob3J6U3BhbikgbGVuZ3RoU2lnbiA9IGZ4YWFRdWFsaXR5UmNwRnJhbWUueTtcXG4gIEZ4YWFGbG9hdCBzdWJwaXhCID0gKHN1YnBpeEEgKiAoMS4wIC8gMTIuMCkpIC0gbHVtYU07XFxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4gIEZ4YWFGbG9hdCBncmFkaWVudE4gPSBsdW1hTiAtIGx1bWFNO1xcbiAgRnhhYUZsb2F0IGdyYWRpZW50UyA9IGx1bWFTIC0gbHVtYU07XFxuICBGeGFhRmxvYXQgbHVtYU5OID0gbHVtYU4gKyBsdW1hTTtcXG4gIEZ4YWFGbG9hdCBsdW1hU1MgPSBsdW1hUyArIGx1bWFNO1xcbiAgRnhhYUJvb2wgcGFpck4gPSBhYnMoZ3JhZGllbnROKSA+PSBhYnMoZ3JhZGllbnRTKTtcXG4gIEZ4YWFGbG9hdCBncmFkaWVudCA9IG1heChhYnMoZ3JhZGllbnROKSwgYWJzKGdyYWRpZW50UykpO1xcbiAgaWYgKHBhaXJOKSBsZW5ndGhTaWduID0gLWxlbmd0aFNpZ247XFxuICBGeGFhRmxvYXQgc3VicGl4QyA9IEZ4YWFTYXQoYWJzKHN1YnBpeEIpICogc3VicGl4UmNwUmFuZ2UpO1xcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuICBGeGFhRmxvYXQyIHBvc0I7XFxuICBwb3NCLnggPSBwb3NNLng7XFxuICBwb3NCLnkgPSBwb3NNLnk7XFxuICBGeGFhRmxvYXQyIG9mZk5QO1xcbiAgb2ZmTlAueCA9ICghaG9yelNwYW4pID8gMC4wIDogZnhhYVF1YWxpdHlSY3BGcmFtZS54O1xcbiAgb2ZmTlAueSA9IChob3J6U3BhbikgPyAwLjAgOiBmeGFhUXVhbGl0eVJjcEZyYW1lLnk7XFxuICBpZiAoIWhvcnpTcGFuKSBwb3NCLnggKz0gbGVuZ3RoU2lnbiAqIDAuNTtcXG4gIGlmIChob3J6U3BhbikgcG9zQi55ICs9IGxlbmd0aFNpZ24gKiAwLjU7XFxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4gIEZ4YWFGbG9hdDIgcG9zTjtcXG4gIHBvc04ueCA9IHBvc0IueCAtIG9mZk5QLnggKiBGWEFBX1FVQUxJVFlQMDtcXG4gIHBvc04ueSA9IHBvc0IueSAtIG9mZk5QLnkgKiBGWEFBX1FVQUxJVFlQMDtcXG4gIEZ4YWFGbG9hdDIgcG9zUDtcXG4gIHBvc1AueCA9IHBvc0IueCArIG9mZk5QLnggKiBGWEFBX1FVQUxJVFlQMDtcXG4gIHBvc1AueSA9IHBvc0IueSArIG9mZk5QLnkgKiBGWEFBX1FVQUxJVFlQMDtcXG4gIEZ4YWFGbG9hdCBzdWJwaXhEID0gKCgtMi4wKSAqIHN1YnBpeEMpICsgMy4wO1xcbiAgRnhhYUZsb2F0IGx1bWFFbmROID0gRnhhYUx1bWEoRnhhYVRleFRvcCh0ZXgsIHBvc04pKTtcXG4gIEZ4YWFGbG9hdCBzdWJwaXhFID0gc3VicGl4QyAqIHN1YnBpeEM7XFxuICBGeGFhRmxvYXQgbHVtYUVuZFAgPSBGeGFhTHVtYShGeGFhVGV4VG9wKHRleCwgcG9zUCkpO1xcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuICBpZiAoIXBhaXJOKSBsdW1hTk4gPSBsdW1hU1M7XFxuICBGeGFhRmxvYXQgZ3JhZGllbnRTY2FsZWQgPSBncmFkaWVudCAqIDEuMCAvIDQuMDtcXG4gIEZ4YWFGbG9hdCBsdW1hTU0gPSBsdW1hTSAtIGx1bWFOTiAqIDAuNTtcXG4gIEZ4YWFGbG9hdCBzdWJwaXhGID0gc3VicGl4RCAqIHN1YnBpeEU7XFxuICBGeGFhQm9vbCBsdW1hTUxUWmVybyA9IGx1bWFNTSA8IDAuMDtcXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgbHVtYUVuZE4gLT0gbHVtYU5OICogMC41O1xcbiAgbHVtYUVuZFAgLT0gbHVtYU5OICogMC41O1xcbiAgRnhhYUJvb2wgZG9uZU4gPSBhYnMobHVtYUVuZE4pID49IGdyYWRpZW50U2NhbGVkO1xcbiAgRnhhYUJvb2wgZG9uZVAgPSBhYnMobHVtYUVuZFApID49IGdyYWRpZW50U2NhbGVkO1xcbiAgaWYgKCFkb25lTikgcG9zTi54IC09IG9mZk5QLnggKiBGWEFBX1FVQUxJVFlQMTtcXG4gIGlmICghZG9uZU4pIHBvc04ueSAtPSBvZmZOUC55ICogRlhBQV9RVUFMSVRZUDE7XFxuICBGeGFhQm9vbCBkb25lTlAgPSAoIWRvbmVOKSB8fCAoIWRvbmVQKTtcXG4gIGlmICghZG9uZVApIHBvc1AueCArPSBvZmZOUC54ICogRlhBQV9RVUFMSVRZUDE7XFxuICBpZiAoIWRvbmVQKSBwb3NQLnkgKz0gb2ZmTlAueSAqIEZYQUFfUVVBTElUWVAxO1xcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuICBpZiAoZG9uZU5QKSB7XFxuICAgIGlmICghZG9uZU4pIGx1bWFFbmROID0gRnhhYUx1bWEoRnhhYVRleFRvcCh0ZXgsIHBvc04ueHkpKTtcXG4gICAgaWYgKCFkb25lUCkgbHVtYUVuZFAgPSBGeGFhTHVtYShGeGFhVGV4VG9wKHRleCwgcG9zUC54eSkpO1xcbiAgICBpZiAoIWRvbmVOKSBsdW1hRW5kTiA9IGx1bWFFbmROIC0gbHVtYU5OICogMC41O1xcbiAgICBpZiAoIWRvbmVQKSBsdW1hRW5kUCA9IGx1bWFFbmRQIC0gbHVtYU5OICogMC41O1xcbiAgICBkb25lTiA9IGFicyhsdW1hRW5kTikgPj0gZ3JhZGllbnRTY2FsZWQ7XFxuICAgIGRvbmVQID0gYWJzKGx1bWFFbmRQKSA+PSBncmFkaWVudFNjYWxlZDtcXG4gICAgaWYgKCFkb25lTikgcG9zTi54IC09IG9mZk5QLnggKiBGWEFBX1FVQUxJVFlQMjtcXG4gICAgaWYgKCFkb25lTikgcG9zTi55IC09IG9mZk5QLnkgKiBGWEFBX1FVQUxJVFlQMjtcXG4gICAgZG9uZU5QID0gKCFkb25lTikgfHwgKCFkb25lUCk7XFxuICAgIGlmICghZG9uZVApIHBvc1AueCArPSBvZmZOUC54ICogRlhBQV9RVUFMSVRZUDI7XFxuICAgIGlmICghZG9uZVApIHBvc1AueSArPSBvZmZOUC55ICogRlhBQV9RVUFMSVRZUDI7XFxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgICAjaWYgKEZYQUFfUVVBTElUWVBTID4gMylcXG4gICAgICBpZiAoZG9uZU5QKSB7XFxuICAgICAgICBpZiAoIWRvbmVOKSBsdW1hRW5kTiA9IEZ4YWFMdW1hKEZ4YWFUZXhUb3AodGV4LCBwb3NOLnh5KSk7XFxuICAgICAgICBpZiAoIWRvbmVQKSBsdW1hRW5kUCA9IEZ4YWFMdW1hKEZ4YWFUZXhUb3AodGV4LCBwb3NQLnh5KSk7XFxuICAgICAgICBpZiAoIWRvbmVOKSBsdW1hRW5kTiA9IGx1bWFFbmROIC0gbHVtYU5OICogMC41O1xcbiAgICAgICAgaWYgKCFkb25lUCkgbHVtYUVuZFAgPSBsdW1hRW5kUCAtIGx1bWFOTiAqIDAuNTtcXG4gICAgICAgIGRvbmVOID0gYWJzKGx1bWFFbmROKSA+PSBncmFkaWVudFNjYWxlZDtcXG4gICAgICAgIGRvbmVQID0gYWJzKGx1bWFFbmRQKSA+PSBncmFkaWVudFNjYWxlZDtcXG4gICAgICAgIGlmICghZG9uZU4pIHBvc04ueCAtPSBvZmZOUC54ICogRlhBQV9RVUFMSVRZUDM7XFxuICAgICAgICBpZiAoIWRvbmVOKSBwb3NOLnkgLT0gb2ZmTlAueSAqIEZYQUFfUVVBTElUWVAzO1xcbiAgICAgICAgZG9uZU5QID0gKCFkb25lTikgfHwgKCFkb25lUCk7XFxuICAgICAgICBpZiAoIWRvbmVQKSBwb3NQLnggKz0gb2ZmTlAueCAqIEZYQUFfUVVBTElUWVAzO1xcbiAgICAgICAgaWYgKCFkb25lUCkgcG9zUC55ICs9IG9mZk5QLnkgKiBGWEFBX1FVQUxJVFlQMztcXG4gICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgICAgICAgI2lmIChGWEFBX1FVQUxJVFlQUyA+IDQpXFxuICAgICAgICAgIGlmIChkb25lTlApIHtcXG4gICAgICAgICAgICBpZiAoIWRvbmVOKSBsdW1hRW5kTiA9IEZ4YWFMdW1hKEZ4YWFUZXhUb3AodGV4LCBwb3NOLnh5KSk7XFxuICAgICAgICAgICAgaWYgKCFkb25lUCkgbHVtYUVuZFAgPSBGeGFhTHVtYShGeGFhVGV4VG9wKHRleCwgcG9zUC54eSkpO1xcbiAgICAgICAgICAgIGlmICghZG9uZU4pIGx1bWFFbmROID0gbHVtYUVuZE4gLSBsdW1hTk4gKiAwLjU7XFxuICAgICAgICAgICAgaWYgKCFkb25lUCkgbHVtYUVuZFAgPSBsdW1hRW5kUCAtIGx1bWFOTiAqIDAuNTtcXG4gICAgICAgICAgICBkb25lTiA9IGFicyhsdW1hRW5kTikgPj0gZ3JhZGllbnRTY2FsZWQ7XFxuICAgICAgICAgICAgZG9uZVAgPSBhYnMobHVtYUVuZFApID49IGdyYWRpZW50U2NhbGVkO1xcbiAgICAgICAgICAgIGlmICghZG9uZU4pIHBvc04ueCAtPSBvZmZOUC54ICogRlhBQV9RVUFMSVRZUDQ7XFxuICAgICAgICAgICAgaWYgKCFkb25lTikgcG9zTi55IC09IG9mZk5QLnkgKiBGWEFBX1FVQUxJVFlQNDtcXG4gICAgICAgICAgICBkb25lTlAgPSAoIWRvbmVOKSB8fCAoIWRvbmVQKTtcXG4gICAgICAgICAgICBpZiAoIWRvbmVQKSBwb3NQLnggKz0gb2ZmTlAueCAqIEZYQUFfUVVBTElUWVA0O1xcbiAgICAgICAgICAgIGlmICghZG9uZVApIHBvc1AueSArPSBvZmZOUC55ICogRlhBQV9RVUFMSVRZUDQ7XFxuICAgICAgICAgICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuICAgICAgICAgICAgI2lmIChGWEFBX1FVQUxJVFlQUyA+IDUpXFxuICAgICAgICAgICAgICBpZiAoZG9uZU5QKSB7XFxuICAgICAgICAgICAgICAgIGlmICghZG9uZU4pIGx1bWFFbmROID0gRnhhYUx1bWEoRnhhYVRleFRvcCh0ZXgsIHBvc04ueHkpKTtcXG4gICAgICAgICAgICAgICAgaWYgKCFkb25lUCkgbHVtYUVuZFAgPSBGeGFhTHVtYShGeGFhVGV4VG9wKHRleCwgcG9zUC54eSkpO1xcbiAgICAgICAgICAgICAgICBpZiAoIWRvbmVOKSBsdW1hRW5kTiA9IGx1bWFFbmROIC0gbHVtYU5OICogMC41O1xcbiAgICAgICAgICAgICAgICBpZiAoIWRvbmVQKSBsdW1hRW5kUCA9IGx1bWFFbmRQIC0gbHVtYU5OICogMC41O1xcbiAgICAgICAgICAgICAgICBkb25lTiA9IGFicyhsdW1hRW5kTikgPj0gZ3JhZGllbnRTY2FsZWQ7XFxuICAgICAgICAgICAgICAgIGRvbmVQID0gYWJzKGx1bWFFbmRQKSA+PSBncmFkaWVudFNjYWxlZDtcXG4gICAgICAgICAgICAgICAgaWYgKCFkb25lTikgcG9zTi54IC09IG9mZk5QLnggKiBGWEFBX1FVQUxJVFlQNTtcXG4gICAgICAgICAgICAgICAgaWYgKCFkb25lTikgcG9zTi55IC09IG9mZk5QLnkgKiBGWEFBX1FVQUxJVFlQNTtcXG4gICAgICAgICAgICAgICAgZG9uZU5QID0gKCFkb25lTikgfHwgKCFkb25lUCk7XFxuICAgICAgICAgICAgICAgIGlmICghZG9uZVApIHBvc1AueCArPSBvZmZOUC54ICogRlhBQV9RVUFMSVRZUDU7XFxuICAgICAgICAgICAgICAgIGlmICghZG9uZVApIHBvc1AueSArPSBvZmZOUC55ICogRlhBQV9RVUFMSVRZUDU7XFxuICAgICAgICAgICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgICAgICAgICAgICAgICAjaWYgKEZYQUFfUVVBTElUWVBTID4gNilcXG4gICAgICAgICAgICAgICAgICBpZiAoZG9uZU5QKSB7XFxuICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVOKSBsdW1hRW5kTiA9IEZ4YWFMdW1hKEZ4YWFUZXhUb3AodGV4LCBwb3NOLnh5KSk7XFxuICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVQKSBsdW1hRW5kUCA9IEZ4YWFMdW1hKEZ4YWFUZXhUb3AodGV4LCBwb3NQLnh5KSk7XFxuICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVOKSBsdW1hRW5kTiA9IGx1bWFFbmROIC0gbHVtYU5OICogMC41O1xcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkb25lUCkgbHVtYUVuZFAgPSBsdW1hRW5kUCAtIGx1bWFOTiAqIDAuNTtcXG4gICAgICAgICAgICAgICAgICAgIGRvbmVOID0gYWJzKGx1bWFFbmROKSA+PSBncmFkaWVudFNjYWxlZDtcXG4gICAgICAgICAgICAgICAgICAgIGRvbmVQID0gYWJzKGx1bWFFbmRQKSA+PSBncmFkaWVudFNjYWxlZDtcXG4gICAgICAgICAgICAgICAgICAgIGlmICghZG9uZU4pIHBvc04ueCAtPSBvZmZOUC54ICogRlhBQV9RVUFMSVRZUDY7XFxuICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVOKSBwb3NOLnkgLT0gb2ZmTlAueSAqIEZYQUFfUVVBTElUWVA2O1xcbiAgICAgICAgICAgICAgICAgICAgZG9uZU5QID0gKCFkb25lTikgfHwgKCFkb25lUCk7XFxuICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVQKSBwb3NQLnggKz0gb2ZmTlAueCAqIEZYQUFfUVVBTElUWVA2O1xcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkb25lUCkgcG9zUC55ICs9IG9mZk5QLnkgKiBGWEFBX1FVQUxJVFlQNjtcXG4gICAgICAgICAgICAgICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgICAgICAgICAgICAgICAgICAgI2lmIChGWEFBX1FVQUxJVFlQUyA+IDcpXFxuICAgICAgICAgICAgICAgICAgICAgIGlmIChkb25lTlApIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVOKSBsdW1hRW5kTiA9IEZ4YWFMdW1hKEZ4YWFUZXhUb3AodGV4LCBwb3NOLnh5KSk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkb25lUCkgbHVtYUVuZFAgPSBGeGFhTHVtYShGeGFhVGV4VG9wKHRleCwgcG9zUC54eSkpO1xcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZG9uZU4pIGx1bWFFbmROID0gbHVtYUVuZE4gLSBsdW1hTk4gKiAwLjU7XFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkb25lUCkgbHVtYUVuZFAgPSBsdW1hRW5kUCAtIGx1bWFOTiAqIDAuNTtcXG4gICAgICAgICAgICAgICAgICAgICAgICBkb25lTiA9IGFicyhsdW1hRW5kTikgPj0gZ3JhZGllbnRTY2FsZWQ7XFxuICAgICAgICAgICAgICAgICAgICAgICAgZG9uZVAgPSBhYnMobHVtYUVuZFApID49IGdyYWRpZW50U2NhbGVkO1xcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZG9uZU4pIHBvc04ueCAtPSBvZmZOUC54ICogRlhBQV9RVUFMSVRZUDc7XFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkb25lTikgcG9zTi55IC09IG9mZk5QLnkgKiBGWEFBX1FVQUxJVFlQNztcXG4gICAgICAgICAgICAgICAgICAgICAgICBkb25lTlAgPSAoIWRvbmVOKSB8fCAoIWRvbmVQKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVQKSBwb3NQLnggKz0gb2ZmTlAueCAqIEZYQUFfUVVBTElUWVA3O1xcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZG9uZVApIHBvc1AueSArPSBvZmZOUC55ICogRlhBQV9RVUFMSVRZUDc7XFxuICAgICAgICAgICAgICAgICAgICAgICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuICAgICAgICAgICAgICAgICAgICAgICAgI2lmIChGWEFBX1FVQUxJVFlQUyA+IDgpXFxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9uZU5QKSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZG9uZU4pIGx1bWFFbmROID0gRnhhYUx1bWEoRnhhYVRleFRvcCh0ZXgsIHBvc04ueHkpKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkb25lUCkgbHVtYUVuZFAgPSBGeGFhTHVtYShGeGFhVGV4VG9wKHRleCwgcG9zUC54eSkpO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVOKSBsdW1hRW5kTiA9IGx1bWFFbmROIC0gbHVtYU5OICogMC41O1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVQKSBsdW1hRW5kUCA9IGx1bWFFbmRQIC0gbHVtYU5OICogMC41O1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb25lTiA9IGFicyhsdW1hRW5kTikgPj0gZ3JhZGllbnRTY2FsZWQ7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbmVQID0gYWJzKGx1bWFFbmRQKSA+PSBncmFkaWVudFNjYWxlZDtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkb25lTikgcG9zTi54IC09IG9mZk5QLnggKiBGWEFBX1FVQUxJVFlQODtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkb25lTikgcG9zTi55IC09IG9mZk5QLnkgKiBGWEFBX1FVQUxJVFlQODtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9uZU5QID0gKCFkb25lTikgfHwgKCFkb25lUCk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZG9uZVApIHBvc1AueCArPSBvZmZOUC54ICogRlhBQV9RVUFMSVRZUDg7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZG9uZVApIHBvc1AueSArPSBvZmZOUC55ICogRlhBQV9RVUFMSVRZUDg7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjaWYgKEZYQUFfUVVBTElUWVBTID4gOSlcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9uZU5QKSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVOKSBsdW1hRW5kTiA9IEZ4YWFMdW1hKEZ4YWFUZXhUb3AodGV4LCBwb3NOLnh5KSk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVQKSBsdW1hRW5kUCA9IEZ4YWFMdW1hKEZ4YWFUZXhUb3AodGV4LCBwb3NQLnh5KSk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVOKSBsdW1hRW5kTiA9IGx1bWFFbmROIC0gbHVtYU5OICogMC41O1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkb25lUCkgbHVtYUVuZFAgPSBsdW1hRW5kUCAtIGx1bWFOTiAqIDAuNTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbmVOID0gYWJzKGx1bWFFbmROKSA+PSBncmFkaWVudFNjYWxlZDtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbmVQID0gYWJzKGx1bWFFbmRQKSA+PSBncmFkaWVudFNjYWxlZDtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZG9uZU4pIHBvc04ueCAtPSBvZmZOUC54ICogRlhBQV9RVUFMSVRZUDk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVOKSBwb3NOLnkgLT0gb2ZmTlAueSAqIEZYQUFfUVVBTElUWVA5O1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9uZU5QID0gKCFkb25lTikgfHwgKCFkb25lUCk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVQKSBwb3NQLnggKz0gb2ZmTlAueCAqIEZYQUFfUVVBTElUWVA5O1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkb25lUCkgcG9zUC55ICs9IG9mZk5QLnkgKiBGWEFBX1FVQUxJVFlQOTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI2lmIChGWEFBX1FVQUxJVFlQUyA+IDEwKVxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9uZU5QKSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkb25lTikgbHVtYUVuZE4gPSBGeGFhTHVtYShGeGFhVGV4VG9wKHRleCwgcG9zTi54eSkpO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZG9uZVApIGx1bWFFbmRQID0gRnhhYUx1bWEoRnhhYVRleFRvcCh0ZXgsIHBvc1AueHkpKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVOKSBsdW1hRW5kTiA9IGx1bWFFbmROIC0gbHVtYU5OICogMC41O1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZG9uZVApIGx1bWFFbmRQID0gbHVtYUVuZFAgLSBsdW1hTk4gKiAwLjU7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9uZU4gPSBhYnMobHVtYUVuZE4pID49IGdyYWRpZW50U2NhbGVkO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbmVQID0gYWJzKGx1bWFFbmRQKSA+PSBncmFkaWVudFNjYWxlZDtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVOKSBwb3NOLnggLT0gb2ZmTlAueCAqIEZYQUFfUVVBTElUWVAxMDtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVOKSBwb3NOLnkgLT0gb2ZmTlAueSAqIEZYQUFfUVVBTElUWVAxMDtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb25lTlAgPSAoIWRvbmVOKSB8fCAoIWRvbmVQKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVQKSBwb3NQLnggKz0gb2ZmTlAueCAqIEZYQUFfUVVBTElUWVAxMDtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVQKSBwb3NQLnkgKz0gb2ZmTlAueSAqIEZYQUFfUVVBTElUWVAxMDtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjaWYgKEZYQUFfUVVBTElUWVBTID4gMTEpXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9uZU5QKSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZG9uZU4pIGx1bWFFbmROID0gRnhhYUx1bWEoRnhhYVRleFRvcCh0ZXgsIHBvc04ueHkpKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkb25lUCkgbHVtYUVuZFAgPSBGeGFhTHVtYShGeGFhVGV4VG9wKHRleCwgcG9zUC54eSkpO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVOKSBsdW1hRW5kTiA9IGx1bWFFbmROIC0gbHVtYU5OICogMC41O1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVQKSBsdW1hRW5kUCA9IGx1bWFFbmRQIC0gbHVtYU5OICogMC41O1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb25lTiA9IGFicyhsdW1hRW5kTikgPj0gZ3JhZGllbnRTY2FsZWQ7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbmVQID0gYWJzKGx1bWFFbmRQKSA+PSBncmFkaWVudFNjYWxlZDtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkb25lTikgcG9zTi54IC09IG9mZk5QLnggKiBGWEFBX1FVQUxJVFlQMTE7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZG9uZU4pIHBvc04ueSAtPSBvZmZOUC55ICogRlhBQV9RVUFMSVRZUDExO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb25lTlAgPSAoIWRvbmVOKSB8fCAoIWRvbmVQKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkb25lUCkgcG9zUC54ICs9IG9mZk5QLnggKiBGWEFBX1FVQUxJVFlQMTE7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZG9uZVApIHBvc1AueSArPSBvZmZOUC55ICogRlhBQV9RVUFMSVRZUDExO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI2lmIChGWEFBX1FVQUxJVFlQUyA+IDEyKVxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb25lTlApIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZG9uZU4pIGx1bWFFbmROID0gRnhhYUx1bWEoRnhhYVRleFRvcCh0ZXgsIHBvc04ueHkpKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZG9uZVApIGx1bWFFbmRQID0gRnhhYUx1bWEoRnhhYVRleFRvcCh0ZXgsIHBvc1AueHkpKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZG9uZU4pIGx1bWFFbmROID0gbHVtYUVuZE4gLSBsdW1hTk4gKiAwLjU7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVQKSBsdW1hRW5kUCA9IGx1bWFFbmRQIC0gbHVtYU5OICogMC41O1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9uZU4gPSBhYnMobHVtYUVuZE4pID49IGdyYWRpZW50U2NhbGVkO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9uZVAgPSBhYnMobHVtYUVuZFApID49IGdyYWRpZW50U2NhbGVkO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkb25lTikgcG9zTi54IC09IG9mZk5QLnggKiBGWEFBX1FVQUxJVFlQMTI7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVOKSBwb3NOLnkgLT0gb2ZmTlAueSAqIEZYQUFfUVVBTElUWVAxMjtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbmVOUCA9ICghZG9uZU4pIHx8ICghZG9uZVApO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkb25lUCkgcG9zUC54ICs9IG9mZk5QLnggKiBGWEFBX1FVQUxJVFlQMTI7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRvbmVQKSBwb3NQLnkgKz0gb2ZmTlAueSAqIEZYQUFfUVVBTElUWVAxMjtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI2VuZGlmXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICNlbmRpZlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjZW5kaWZcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgI2VuZGlmXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgICAgICAgICAgICAgICNlbmRpZlxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgICAgICAjZW5kaWZcXG4gICAgICAgICAgICAgICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAgICAgI2VuZGlmXFxuICAgICAgICAgICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgICNlbmRpZlxcbiAgICAgICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgICAgICAgICB9XFxuICAgICAgICAjZW5kaWZcXG4gICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgICAgIH1cXG4gICAgI2VuZGlmXFxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xcbiAgfVxcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuICBGeGFhRmxvYXQgZHN0TiA9IHBvc00ueCAtIHBvc04ueDtcXG4gIEZ4YWFGbG9hdCBkc3RQID0gcG9zUC54IC0gcG9zTS54O1xcbiAgaWYgKCFob3J6U3BhbikgZHN0TiA9IHBvc00ueSAtIHBvc04ueTtcXG4gIGlmICghaG9yelNwYW4pIGRzdFAgPSBwb3NQLnkgLSBwb3NNLnk7XFxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cXG4gIEZ4YWFCb29sIGdvb2RTcGFuTiA9IChsdW1hRW5kTiA8IDAuMCkgIT0gbHVtYU1MVFplcm87XFxuICBGeGFhRmxvYXQgc3Bhbkxlbmd0aCA9IChkc3RQICsgZHN0Tik7XFxuICBGeGFhQm9vbCBnb29kU3BhblAgPSAobHVtYUVuZFAgPCAwLjApICE9IGx1bWFNTFRaZXJvO1xcbiAgRnhhYUZsb2F0IHNwYW5MZW5ndGhSY3AgPSAxLjAgLyBzcGFuTGVuZ3RoO1xcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuICBGeGFhQm9vbCBkaXJlY3Rpb25OID0gZHN0TiA8IGRzdFA7XFxuICBGeGFhRmxvYXQgZHN0ID0gbWluKGRzdE4sIGRzdFApO1xcbiAgRnhhYUJvb2wgZ29vZFNwYW4gPSBkaXJlY3Rpb25OID8gZ29vZFNwYW5OIDogZ29vZFNwYW5QO1xcbiAgRnhhYUZsb2F0IHN1YnBpeEcgPSBzdWJwaXhGICogc3VicGl4RjtcXG4gIEZ4YWFGbG9hdCBwaXhlbE9mZnNldCA9IChkc3QgKiAoLXNwYW5MZW5ndGhSY3ApKSArIDAuNTtcXG4gIEZ4YWFGbG9hdCBzdWJwaXhIID0gc3VicGl4RyAqIGZ4YWFRdWFsaXR5U3VicGl4O1xcbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXFxuICBGeGFhRmxvYXQgcGl4ZWxPZmZzZXRHb29kID0gZ29vZFNwYW4gPyBwaXhlbE9mZnNldCA6IDAuMDtcXG4gIEZ4YWFGbG9hdCBwaXhlbE9mZnNldFN1YnBpeCA9IG1heChwaXhlbE9mZnNldEdvb2QsIHN1YnBpeEgpO1xcbiAgaWYgKCFob3J6U3BhbikgcG9zTS54ICs9IHBpeGVsT2Zmc2V0U3VicGl4ICogbGVuZ3RoU2lnbjtcXG4gIGlmIChob3J6U3BhbikgcG9zTS55ICs9IHBpeGVsT2Zmc2V0U3VicGl4ICogbGVuZ3RoU2lnbjtcXG4gICNpZiAoRlhBQV9ESVNDQVJEID09IDEpXFxuICAgIHJldHVybiBGeGFhVGV4VG9wKHRleCwgcG9zTSk7XFxuICAjZWxzZVxcbiAgcmV0dXJuIEZ4YWFGbG9hdDQoRnhhYVRleFRvcCh0ZXgsIHBvc00pLnh5eiwgbHVtYU0pO1xcbiAgI2VuZGlmXFxufVxcbi8qPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xcbiNlbmRpZlxcblxcblxcbnZvaWQgbWFpbigpe1xcbi8qIHNoYWRlcml0eTogQHttYWluUHJlcmVxdWlzaXRlc30gKi9cXG5cXG4gIHZlYzIgc2NyZWVuSW5mbyA9IHZlYzIodGV4dHVyZVNpemUodV9iYXNlQ29sb3JUZXh0dXJlLCAwKSk7XFxuICBydDAgPSBGeGFhUGl4ZWxTaGFkZXIoXFxuICAgICAgdl90ZXhjb29yZF8wLFxcbiAgICAgIHZlYzQoMC4wKSxcXG4gICAgICB1X2Jhc2VDb2xvclRleHR1cmUsXFxuICAgICAgdV9iYXNlQ29sb3JUZXh0dXJlLFxcbiAgICAgIHVfYmFzZUNvbG9yVGV4dHVyZSxcXG4gICAgICAxLjAgLyBzY3JlZW5JbmZvLFxcbiAgICAgIHZlYzQoMC4wKSxcXG4gICAgICB2ZWM0KDAuMCksXFxuICAgICAgdmVjNCgwLjApLFxcbiAgICAgIDAuNzUsXFxuICAgICAgMC4xNjYsXFxuICAgICAgMC4wODMzLFxcbiAgICAgIDAuMCxcXG4gICAgICAwLjAsXFxuICAgICAgMC4wLFxcbiAgICAgIHZlYzQoMC4wKVxcbiAgKTtcXG4gIHJ0MC5hID0gMS4wO1xcblxcblxcblxcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBb3RoRCxrQkFBYztBQUFXLHVCQUFtQjtBQUF4d2hELHlDQUFDLE1BQTJ0aEQsYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
