# Promise
## 特点
- Promise拥有三种状态(pending, fulfilled, rejected),并且转换后不可逆转
- Promise的状态只能从pending变为fulfilled或者rejected
- Promise的每一种方法操作后,都返回一个Promise
## 实现
new Promise时,会直接开始执行传入的回调函数,并且初始状态为pending,如果调用了resolve就会状态就会变为fulfilled,调用reject状态变为rejected,如果出现错误,也会直接调用reject,最后,将值存起来,用作后续操作.

```
class Promise {
  constructor(fun) {
    this.value = undefined;
    this.status = PENDING;
    const resolve = (value) => {
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.value = value;
      }
    };
    const reject = (value) => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.value = value;
      }
    };
    try {
      fun(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }
 }
```
调用then方式时,会看当前状态是什么,然后进行一系列操作,最后,返回一个promise,之后便可以进行链式操作,在下个操作中拿到上个操作后的值

```
then(onResolved, onRejected) {
  return new Promise((resolve, reject) => {
    if (this.status === PENDING) {

    } else if (this.status === FULFILLED) {

    } else {

    }
  });
}
```
首先,如果在new promise里面调用的resolve或者reject不是异步执行的,那么,调用then时,该promise的状态会是fulfilled或者rejected,不会是pending,假设有以下这种情况

```
new Promise((resolve, reject) => {
  resolve(1);
})
  .then((value) => {
    return value;
  })
  .then((value) => {
    console.log(value);
  });
  
  // 控制台打印结果为1
```
为了实现上面这种效果,只需要在new Promise的时候,将第一个then中return的1直接resolve,便可以在第二个then中拿到该值
```
then(onResolved, onRejected) {
  return new Promise((resolve, reject) => {
    if (this.status === PENDING) {

    } else if (this.status === FULFILLED) {
      const result = onResolved(this.value);
      resolve(result);
    } else {

    }
  });
}
```
但是,如果return的值为Promise类型,如
```
new Promise((resolve, reject) => {
  resolve(1);
})
  .then((value) => {
    // return 1;
    return new Promise((resolve, reject) => {
      resolve(1);
    });
  })
  .then((value) => {
    console.log(value);
  });
  
  //控制台打印结果为1
```
为了实现上面这个,需要增加判断值为promise时,应当将该Promise,resolve或者reject后的值通过在return的Promise里将值也通过对应方法调用,这样就可以在之后的then中拿到
```
  then(onResolved, onRejected) {
    return new Promise((resolve, reject) => {
      if (this.status === PENDING) {
      
      } else if (this.status === FULFILLED) {
        const result = onResolved(this.value);
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
      } else {
      
      }
    });
  }
```
同理,当执行reject的时候,也是一样的
```
then(onResolved, onRejected) {
  return new Promise((resolve, reject) => {
    if (this.status === PENDING) {
      this.callbacks.push({
        onResolved() {
          const result = onResolved(this.value);
          resolve(result);
        },
        onRejected() {
          const result = onRejected(this.value);
          resolve(result);
        },
      });
    } else if (this.status === FULFILLED) {
      const result = onResolved(this.value);
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
    } else {
      const result = onRejected(this.value);
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
    }
  });
}
```
可以发现,处理几乎是一样的,那么定义一个函数,反复调用即可
```
then(onResolved, onRejected) {
  return new Promise((resolve, reject) => {
    const handle = (fun) => {
      const result = fun(this.value);
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
    };
    if (this.status === PENDING) {

    } else if (this.status === FULFILLED) {
      handle(onResolved)
    } else {
      handle(onRejected)
    }
  });
}
```
因为promise是异步执行的,所以需要加上setTimeout变为宏任务执行(源码实际为微任务,但目的都是为了异步执行,宏任务和微任务的区别就是宏任务先执行先入栈,由于栈是先入后出的特点,所以,当回调执行的时候,先出栈的是微任务的回调),这样就做的话,就会导致return的Promise在下次调用then时,状态为pending,所以,在下次then的时候,会进入this.status === PENDING条件中,这时,由于进这个条件时,new Promise里的代码异步执行,,所以,需要个容器将then里面二个函数暂存起来,之后,等new Promise里面异步代码执行时,调用resolve或者reject时,将存起来的函数依次执行,当执行时,状态都会变为fulfilled或者rejected,所以,存起来的函数也需要和上面相同的处理方法.
```
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

class Promise {
  constructor(fun) {
    this.value = undefined;
    this.status = PENDING;
    this.callbacks = [];
    const resolve = (value) => {
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.value = value;
        this.callbacks.forEach((callback) => callback.onResolved());
      }
    };
    const reject = (value) => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.value = value;
        this.callbacks.forEach((callback) => callback.onRejected());
      }
    };
    try {
      fun(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }
  then(onResolved, onRejected) {
    return new Promise((resolve, reject) => {
      const handle = (fun) => {
        setTimeout(() => {
          const result = fun(this.value);
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
        });
      };
      if (this.status === PENDING) {
        this.callbacks.push({
          onResolved() {
            handle(onResolved);
          },
          onRejected() {
            handle(onRejected);
          },
        });
      } else if (this.status === FULFILLED) {
        handle(onResolved);
      } else {
        handle(onRejected);
      }
    });
  }
}
```
然后,当在then函数运行错误时,也需要reject错误出去
```
  then(onResolved, onRejected) {
    return new Promise((resolve, reject) => {
      const handle = (fun) => {
        setTimeout(() => {
          try {
            const result = fun(this.value);
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
          onResolved() {
            handle(onResolved);
          },
          onRejected() {
            handle(onRejected);
          },
        });
      } else if (this.status === FULFILLED) {
        handle(onResolved);
      } else {
        handle(onRejected);
      }
    });
  }
```
接下来是catch,当执行错误或者reject时,会进入catch中,前提是在catch前面没有接收这个值,因为promise的then和catch都期望传入函数,如果传入的不是函数,便会直接穿透,进入下一步,所以,在then中需要判断传入的是否是函数,在catch只需要将返回出来的
```
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
```
接下来是Promise.resolve与Promise.reject的实现,其实也就是返回创建Promise就好,但是根据官方调用结果,发现resolve有处理值为Promise的情况,而reject没有
```
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
```
接下来是Promise.all的实现,all的特性是有一个失败,则返回失败,或者全部成功才返回
```
Promise.all = (promise_arr) => {
  return new Promise((resolve, reject) => {
    let values = [];
    let count = 0;
    promise_arr.forEach((item, index) => {
      item.then(
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
```
有时候,传入all里面的有可能不是Promise,所以需要将所有都转化为promise再进行处理
```
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
```
最后是Promise.race的实现,这个意思为赛跑,特点是如果谁先处理完成了就返回谁,
```
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
```
