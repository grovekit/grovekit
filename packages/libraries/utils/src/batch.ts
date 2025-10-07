
import { LinkedList } from "./linkedlist.js";

export class BatchWorker<T> {

  #max: number;
  #flush: (batch: T[]) => Promise<void>;
  #timeout: NodeJS.Timeout | null;
  #pending: LinkedList<T[]>;
  #flushing: boolean;

  constructor(flush: (batch: T[]) => Promise<void>, max: number = 128) {
    this.#max = max;
    this.#flush = flush;
    this.#pending = new LinkedList();
    this.#flushing = false;
    this.#timeout = null;
  }

  async addItem(item: T) {
    if (this.#pending.length === 0) {
      this.#pending.push([]);
    }
    if (this.#pending.last!.push(item) >= this.#max) {
      this.#pending.push([])
    }
    this.#scheduleFlushing();
  }

  #scheduleFlushing() {
    if (!this.#timeout) {
      this.#timeout = setTimeout(() => {
        this.#timeout = null;
        this.#startFlushing();
      }, 1000);
    }
  }


  #startFlushing() {
    if (this.#flushing) {
      return;
    }
    this.#flushing = true;
    const next = () => {
      const batch = this.#pending.shift();
      if (batch) {
        this.#flush(batch).finally(next);
      } else {
        this.#flushing = false;
      }
    };
    next();
  }

}
