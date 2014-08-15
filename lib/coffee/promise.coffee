{EventEmitter} = require 'events'

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

exports.Promise = Promise
exports.test = test

