{EventEmitter} = require 'events'
assert = require 'assert'

PENDING = "PENDING"
RESOLVED = "RESOLVED"
REJECTED = "REJECTED"

class Promise extends EventEmitter
    constructor: () ->
        @status = PENDING

    resolve: (value) ->
            @value = value
            @status = RESOLVED
            @emit "done", RESOLVED

    reject: (value) ->
            @value = value
            @status = REJECTED
            @emit "done", REJECTED

    then: (onResolve, onReject) ->
    #then:: Promise(a) -> (a->b) -> (a->c) -> Promise(d)
        assert.ok onResolve instanceof Function
        assert.ok onReject instanceof Function
        n = new Promise()
        if @status is RESOLVED
            try
                n.resolve onResolve @value
            catch e
                n.reject e
            return n
        else if @status is REJECTED
            try
                n.reject onReject @value
            catch e
                n.reject e
            return n
        else
            @once "done", (status)->
                if status is RESOLVED
                    try
                        n.resolve onResolve @value
                    catch e
                        n.reject e
                else if status is REJECTED
                    try
                        n.reject onReject @value
                    catch e
                        n.reject e
            return n

    nand: (b)->
    # will wait for both a and b to be RESOLVED or REJECTED
    # Promise(a) Promise(b) a.nand(b)
    # REJECTED   REJECTED   RESOLVED(a)
    # REJECTED   RESOLVED   RESOLVED(a)
    # RESOLVED   REJECTED   RESOLVED(b)
    # RESOLVED   RESOLVED   REJECTED(b)

    # a.not() = a.nand(a)
    # a.and(b) = a.nand(b).not()
    # a.or(b) = a.not().nand(b.not())
    # a.nor(b) = a.or(b).not()
    # a.xor(b) = a.nand(a.nand(b)).nand(b.nand(a.nand(b)))
    # a.xnor(b) = a.nand(a.nand(b)).nand(b.nand(a.nand(b))).not()
        a = this
        n = new Promise()
        if a.status is REJECTED
            if b.status is PENDING
                b.once "done", (status) ->
                    n.resolve(a.value)
            else
                n.resolve(a.value)
            return n

        if a.status is RESOLVED
            if b.status is PENDING
                b.once "done", (status) ->
                    if status is REJECTED
                        n.resolve(b.value)
                    else
                        n.reject(b.value)
            else if b.status is REJECTED
                n.resolve(b.value)
            else
                n.reject(b.value)
            return n

        if a.status is PENDING and b.status is REJECTED
            a.once "done", (status) ->
                if a.status is REJECTED
                    n.resolve(a.value)
                else
                    n.resolve(b.value)
            return n

        if a.status is PENDING and b.status is RESOLVED
            a.once "done", (status) ->
                if a.status is REJECTED
                    n.resolve(a.value)
                else
                    n.reject(b.value)
            return n

        if a.status is PENDING and b.status is PENDING
            a.once "done", (status) ->
                unless b.status is PENDING
                    if status is REJECTED
                        n.resolve(a.value)
                    else
                        if b.status is REJECTED
                            n.resolve(b.value)
                        else
                            n.reject(b.value)

            if a is not b
                b.once "done", (status) ->
                    unless a.status is PENDING
                        if a.status is REJECTED
                            n.resolve(a.value)
                        else
                            if status is REJECTED
                                n.resolve(b.value)
                            else
                                n.reject(b.value)
            return n

    not: ()->
        return @nand(this)

    and: (b)->
        return @nand(b).not()

    or: (b)->
        return @not().nand(b.not())

    nor: (b)->
        return @or(b).not()

    xor: (b)->
        nand = @nand(b)
        return @nand(nand).nand(b.nand(nand))

    xnor: (b)->
        return @xor(b).not()
    
test = () ->
    a = new Promise()
    ince = (value) ->
        throw value+1
    err = (value) ->
        value

    b = a.then ince, err
    console.log "b = a.then(ince, err)"
    console.log b
    c = b.then ince, err
    console.log "l = a.then(ince, err)"
    console.log c
    console.log "a.resolve(0)"

    a.resolve 0
    console.log b
    console.log c

    a = new Promise()
    a.resolve("a")
    b = new Promise()
    b.reject("b")
    c = new Promise()
    d = new Promise()

    console.log "a is resolved"
    console.log "b is rejected"
    console.log "c d is pending"
    console.log "a or b ", a.or b
    console.log "a or c ", a.or c
    console.log "a or d ", a.or d
    console.log "b or c ", b.or c
    console.log "b or d ", b.or d
    console.log "c or d ", c.or d

    console.log "a and b", a.and b
    console.log "a and c", a.and c
    console.log "a and d", a.and d
    console.log "b and c", b.and c
    console.log "b and d", b.and d
    console.log "c and d", c.and d

    console.log "a xor b", a.xor b
    console.log "a xor c", a.xor c
    console.log "a xor d", a.xor d
    console.log "b xor c", b.xor c
    console.log "b xor d", b.xor d
    console.log "c xor d", c.xor d

    c.resolve("c")
    d.reject("d")
    console.log "c is resolved"
    console.log "d is rejected"
    console.log "a or b ", a.or b
    console.log "a or c ", a.or c
    console.log "a or d ", a.or d
    console.log "b or c ", b.or c
    console.log "b or d ", b.or d
    console.log "c or d ", c.or d

    console.log "a and b", a.and b
    console.log "a and c", a.and c
    console.log "a and d", a.and d
    console.log "b and c", b.and c
    console.log "b and d", b.and d
    console.log "c and d", c.and d

    console.log "a xor b", a.xor b
    console.log "a xor c", a.xor c
    console.log "a xor d", a.xor d
    console.log "b xor c", b.xor c
    console.log "b xor d", b.xor d
    console.log "c xor d", c.xor d

exports.Promise = Promise
exports.test = test

test()
