
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AsyncLock } from './lock.js';

describe('Lock', () => {

  it('should instantiate', () => {
    const lock = new AsyncLock();
    assert(lock instanceof AsyncLock);
  });
  
  it('should be acquired', async () => { 
    const lock = new AsyncLock();
    const release = await lock.acquire();
  });
  
  it('should be released', async () => { 
    const lock = new AsyncLock();
    const release = await lock.acquire();
    release();
  });
  
  it('should not be acquired if unreleased', async (t) => { 
    const lock = new AsyncLock();
    let count = 0;
    await new Promise((resolve) => { 
      lock.acquire()
        .then((release) => {
          count += 1;
          setTimeout(release, 1000);
          return lock.acquire();
        })
        .then((release) => {
          count += 1;
          setTimeout(release, 1000);
          release();
        })
        .then(resolve);
    });
  });
  
});


