declare namespace TWGL {
  function createProgramInfo(gl: WebGLRenderingContext, shaderSources: string[], opt_attribs?: ProgramOptions | string[], opt_locations?: number[], opt_errorCallback?: ErrorCallback): ProgramInfo;
  function createBufferInfoFromArrays(gl: WebGLRenderingContext, arrays: Arrays): BufferInfo;
  function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, multiplier?: number): boolean;
  function setBuffersAndAttributes(gl: WebGLRenderingContext, setters: ProgramInfo | { [id: string]: (data: any) => void }, buffers: BufferInfo | VertexArrayInfo): void;
  function setUniforms(setters: ProgramInfo | { [id: string]: (data: any) => void }, values: { [id: string]: any }): void;
  function drawBufferInfo(gl: WebGLRenderingContext, bufferInfo: BufferInfo | VertexArrayInfo, type: number, count?: number, offset?: number): void;
  function createTexture(gl: WebGLRenderingContext, options: TextureOptions, callback?: TextureReadyCallback): WebGLTexture;
  function createTextures(gl: WebGLRenderingContext, options: { [id: string]: TextureOptions }, callback?: TexturesReadyCallback): { [id: string]: WebGLTexture };
  function createFrameBufferInfo(gl: WebGLRenderingContext, attachments?: AttachmentOptions[], width?: number, height?: number): FramebufferInfo;
  function setAttribInfoBufferFromArray(gl: WebGLRenderingContext, attribInfo: AttribInfo, array: ArraySpec, offset?: number);

  interface ProgramOptions {
    errorCallback: (err: any) => void;
    attribLocations: { [id: string]: number };
    transformFeedbackVaryings: BufferInfo | { [id: string]: AttribInfo } | string[];
    transformFeedbackMode: number;
  }

  type ErrorCallback = (msg: string, lineOffset?: number)  => void;

  interface ProgramInfo {
    program: WebGLProgram;
    uniformSetters: { [id: string]: (data: any) => void };
    attribSetters: { [id: string]: (data: any) => void };
    transformFeedbackInfo: { [id: string]: TransformFeedbackInfo };
  }

  interface BufferInfo {
    numElements: number;
    elementType: number;
    indices: WebGLBuffer;
    attribs: { [id: string]: AttribInfo };
  }

  interface AttribInfo {
    numComponents?: number;
    size?: number;
    "type"?: number;
    normalize?: boolean;
    offset?: number;
    stride?: number;
    buffer: WebGLBuffer;
    drawType?: number;
  }

  interface TransformFeedbackInfo {
    index: number;
    "type": number;
    size: number;
  }

  type Arrays = { [id: string] : ArraySpec };

  type ArraySpec = number | number[] | ArrayBuffer | FullArraySpec;

  interface FullArraySpec {
    data: number | number[] | Float32Array | Uint16Array | ArrayBuffer;
    numComponents?: number;
    "type"?: any;
    size?: number;
    normalize?: boolean;
    stride?: number;
    offset?: number;
    attrib?: string;
    name?: string;
    attribName?: string;
  }

  interface VertexArrayInfo {
    numElements: number;
    elementType?: number;
    vertexArrayObject?: any;
  }

  interface TextureOptions {
    target?: number;
    width?: number;
    height?: number;
    depth?: number;
    min?: number;
    mag?: number;
    minMag?: number;
    internalFormat?: number;
    format?: number;
    type?: number;
    wrap?: number;
    wrapS?: number;
    wrapT?: number;
    wrapR?: number;
    minLod?: number;
    maxLod?: number;
    baseLevel?: number;
    maxLevel?: number;
    unpackAlighment?: number;
    premultiplyAlpha?: number;
    flipY?: number;
    colorspaceConversion?: number;
    color?: number[] | ArrayBuffer;
    auto?: boolean;
    cubeFaceOrder?: number[];
    src: TextureSource | TextureFunc
    crossOrigin?: string;
  }

  type TextureSource = number[] | ArrayBuffer | HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | string | string[];

  type TextureFunc = (gl: WebGLRenderingContext, options: TextureOptions) => TextureSource;

  type TextureReadyCallback = (err: any, texture: WebGLTexture, source: TextureSource) => void;

  type TexturesReadyCallback = (err: any, textures: { [id: string]: WebGLTexture }, sources: { [id: string]: TextureSource } ) => void;

  interface AttachmentOptions {
    attach?: number;
    format?: number;
    type?: number;
    target?: number;
    level?: number;
    attachment?: WebGLObject;
  }

  interface FramebufferInfo {
    framebuffer: WebGLFramebuffer;
    attachments: WebGLObject[];
  }
}

declare module "twgl.js" {
  export = TWGL;
}
