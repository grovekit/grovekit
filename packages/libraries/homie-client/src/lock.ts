
import { Deferred } from "./deferred.js";

export type Release = () => void;

export class AsyncLock { 
  
  #curr?: Deferred<void>;
  
  async acquire(): Promise<Release> { 
    await this.#curr?.promise;
    const deferred = new Deferred<void>();
    this.#curr = deferred;
    return deferred.resolve;
  }
  
}