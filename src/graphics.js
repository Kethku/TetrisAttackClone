import * as twgl from "twgl.js";

import { EventManager1 } from "./eventManager";
import { spliceArray, spliceData } from "./utils";
import { setupTextures } from "./imageMapUtils";
import { Vector, Color } from "./math";

import vert from './shaders/vert.glsl';
import frag from './shaders/frag.glsl';

///////////////////////
// Initialize Canvas //
///////////////////////
export const canvas = document.createElement("canvas");
canvas.setAttribute("touch-action", "none");
document.body.appendChild(canvas);
const gl = canvas.getContext("webgl", {alpha: false});
let spriteProgram = twgl.createProgramInfo(gl, [vert, frag]);
gl.useProgram(spriteProgram.program);
let maxCount = 800;
let spriteArrays = {
  a_coord: {numComponents: 2, data: new Float32Array(maxCount * 2), drawType: gl.DYNAMIC_DRAW},
  a_position: {numComponents: 3, data: new Float32Array(maxCount * 2), drawType: gl.DYNAMIC_DRAW},
  a_texcoord: {numComponents: 2, data: new Float32Array(maxCount * 2), drawType: gl.DYNAMIC_DRAW},
  a_rotation: {numComponents: 1, data: new Float32Array(maxCount * 2), drawType: gl.DYNAMIC_DRAW},
  a_dimensions: {numComponents: 2, data: new Float32Array(maxCount * 2), drawType: gl.DYNAMIC_DRAW},
  a_center: {numComponents: 2, data: new Float32Array(maxCount * 2), drawType: gl.DYNAMIC_DRAW},
  a_scale: {numComponents: 1, data: new Float32Array(maxCount * 2), drawType: gl.DYNAMIC_DRAW},
  a_color: {numComponents: 4, data: new Float32Array(maxCount), drawType: gl.DYNAMIC_DRAW},
  indices: {numComponents: 3, data: new Uint16Array(maxCount * 2), drawType: gl.DYNAMIC_DRAW}
};
let bufferInfo = twgl.createBufferInfoFromArrays(gl, spriteArrays);
let textures;

export async function loadTextures(texturePaths) {
  textures = await setupTextures(gl, texturePaths);
  //document.body.appendChild(textures.canvas);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

////////////////////
// Setup Resizing //
////////////////////
export let screenSize = Vector.zero;
export const Resized = new EventManager1();

function resize() {
  screenSize = new Vector(window.innerWidth, window.innerHeight);

  canvas.width = screenSize.x;
  canvas.height = screenSize.y;

  Resized.Publish(screenSize);
}

window.addEventListener("resize", resize);
resize();

///////////////
// Draw APIs //
///////////////
let imagesToDraw = [];
export function image(imageUrl, position, dimensions, rotation = 0, color = Color.white, center = Vector.half) {
  imagesToDraw.push({ imageUrl, position, dimensions, rotation, color, center });
}

////////////////
// Draw Calls //
////////////////
export function drawToScreen() {
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.viewport(0, 0, screenSize.x, screenSize.y);

  twgl.setUniforms(spriteProgram, {
    u_camera_dimensions: [0, 0, screenSize.x, screenSize.y],
    u_texmap: textures.texture,
    u_map_dimensions: textures.size
  });

  for (let id in spriteArrays) {
    let expectedLength = 0;
    if (id == "indices") {
      expectedLength = imagesToDraw.length * spriteArrays[id].numComponents * 2;
    } else {
      expectedLength = imagesToDraw.length * spriteArrays[id].numComponents * 4;
    }

    if (spriteArrays[id].data.length < expectedLength) {
      console.log(expectedLength);
      if (id == "indices") {
        spriteArrays[id].data = new Uint16Array(expectedLength);
      } else {
        spriteArrays[id].data = new Float32Array(expectedLength);
      }
    }
  }

  let index = 0;
  for (let imageToDraw of imagesToDraw) {
    spliceData(spriteArrays.a_coord, index, [ 0, 1, 1, 1, 0, 0, 1, 0 ]);
    spliceData(spriteArrays.a_position, index, [
      imageToDraw.position.x,
      imageToDraw.position.y,
      imageToDraw.position.z
    ]);
    spliceData(spriteArrays.a_texcoord, index, textures.texCoords[imageToDraw.imageUrl]);
    spliceData(spriteArrays.a_rotation, index, [imageToDraw.rotation || 0]);
    spliceData(spriteArrays.a_dimensions, index, [
      imageToDraw.dimensions.x,
      imageToDraw.dimensions.y
    ]);
    spliceData(spriteArrays.a_center, index, [
      imageToDraw.center.x,
      imageToDraw.center.y
    ]);
    spliceData(spriteArrays.a_scale, index, [1]);
    spliceData(spriteArrays.a_color, index, [imageToDraw.color.r, imageToDraw.color.g, imageToDraw.color.b, imageToDraw.color.a]);
    let offset = index * 4;
    spliceArray(spriteArrays.indices.data, index * 6,
                [offset + 0, offset + 1, offset + 2, offset + 2, offset + 1, offset + 3]);
    index++;
  }

  for (let id in spriteArrays) {
    if (id != "indices") {
      twgl.setAttribInfoBufferFromArray(gl, bufferInfo.attribs[id], spriteArrays[id]);
    } else {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indices);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, spriteArrays[id].data, spriteArrays[id].drawType);
    }
  }

  twgl.setBuffersAndAttributes(gl, spriteProgram, bufferInfo);

  twgl.drawBufferInfo(gl, bufferInfo, gl.TRIANGLES, imagesToDraw.length * 6);

  imagesToDraw = [];
}
