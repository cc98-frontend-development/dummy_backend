# a promise/A+-non-compliant promise implementation
# Copyright (C) 2014 James Ruan
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along
# with this program; if not, write to the Free Software Foundation, Inc.,
# 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

# This is not a promise/A+ compliant one. Main differences includes:
#
# 1. A Promise can be 'then'ed multiple times, but the registered handler
#    is not promised to run in their registering order. In order to sync
#    multiple Promise, '3.' provides a more powerful way.
#
# 2. An onResolve/onReject handler returns only a value, not a Promise,
#    not a 'thenable'. There's not 'Resolution Procedure' as in 
#    http://promisesaplus.com/#point-45, the value is passed on to the new
#    Promise. This forces user to use it in the Monad way without manually
#    constructing a Monad: Promise(a) -> (a->b) -> Promise(b). (a->b) is
#    sufficient, no need to provide (a->Promise(b)).
#
# 3. Logical function aggregators that wait for multiple Promises to be
#    RESOLVED or REJECTED, aggregated value is taken from one of these
#    Promises following certain rule:
#
#    - a or b  -> RESOVLED: a over b (both RESOVLED)
#                 REJECTED: b over a (both REJECTED)
#
#    - a and b -> RESOVLED: b over a (both RESOVLED)
#                 REJECTED: a over b (both REJECTED)
#
#    - a xor b -> RESOVLED: REJECTED one over RESOVLED one,
#                 REJECTED: b over a (both RESOVLED or REJECTED)
#
#    The NOT version of above functions just revert the status, not the value: 
#
#    - a nor b  -> REJECTED: a over b (both RESOVLED)
#                  RESOVLED: b over a (both REJECTED)
#
#    - a nand b -> REJECTED: b over a (both RESOVLED)
#                  RESOVLED: a over b (both REJECTED)
#
#    - a xnor b -> REJECTED: REJECTED one over RESOVLED one,
#                  RESOVLED: b over a (both RESOVLED or REJECTED)


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
        n = new Promise()
        if @status is RESOLVED
            process.nextTick ()->
                try
                    if onResolve instanceof Function
                        n.resolve onResolve @value
                    else
                        n.resolve @value
                catch e
                    n.reject e
            return n
        else if @status is REJECTED
            process.nextTick ()->
                try
                    if onResolve instanceof Function
                        n.reject onResolve @value
                    else
                        n.reject @value
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
    # NAND has functional completeness to express all logical function
    # Promise(a) Promise(b) a.nand(b)
    # REJECTED   REJECTED   RESOLVED(a)
    # REJECTED   RESOLVED   RESOLVED(a)
    # RESOLVED   REJECTED   RESOLVED(b)
    # RESOLVED   RESOLVED   REJECTED(b)

    # a.not() = a.nand(a)
    # a.id() = a.not().not()
    # a.and(b) = a.nand(b).not()
    # a.or(b) = a.not().nand(b.not())
    # a.nor(b) = a.or(b).not()
    # a.xor(b) = a.nand(a.nand(b)).nand(b.nand(a.nand(b)))
    # a.xnor(b) = a.xor(b).not()
        a = this
        n = new Promise()
        if a.status is REJECTED
            if b.status is PENDING
                b.once "done", (status) ->
                    n.resolve(a.value)
            else
                process.nextTick ()->
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
                process.nextTick ()->
                    n.resolve(b.value)
            else
                process.nextTick ()->
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
                else
                    b.once "done", (status) ->
                        if a.status is REJECTED
                            n.resolve(a.value)
                        else
                            if status is REJECTED
                                n.resolve(@value)
                            else
                                n.reject(@value)


            if a is not b
                b.once "done", (status) ->
                    unless status is PENDING
                        if a.status is REJECTED
                            n.resolve(a.value)
                        else
                            if status is REJECTED
                                n.resolve(@value)
                            else
                                n.reject(@value)
                    else
                        a.once "done", (status) ->
                            if status is REJECTED
                                n.resolve(a.value)
                            else
                                if b.status is REJECTED
                                    n.resolve(b.value)
                                else
                                    n.reject(b.value)
            return n

    not: ()->
        return @nand(this)

    id: ()->
    # id return a copy of RESOLVED or REJECTED Promise(a) with its value
        return @not().not()

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
    e = c.id()

    console.log "a is resolved"
    console.log "b is rejected"
    console.log "c d is pending"
    console.log "e = c.id()", e
    console.log "e is c", e is c

    a_or_b  = a.or b
    a_or_c  = a.or c
    a_or_d  = a.or d
    b_or_c  = b.or c
    b_or_d  = b.or d
    c_or_d  = c.or d

    a_and_b = a.and b
    a_and_c = a.and c
    a_and_d = a.and d
    b_and_c = b.and c
    b_and_d = b.and d
    c_and_d = c.and d

    a_xor_b = a.xor b
    a_xor_c = a.xor c
    a_xor_d = a.xor d
    b_xor_c = b.xor c
    b_xor_d = b.xor d
    c_xor_d = c.xor d

    out = ()->
        console.log "a or b ", a_or_b
        console.log "a or c ", a_or_c
        console.log "a or d ", a_or_d
        console.log "b or c ", b_or_c
        console.log "b or d ", b_or_d
        console.log "c or d ", c_or_d

        console.log "a and b", a_and_b
        console.log "a and c", a_and_c
        console.log "a and d", a_and_d
        console.log "b and c", b_and_c
        console.log "b and d", b_and_d
        console.log "c and d", c_and_d

        console.log "a xor b", a_xor_b
        console.log "a xor c", a_xor_c
        console.log "a xor d", a_xor_d
        console.log "b xor c", b_xor_c
        console.log "b xor d", b_xor_d
        console.log "c xor d", c_xor_d
    
    out()

    c.resolve("c")
    d.reject("d")

    console.log "c is resolved"
    console.log "d is rejected"
    console.log "e = c.id()", e
    console.log "e is c", e is c

    console.log ">>Show async: some may still PENDING"
    out()
    console.log ">>Let's see them 1 second later"
    
    setTimeout out, 1000

exports.Promise = Promise
exports.test = test
