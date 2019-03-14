attribute vec2 a_coord;
attribute vec3 a_position;
attribute vec2 a_texcoord;
attribute float a_rotation;
attribute vec2 a_dimensions;
attribute vec2 a_center;
attribute float a_scale;
attribute vec4 a_color;

varying highp vec2 v_texcoord;
varying highp vec4 v_color;

uniform vec4 u_camera_dimensions;

void main() {
  vec2 relativePosition = (a_coord * a_dimensions - a_dimensions * a_center) * a_scale;
  vec2 rotatedPosition = vec2(cos(a_rotation) * relativePosition.x - sin(a_rotation) * relativePosition.y,
                              sin(a_rotation) * relativePosition.x + cos(a_rotation) * relativePosition.y);
  vec3 worldCoords = vec3(rotatedPosition + a_position.xy, 0);
  gl_Position = vec4((worldCoords.xy - u_camera_dimensions.xy - u_camera_dimensions.zw / 2.0) / (u_camera_dimensions.zw / 2.0), worldCoords.z, 1);
  v_texcoord = a_texcoord;
  v_color = a_color;
}
