var assert = require("assert");
var oo = require("./oo");

exports.Just = Just;
exports.Nothing = Nothing;

function Maybe(a){
};

Maybe.prototype.isJust = function(){
    assert.ok(this instanceof Maybe);
    return(this.constructor === Just);
};

Maybe.prototype.isNothing = function(){
    assert.ok(this instanceof Maybe);
    return(this.constructor === Nothing);
};


//fmap :: Maybe a -> (a -> b) -> Maybe b
Maybe.prototype.fmap = function(f){
    assert.ok(f instanceof Function);
    if(this.isJust()){
        var x = f(this.value);
        return(new Just(x));
    }else{
        return(new Nothing());
    }
};

//bind :: Maybe a -> (a -> Maybe b) -> Maybe b
Maybe.prototype.bind = function(f){
    assert.ok(f instanceof Function);
    if(this.isJust()){
        var x = f(this.value);
        assert.ok(x instanceof Maybe);
        return(x);
    }else{
        return(new Nothing());
    }
};

Maybe.prototype.just = function(){
    assert.ok(this.isJust());
    return this.value;
}

function Just(a){
    this.value = a;
    return(this);
};
oo.extend(Just, Maybe);

function Nothing(a){
    this.value = null;
    return(this);
};
oo.extend(Nothing, Maybe);

