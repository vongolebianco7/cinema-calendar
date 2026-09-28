(function(root){
  'use strict';
  const vertex=`#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPosition;
  layout(location=1) in float aPart;
  uniform mat4 uProjection; uniform mat4 uView; uniform mat4 uModel;
  uniform float uTime; uniform float uPhase; uniform float uTail; uniform float uSway;
  out float vDepth; out float vShade; out float vPart;
  void main(){vec3 p=aPosition; if(aPart>0.5&&aPart<1.5){p.z+=sin(uTime*4.8+uPhase+p.x*3.0)*uTail*max(0.0,-p.x);} if(uSway>0.0){p.x+=sin(uTime*.75+uPhase+p.y)*uSway*p.y*.14;} vec4 world=uModel*vec4(p,1.0); vec4 eye=uView*world; vDepth=max(0.0,-eye.z); vShade=clamp(.56+p.y*.16+p.z*.08,0.28,1.0); vPart=aPart; gl_Position=uProjection*eye;}`;
  const fragment=`#version 300 es
  precision highp float;
  uniform vec3 uColor; uniform vec3 uFogColor; uniform float uAlpha; uniform float uTime; uniform float uLight;
  in float vDepth; in float vShade; in float vPart; out vec4 outColor;
  void main(){float caustic=.94+.06*sin(uTime*1.35+vDepth*.31); vec3 lit=uColor*(vShade+.28*uLight)*caustic; float fog=1.0-exp(-vDepth*.055); vec3 color=mix(lit,uFogColor,clamp(fog,0.0,.9)); outColor=vec4(color,uAlpha);}`;
  function compile(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||'shader compile failed');return s;}
  function createProgram(gl){const p=gl.createProgram();gl.attachShader(p,compile(gl,gl.VERTEX_SHADER,vertex));gl.attachShader(p,compile(gl,gl.FRAGMENT_SHADER,fragment));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p)||'program link failed');return p;}
  root.CinemapOceanShaders={vertex,fragment,createProgram};
})(typeof window!=='undefined'?window:globalThis);
