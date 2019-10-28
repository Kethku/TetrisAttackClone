precision highp float;
uniform float u_map_dimensions;
uniform sampler2D u_texmap;

varying vec2 v_texcoord;
varying vec4 v_color;

void main() {
  vec4 sampledColor = texture2D(
    u_texmap,
    vec2(v_texcoord.s / u_map_dimensions, v_texcoord.t / u_map_dimensions)
  );
  gl_FragColor = vec4(sampledColor.rgb * v_color.rgb, sampledColor.a * v_color.a);
}
