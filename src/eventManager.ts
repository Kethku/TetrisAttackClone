type Tuple = any[];

export class EventManager<TArgs extends Tuple = [], TResult = void> {
  currentId = 0;
  subscriptions: Map<number, (...args: TArgs) => TResult> = new Map();

  Subscribe(callback: (...args: TArgs) => TResult) {
    let id = this.currentId;
    this.subscriptions.set(id, callback);
    this.currentId++;
    return id;
  }

  Unsubscribe(id: number) {
    return this.subscriptions.delete(id);
  }

  Publish(...args: TArgs) {
    let results: TResult[] = [];
    for (let id of this.subscriptions.keys()) {
      results.push(this.subscriptions.get(id).apply(null, args));
    }
    return results;
  }
}
