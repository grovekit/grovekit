
import fastq from 'fastq';

export type Task<R> = () => (R | Promise<R>);

export class AsyncTaskQueue {

  readonly #queue: fastq.queueAsPromised<Task<any>>;

  constructor() {
    this.#queue = fastq.promise(null, task => task(), 1);
  }

  get length(): number {
    return this.#queue.length();
  }

  push<R>(task: () => (R | Promise<R>)): Promise<R> {
    return this.#queue.push(task);
  }

}
