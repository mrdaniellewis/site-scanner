/* eslint-disable no-throw-literal, no-param-reassign, no-unreachable */

'use strict';

const expect = require( 'expect' );
const queue = require( '../lib/queue' );

describe( 'queue.coroutine', function() {

    it( 'returns the result of a function as a Promise', function() {

        const result = queue.coroutine( x => x, 'foobar' );
        expect( result ).toBeA( Promise );

        return result
            .then( value => {
                expect( value ).toBe( 'foobar' );
            } );

    } );

    it( 'Resolves all yielded promises before continuing', function() {

        function *generator( count ) {

            count += yield 2;
            count += yield Promise.resolve( 4 )
                .then( value => value + 8 );

            count += yield 16;
            return count;   
        }

        return queue.coroutine( generator, 1 )
            .then( function( value ) {
                expect( value ).toBe( 1 + 2 + 4 + 8 + 16 );
            } );

    } );

    it( 'Returns a rejected promise if the generator contains rejected promises', function() {

        function *generator( count ) {

            count += yield 2;
            count += yield Promise.reject( 4 );
            count += yield 8;

            return count;   
        }

        return queue.coroutine( generator, 1 ) 
            .then( () => {
                throw new Error( 'Should not have been called' );
            } )
            .catch( e => {
                expect( e ).toBe( 4 );
            } );

    } );

    it( 'Returns a rejected promise if the generator throws an error', function() {

        function *generator( count ) {

            count += yield 2;
            throw 4;
            count += yield 8;

            return count;   
        }

        return queue.coroutine( generator, 1 ) 
            .then( () => {
                throw new Error( 'Should not have been called' );
            } )
            .catch( e => {
                expect( e ).toBe( 4 );
            } );

    } );

    it( 'Allows rejected promises to be caught as errors', function() {

        function *generator( count ) {

            count += yield 2;

            try {
                count += yield Promise.reject( 4 );
            } catch ( e ) {
                count += e;
            }

            count += yield 8;

            return count;
        }

        return queue.coroutine( generator, 1 )
            .then( function( value ) {
                expect( value ).toBe( 1 + 2 + 4 + 8 );
            } );
    } );

    it( 'Throws an error if not supplied with a function', function() {

        expect( function() {
            queue.coroutine( {} );
        } ).toThrow( 'fn is not a function' );

    } );

} );


describe( 'queue.series', function() {

    it( 'runs a function on each item in an iterator', function() {

        const spy = expect.createSpy().andCall( value => value );

        return queue.series( spy, [1, 2, 3, 4] )
            .then( values => {
                
                expect( spy.calls.length ).toBe( 4 );
                expect( spy )
                    .toHaveBeenCalledWith( 1 )
                    .toHaveBeenCalledWith( 2 )
                    .toHaveBeenCalledWith( 3 )
                    .toHaveBeenCalledWith( 4 );

                expect( values ).toEqual( [1, 2, 3, 4] );

            } );

    } );

    it( 'resolves returned promises', function() {

        return queue.series( value => Promise.resolve( value ), [1, 2, 3, 4] )
            .then( values => {
                expect( values ).toEqual( [1, 2, 3, 4] );
            } );

    } );

    it( 'rejects errors', function() {

        return queue.series( value => Promise.reject( value ), [1, 2, 3, 4] )
            .then( () => {
                throw new Error( 'Should not have been called' );
            } )
            .catch( e => {
                expect( e ).toEqual( 1 );
            } );

    } );

    it( 'resolves a generator', function() {

        function *generator( count ) {

            count += yield 1;
            count += yield Promise.resolve( 1 );
            count += yield 1;
            return count;   
        }

        return queue.series( generator, [1, 2, 3, 4] )
            .then( values => {
                
                expect( values ).toEqual( [4, 5, 6, 7] );

            } );

    } );

    it( 'resolves a generator yielding generators', function() {

        function *generator( count ) {

            count += yield 1;
            count += yield Promise.resolve( 1 );
            count += yield 1;
            count += yield* subGenerator();
            return count;   
        }

        function *subGenerator() {

            let count = 0;
            count += yield 1;
            count += yield Promise.resolve( 1 );
            count += yield 1;
            return count;   
        }

        return queue.series( generator, [1, 2, 3, 4] )
            .then( values => { 
                expect( values ).toEqual( [7, 8, 9, 10] );
            } );

    } );

    it( 'rejects errors in a generator', function() {

        function *generator( count ) {

            count += yield 1;
            throw 'x';
            count += yield Promise.resolve( 1 );
            count += yield 1;
            return count;   
        }

        return queue.series( generator, [1, 2, 3, 4] )
            .then( () => {
                throw new Error( 'Should not have been called' );
            } )
            .catch( e => {
                expect( e ).toEqual( 'x' );
            } );

    } );

    it( 'rejects errors in a generator', function() {

        function *generator( count ) {

            count += yield 1;
            throw 'x';
            count += yield Promise.resolve( 1 );
            count += yield 1;
            return count;   
        }

        return queue.series( generator, [1, 2, 3, 4] )
            .then( () => {
                throw new Error( 'Should not have been called' );
            } )
            .catch( e => {
                expect( e ).toEqual( 'x' );
            } );

    } );

    it( 'allows an array iterable to be added to', function() {

        const iterable = [1];
        function doAction( value ) {
            if ( value < 4 ) {
                iterable.push( value + 1 );
            }
            return value;
        }

        return queue.series( doAction, iterable )
        .then( values => {
            expect( values ).toEqual( [1, 2, 3, 4] );
        } );

    } );

    describe( 'collect option', function() {

        it( 'suppresses returning values', function() {

            const spy = expect.createSpy().andCall( value => value );

            return queue.series( spy, [1, 2, 3, 4], { collect: false } )
                .then( values => {
                    
                    expect( values ).toEqual( [] );
                   
                } );

        } );

    } );

    it( 'rejects if not supplied with a function', function() {

            
        return queue.series( {}, [1, 2, 3, 4] )
            .then( () => {
                throw new Error( 'Should not have been called' );
            } )
            .catch( e => {
                expect( e.message ).toEqual( 'fn is not a function' );
            } );
        
    } );

    describe( 'parallel option', function() {

        it( 'runs the series in parallel', function() {

            function *generator( count ) {

                count += yield 1;
                count += yield Promise.resolve( 1 );
                return count;   
            }

            return queue.series( generator, [0, 1, 2, 3, 4, 5], { parallel: 2 } )  
                .then( results => {
                    expect( results ).toEqual( [2, 3, 4, 5, 6, 7] );
                } );

        } );

        it( 'runs the series in parallel where parallel exceeds items', function() {

            function *generator( count ) {

                count += yield 1;
                count += yield Promise.resolve( 1 );
                return count;   
            }

            return queue.series( generator, [0, 1, 2, 3, 4, 5], { parallel: 100 } )  
                .then( results => {
                    expect( results ).toEqual( [2, 3, 4, 5, 6, 7] );
                } );

        } );

        it( 'actually runs items in parallel', function() {

            let testValue = 0;

            function *generator() {

                let count = testValue;
                ++testValue;
                yield 1;
                count += yield Promise.resolve( 1 );
                ++testValue;
                return count;   
            }

            return queue.series( generator, [null, null, null], { parallel: 2 } )  
                .then( results => {
                    
                    // The result is the value of testValue
                    // when the generator started processing plus 1
                    // If all three items start at once the output would be [1,2,3]
                    // If they ran one at a time it would be [1,3,5]

                    expect( results ).toEqual( [1, 2, 5] );
                    expect( testValue ).toBe( 6 );
                } );
            

        } );

    } );


} );

describe( 'queue.fifo', function() {

    it( 'returns a function', function() {

        expect( queue.fifo( x => x ) ).toBeA( Function );

    } );

    describe( 'queue function', function() {
        
        it( 'returns a promise resolving when the function runs', function() {

            const fifo = queue.fifo();

            return fifo( () => 1 )
                .then( value => {
                    expect( value ).toBe( 1 );
                } );

        } );

        it( 'resolves returned promises', function() {

            const fifo = queue.fifo();

            return fifo( () => Promise.resolve( 1 ) )
                .then( value => {
                    expect( value ).toBe( 1 );
                } );

        } );

        it( 'resolves returned generators as coroutines', function() {

            const fifo = queue.fifo();

            function *generator() {
                const value = yield Promise.resolve( 1 );
                return value;
            }

            return fifo( generator )
                .then( value => {
                    expect( value ).toBe( 1 );
                } );

        } );

        it( 'rejects erroring promises', function() {

            const fifo = queue.fifo();

            return fifo( () => Promise.reject( 'error' ) )
                .then( () => {
                    throw new Error( 'Should not have been called' );
                } )
                .catch( e => {
                    expect( e ).toEqual( 'error' );
                } );

        } );

        it( 'rejects erroring promises', function() {

            const fifo = queue.fifo();

            return fifo( () => { 
                throw 'error'; 
            } )
                .then( () => {
                    throw new Error( 'Should not have been called' );
                } )
                .catch( e => {
                    expect( e ).toEqual( 'error' );
                } );

        } );

        it( 'rejects erroring generators', function() {

            const fifo = queue.fifo();

            function *generator() {
                const value = yield Promise.reject( 'error' );
                return value;
            }

            return fifo( generator )
                .then( () => {
                    throw new Error( 'Should not have been called' );
                } )
                .catch( e => {
                    expect( e ).toEqual( 'error' );
                } );

        } );

        it( 'runs added functions in order', function() {

            const fifo = queue.fifo();

            const action = x => Promise.resolve( x );

            const actions = [
                fifo( action.bind( null, 1 ) ),
                fifo( action.bind( null, 2 ) ),
                fifo( action.bind( null, 3 ) ),
                fifo( action.bind( null, 4 ) ),
            ];

            return Promise.all( actions )
                .then( values => {
                    expect( values ).toEqual( [1, 2, 3, 4] );
                } );
        } );

        it( 'keeps resolving functions infinitely', function() {

            const fifo = queue.fifo();

            const action = x => Promise.resolve( x );

            const actions = [
                fifo( action.bind( null, 1 ) ),
                fifo( action.bind( null, 2 ) ),
            ];

            return Promise.all( actions )
                .then( () => {
                    actions.push( fifo( action.bind( null, 3 ) ) );
                    actions.push( fifo( action.bind( null, 4 ) ) ); 
                    return Promise.all( actions );
                } )
                .then( values => {
                    expect( values ).toEqual( [1, 2, 3, 4] );
                } );
        } );

        it( 'keeps resolving after an error', function() {

            const fifo = queue.fifo();

            fifo( () => {
                throw 'error';
            } )
            .catch( e => {
                expect( e ).toEqual( 'error' );
                return fifo( () => 1 );
            } )
            .then( value => {    
                expect( value ).toEqual( 1 );
            } );
              
        } );

        it( 'rejects if a function is not supplied', function() {

            return queue.fifo()( {} )   
                .then( () => {
                    throw new Error( 'Should not have been called' );
                } )
                .catch( e => {
                    expect( e.message ).toEqual( 'fn is not a function' );
                } );

        } );


    } );

    describe( 'parallel option', function() {

        it( 'runs items in parallel', function() {

            const fifo = queue.fifo( { parallel: 2 } );

            let testValue = 0;

            function *generator() {

                let count = testValue;
                ++testValue;
                yield 1;
                count += yield Promise.resolve( 1 );
                ++testValue;

                return count;   
            }

            const actions = [
                fifo( generator ),
                fifo( generator ),
                fifo( generator ),
            ];

            return Promise.all( actions )
                .then( results => {
                    
                    // The result is the value of testValue
                    // when the generator started processing plus 1
                    // If all three items start at once the output would be [1,2,3]
                    // If they ran one at a time it would be [1,3,5]

                    expect( results ).toEqual( [1, 2, 5] );
                    expect( testValue ).toBe( 6 );
                } );
            

        } );

    } );

    describe( 'infinite option', function() {

        it( 'returns a done property', function() {

            const fifo = queue.fifo();
            expect( fifo.done ).toBeA( Promise );

        } );

        it( 'ends the fifo if the queue is empty and all items are processed', function() {

            const fifo = queue.fifo( { infinite: false, parallel: 2 } );
            const spy = expect.createSpy().andCall( () => {
                return new Promise( resolve => {
                    setTimeout( () => {
                        resolve();
                    }, 100 );
                } ); 
            } );

            fifo( spy );
            fifo( spy );
            fifo( spy );

            return fifo.done
                .then( () => {
                    expect( spy.calls.length ).toEqual( 3 );
                } );


        } );

        it( 'rejects if a queue item returns an error', function() {

            const fifo = queue.fifo( { infinite: false, parallel: 2 } );
            const spy = expect.createSpy().andCall( () => {
                return Promise.reject( 'x' );
            } );

            fifo( spy );
            fifo( spy );
            fifo( spy );

            return fifo.done
                .then( () => {
                    throw new Error( 'Should not have been called' );
                } )
                .catch( e => {
                    expect( e ).toBe( 'x' );
                } );


        } );

    } );

} );