import * as twgl from "twgl.js";

import { Setup, Draw } from "../events";
import { EventManager } from "../../eventManager";
import { spliceArray, spliceData } from "../utils";
import { setupTextures, TextureInfo } from "./imageMapUtils";
import { Vector } from "../math";
import { CanvasMounted } from "../index";

import { imageURLs } from "./images";

import vertex from './shaders/vert.glsl';
import fragment from './shaders/frag.glsl';

export let imagesToDraw = [];

let gl: WebGLRenderingContext = null;
let spriteProgram: twgl.ProgramInfo = null;
let maxCount = 800;
let spriteArrays = null;
let bufferInfo: twgl.BufferInfo = null;
let textures: TextureInfo;
let canvas: HTMLCanvasElement = null;

///////////////////////
// Initialize Canvas //
///////////////////////
Setup.Subscribe(async () => {
  CanvasMounted.Subscribe(async (newCanvas) => {
    canvas = newCanvas;
    resize();
    console.log(newCanvas);
    gl = newCanvas.getContext("webgl", {alpha: false});
    spriteProgram = twgl.createProgramInfo(gl, [vertex, fragment]);
    gl.useProgram(spriteProgram.program);
    spriteArrays = {
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
    bufferInfo = twgl.createBufferInfoFromArrays(gl, spriteArrays);
    textures = await setupTextures(gl, imageURLs);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  });
});

////////////////////
// Setup Resizing //
////////////////////
export const Resized = new EventManager<[Vector]>();
export let screenSize = Vector.zero;

function resize() {
  screenSize = new Vector(window.innerWidth, window.innerHeight);

  if (canvas != null) {
    canvas.width = screenSize.width;
    canvas.height = screenSize.height;
  }

  Resized.Publish(screenSize);
}

window.addEventListener("resize", resize);
resize();

////////////////
// Draw Calls //
////////////////
Draw.Subscribe(() => {
  if (gl && textures) {
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
        if (id == "indices") {
          spriteArrays[id].data = new Uint16Array(expectedLength);
        } else {
          spriteArrays[id].data = new Float32Array(expectedLength);
        }
      }
    }

    imagesToDraw.sort((a, b) => a.position.z - b.position.z);
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
      spliceData(spriteArrays.a_color, index, [imageToDraw.tint.r, imageToDraw.tint.g, imageToDraw.tint.b, imageToDraw.tint.a]);
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
  }

  imagesToDraw = [];
})
