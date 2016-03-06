'use strict';

const GeneratorFunction = Object.getPrototypeOf( function *() {} ).constructor;

/**
 *  Given a generator, create function that will
 *  run the generator to completion using promises
 */
const coroutine = exports.coroutine = function( fn, value ) {

    if ( !( fn instanceof GeneratorFunction ) ) {
        return Promise.resolve( fn( value ) );
    }

    const iterator = fn( value );

    function next( arg ) {

        let result;
        try {
            result = iterator.next( arg );
        } catch ( e ) {
            return Promise.reject( e );
        }

        if ( result.done ) {

            return result.value;

        } 

        return Promise.resolve( result.value )
            .then( next, error );

    }

    function error( arg ) {

        let result;
        try {
            result = iterator.throw( arg );
        } catch ( e ) {
            return Promise.reject( e );
        }

        if ( result.done ) {

            return result.value;

        }
            
        return Promise.resolve( result.value )
            .then( next, error );

    }

    return next();
};

/**
 *  Run a function against iterable values in a series
 *  @param {Function|GeneratorFunction} fn A function to run
 *  @param {Iterable} iterable An iterable of some sort
 *  @param {Object} [options]
 *  @param {Integer} [options.parallel=1] Number of parallel runners to run 
 */
const series = exports.series = function( fn, iterable, options ) {

    const iterator = ( function *() {   
        yield* iterable;
    }() );

    const parallel = options && options.parallel || 1;
    const collect = !options || options.collect !== false;

    const collected = [];
   
    function *runner() {

        let result;
        let value;

        /* eslint-disable no-constant-condition */

        while ( true ) {

            result = iterator.next();

            if ( result.done ) {
                return;
            }
            value = yield coroutine( fn, result.value );
            if ( collect ) {
                collected.push( value );
            }
        } 

        /* eslint-enable no-constant-condition */

    }

    const running = Array.apply( null, new Array( parallel ) )
        .map( () => {
            return coroutine( runner );
        } );

    return Promise.all( running )
        .then( () => collected );


};

exports.fifo = function( options ) {

    const wait = Symbol( 'wait' );
    const iterator = [];
    const resume = [];
    const infinite = !options || options.infinite !== false;
    let count = 0;
    let start = false;

    // An infinite iterator
    // If no item is found it will return wait
    iterator[Symbol.iterator] = function() {
        return {
            next() {

                if ( iterator.length ) {
                    const value = iterator.shift();
                    return { value, done: false };
                }

                // If infinite is false do end when the queue is 0
                // and all actions are completed
                if ( !infinite && start && count === 0 ) {
                    resumeAll();
                    return { value: undefined, done: true };
                }

                return { value: wait, done: false };
            },
        };
    };

    // Yield the value, or wait for a value to be added
    function *action( data ) {

        if ( data === wait ) {
            yield new Promise( resolve => {
                resume.push( resolve );
            } );
            return;
        }
        ++count;
        yield data();
        --count;
    }

    function resumeAll() {
        while ( resume.length ) {
            resume.shift()();
        }
    }

    const done = series( action, iterator, {
        parallel: options && options.parallel || 1,
        collect: false,
    } );

    const add = function( fn ) {

        start = true;

        const promise = new Promise( ( resolve, reject ) => {

            const runner = () => {
                
                try {
                    return coroutine( fn )
                        .then( resolve )
                        .catch( e => {
                            reject( e );
                            throw e;
                        } );

                } catch ( e ) {
                    reject( e );
                    return Promise.reject( e );
                }
            };

            iterator.push( runner );

        } );

        resumeAll();

        return promise;
    };

    add.done = done;
    return add;


};
