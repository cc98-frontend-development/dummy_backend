var assert = require("assert");
var oo = require("./oo");
var debug = require("./debug");

exports.Resolve = Resolve;
exports.Reject = Reject;
if(debug.DEBUG){
    exports.unit_test = test;
};

function Promise(a){
};

Promise.prototype.isResolved = function(){
    assert.ok(this instanceof Promise);
    return(this.constructor === Resolve);
};

Promise.prototype.isRejected = function(){
    assert.ok(this instanceof Promise);
    return(this.constructor === Reject);
};

//proceed :: Promise a -> (a -> b) -> Promise b
//proceed needs a function that returns other types than Promise
Promise.prototype.proceed = function(f){
    assert.ok(f instanceof Function);
    if(this.isResolved()){
        try{
            var x = f(this.value);
            return(new Resolve(x));
        }catch(e){
            return(new Reject(e));
        }
    }else{
        return(new Reject(this.value));
    }
};

//bind :: Promise a -> (a -> Promise b) -> Promise b
//bind needs a function that returns a Promise, either rejected or resolved.
Promise.prototype.bind = function(f){
    assert.ok(f instanceof Function);
    if(this.isResolved()){
        try{
            var x = f(this.value);
            assert.ok(x instanceof Promise);
            assert.ok(x !== this);
            return(x);
        }catch(e){
            return(new Reject(e));
        }
    }else{
        return(new Reject(this.value));
    }
};

//thenProceed :: Promise a -> (a -> (b -> c)) -> (a -> (b -> c)) -> Promise c
//thenProceed needs two functions that returns other types than Promise, corresbonding to previous resolved or rejected.
Promise.prototype.thenProceed = function(succ, err){
    if(this.isResolved()){
        if(succ == null){
            return(new Resolve(this.value));
        }else{
            assert.ok(succ instanceof Function);
            try{
                var x = succ(this.value);
                if(x instanceof Promise){
                    throw new TypeError("succ returns a Promise. Other type is expected. Use thenBind?");
                }
                return(new Resolve(x));
            }catch(e){
                return(new Reject(e));
            }
        }
    }else{
        if(err == null){
            return(new Reject(this.value));
        }else{
            assert.ok(err instanceof Function);
            try{
                var x = err(this.value);
                if(x instanceof Promise){
                    throw new TypeError("succ returns a Promise. Other type is expected. Use thenBind?");
                }
                return(new Reject(x));
            }catch(e){
                return(new Reject(e));
            }
        }
    }
};

//thenBind :: Promise a -> (a -> (b -> Promise c)) -> (a -> (b -> Promise c)) -> Promise c
//thenProceed needs two functions that returns Promise, each corresbonding to previous resolved or rejected.
Promise.prototype.thenBind = function(succ, err){
    if(this.isResolved()){
        if(succ == null){
            return(new Resolve(this.value));
        }else{
            assert.ok(succ instanceof Function);
            try{
                var x = succ(this.value);
                if(!(x instanceof Promise)){
                    throw new TypeError("succ doesn't return a Promise. Promise is expected. Use thenProceed?");
                }
                assert.ok(x !== this);
                return(x);
            }catch(e){
                return(new Reject(e));
            }
        }
    }else{
        if(err == null){
            return(new Reject(this.value));
        }else{
            assert.ok(err instanceof Function);
            try{
                var x = err(this.value);
                if(!(x instanceof Promise)){
                    throw new TypeError("succ doesn't return a Promise. Promise is expected. Use thenProceed?");
                }
                assert.ok(x !== this);
                return(x);
            }catch(e){
                return(new Reject(e));
            }
        }
    }
};

function Resolve(a){
    this.value = a;
    return(this);
};
oo.extend(Resolve, Promise);

function Reject(a){
    this.value = a;
    return(this);
};
oo.extend(Reject, Promise);

function test(){
    var inc = function(a){
        console.log("inc: " + a + "->" + (a+1));
        return a+1;
    };

    var incTo = function(limit){
        return function(a){
            console.log("inc: " + a + "->" + (a+1));
            if(a<limit){
                return a+1;
            }else{
                throw new Error("limit reached")
            }
        };
    };

    var print = function(a){
        console.log(a);
        return a;
    };

    var a = new Resolve(1);
    var b = a.proceed(inc).proceed(inc).proceed(inc).proceed(print);
    assert.ok(b.isResolved());
    assert.ok(b.value === 4);

    var to2 = incTo(2);
    var c = a.proceed(to2).proceed(to2).proceed(to2).proceed(print);
    console.log("Rejected?: "+c.isRejected());
    console.log(c.value);
    assert.ok(c.isRejected());
    assert.ok(c.value instanceof Error);
    console.log("passed: .proceed");

    var incB = function(a){
        return new Resolve(inc(a));
    };

    var to2B = function(a){
        return new Resolve(to2(a));
    };
    b = a.bind(incB).bind(incB).bind(incB).proceed(print);
    assert.ok(b.isResolved());
    assert.ok(b.value === 4);

    c = a.bind(to2B).bind(to2B).bind(to2B).proceed(print);
    console.log("Rejected?: "+c.isRejected());
    console.log(c.value);
    assert.ok(c.isRejected());
    assert.ok(c.value instanceof Error);
    console.log(">>passed: .bind");

    var succ = function(a){
        console.log("success");
        return inc(a);
    };

    var succTo2 = function(a){
        console.log("success");
        return to2(a);
    };

    var err = function(a){
        console.log("error");
        return a;
    };

    b = a.thenProceed(succ, err).thenProceed(succ, err).thenProceed(succ, err).proceed(print);
    assert.ok(b.isResolved());
    assert.ok(b.value === 4);

    b = a.thenProceed(succTo2, err).thenProceed(succTo2, err).thenProceed(succTo2, err).proceed(print);
    console.log("Rejected?: "+c.isRejected());
    console.log(c.value);
    assert.ok(c.isRejected());
    assert.ok(c.value instanceof Error);
    console.log(">>passed: .thenProceed");

    var succB = function(a){
        console.log("success");
        return new Resolve(inc(a));
    };

    var succTo2B = function(a){
        console.log("success");
        return new Resolve(to2(a));
    };

    var err = function(a){
        console.log("error");
        return a;
    };

    b = a.thenBind(succB, err).thenBind(succB, err).thenBind(succB, err).proceed(print);
    assert.ok(b.isResolved());
    assert.ok(b.value === 4);

    b = a.thenBind(succTo2B, err).thenBind(succTo2B, err).thenBind(succTo2B, err).proceed(print);
    console.log("Rejected?: "+c.isRejected());
    console.log(c.value);
    assert.ok(c.isRejected());
    assert.ok(c.value instanceof Error);
    console.log(">>passed: .thenBind");
}
