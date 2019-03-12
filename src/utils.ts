export function spliceArray(dest: Uint16Array | Float32Array, offset: number, data: number[]) {
  for (let i = 0; i < data.length; i++) {
    dest[offset + i] = data[i];
  }
}

export function spliceData(array: {numComponents: number, data: Float32Array | Uint16Array}, entityIndex: number, data: number[]) {
  let expectedCount = array.numComponents * 4;
  for (let i = 0; i < expectedCount; i += data.length) {
    spliceArray(array.data, entityIndex * expectedCount + i, data);
  }
}