const PENDING = "PENDING";
const RESOLVED = "RESOLVED";
const REJECTED = "REJECTED";

class Promise {
  constructor(fun) {
    this.status = PENDING;
    this.value = undefined;
    this.callbacks = [];
    let resolve = (value) => {
      if (this.status === PENDING) {
        this.status = RESOLVED;
        this.value = value;
        this.callbacks.forEach((callback) => callback.onResolve());
      }
    };
    let reject = (value) => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.value = value;
        this.callbacks.forEach((callback) => callback.onReject());
      }
    };
    try {
      fun(resolve, reject);
    } catch (e) {
      console.log("错误!", e);
      reject(e);
    }
  }
  then(onResolve, onReject) {
    onResolve = typeof onResolve === "function" ? onResolve : (value) => value;
    onReject =
      typeof onReject === "function"
        ? onReject
        : (value) => {
            throw value;
          };
    return new Promise((resolve, reject) => {
      const handle = (callback) => {
        setTimeout(() => {
          try {
            const result = callback(this.value);
            if (result instanceof Promise) {
              result.then(
                (value) => {
                  resolve(value);
                },
                (value) => {
                  reject(value);
                }
              );
            } else {
              resolve(result);
            }
          } catch (e) {
            reject(e);
          }
        });
      };
      if (this.status === PENDING) {
        this.callbacks.push({
          onResolve() {
            handle(onResolve);
          },
          onReject() {
            handle(onReject);
          },
        });
      } else if (this.status === RESOLVED) {
        handle(onResolve);
      } else {
        handle(onReject);
      }
    });
  }
  catch(onReject) {
    return this.then(undefined, onReject);
  }
}
Promise.resolve = (value) => {
  return new Promise((resolve, reject) => {
    if (value instanceof Promise) {
      value.then(
        (value) => {
          resolve(value);
        },
        (value) => {
          reject(value);
        }
      );
    } else {
      resolve(value);
    }
  });
};
Promise.reject = (value) => {
  return new Promise((resolve, reject) => {
    reject(value);
  });
};
Promise.all = (promise_arr) => {
  return new Promise((resolve, reject) => {
    let values = [];
    let count = 0;
    promise_arr.forEach((item, index) => {
      Promise.resolve(item).then(
        (value) => {
          values[index] = value;
          count++;
          if (count === promise_arr.length) {
            resolve(values);
          }
        },
        (value) => {
          reject(value);
        }
      );
    });
  });
};
Promise.race = (promise_arr) => {
  return new Promise((resolve, reject) => {
    promise_arr.forEach((item, index) => {
      Promise.resolve(item).then(
        (value) => {
          resolve(value);
        },
        (value) => {
          reject(value);
        }
      );
    });
  });
};