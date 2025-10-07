
export class AsyncIteratorConsumer<T> {

  onEnd = () => { };
  onError = (err: Error) => { };

  constructor(iterator: AsyncIterator<T>, callback: (value: T) => Promise<any>) {
    this.#continue = true;
    this.#iterator = iterator;
    this.#callback = callback;
    queueMicrotask(this.#loop);
  }

  stop() {
    this.#continue = false;
    this.#cleanup();
  }

  #continue: boolean;
  #iterator?: AsyncIterator<T>;
  #callback?: (value: T) => Promise<any>;

  #cleanup() {
    this.#iterator = undefined;
    this.#callback = undefined;
  }

  #loop = () => {
    if (this.#continue) {
      this.#iterator!.next()
        .then((result) => {
          if (result.done) {
            this.stop();
            this.onEnd();
          } else {
            this.#callback!(result.value)
              .finally(this.#loop);
          }
        })
        .catch((err) => {
          this.stop();
          this.onError(err);
        });
    }
  };

}
