import { Function, Tuple } from "ts-toolbelt";

export type Common<A, B> = {
  [P in keyof A & keyof B]: A[P] | B[P]
};

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

export function unreachable(obj: never) { 
  throw new Error(`${obj} should not exist`) 
}

export function invertPromise<TResult>() {
  let resolve: (result: TResult) => void;
  let reject: (error: any) => void;
  return {
    promise: new Promise((innerResolve, innerReject) => {
      resolve = innerResolve;
      reject = innerReject;
    }), 
    resolve, 
    reject
  };
}

type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function.Function ? K : never }[keyof T];
type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;

export type Proxied<T> = { [K in keyof FunctionProperties<T>]: Function.Function<Tuple.Tail<Function.Parameters<T[K]>>, Promise<Function.Return<T[K]>>> };

interface Socket {
  emit(event: string, ...args: any[]): void;
  on(event: string, callback: (...args: any[]) => void): void;
}

export function createProxy<TRemoteAPI>(socket: Socket, localAPI: any) {
  let currentId = 0;
  let waitingPromises = new Map<number, [(result: any) => void, (error: any) => void]>()

  const proxy = new Proxy({}, {
    get(_, name: string) {
      console.log("Getting:", name);
      return (...args: any[]) => {
        socket.emit("call", currentId, name, args);
        const { promise, resolve, reject } = invertPromise<any>();
        waitingPromises.set(currentId, [resolve, reject])
        currentId++;
        return promise;
      }
    }
  }) as any as Proxied<TRemoteAPI>;

  socket.on("result", (id: number, error: boolean, result: any) => {
    let [resolve, reject] = waitingPromises.get(id);
    if (error) {
      reject(result);
    } else {
      resolve(result);
    }
    waitingPromises.delete(id);
  })

  socket.on("call", (id: number, name: string, args: any[]) => {
    console.log("Calling:", name)
    try {
      let result = localAPI[name].apply(null, [proxy, ...args]);
      socket.emit("result", id, false, result);
    } catch (error) {
      console.log("Error:", error)
      socket.emit("result", id, true, error);
    }
  })

  return proxy;
}
