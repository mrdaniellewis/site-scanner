'use strict';

const expect = require( 'expect' );

const mock = require( 'mock-http' );

const timing = require( '../lib/actions/timing' );
const Response = require( '../lib/response' );

describe( 'timing', function() {

    it( 'is a function', function() {

        expect( timing ).toBeA( Function );

    } );

    it( 'returns the response object', function() {

        const incoming = new mock.Request();
        const response = new Response( incoming );
        const value = timing( response );

        expect( value ).toBe( response );

    } );

    it( 'sets the value of elapsedTime on end', function( callback ) {

        const incoming = new mock.Request();
        const elapsedTime = 0.1;
        incoming.on( 'end', function() {
            incoming.elapsedTime = elapsedTime;
        } );
        
        const response = new Response( incoming );
        const value = timing( response );

        incoming.on( 'end', function() {
            
            expect( value.time ).toEqual( elapsedTime );
            callback();

        } );

        incoming.resume();

    } );

} );