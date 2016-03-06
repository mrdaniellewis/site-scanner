'use strict';

const expect = require( 'expect' );

const mock = require( 'mock-http' );

const size = require( '../lib/actions/size' );
const Response = require( '../lib/response' );

describe( 'size', function() {

    it( 'is a function', function() {

        expect( size ).toBeA( Function );

    } );

    it( 'returns the response object', function() {

        const incoming = new mock.Request();
        const response = new Response( incoming );
        const value = size( response );

        expect( value ).toBe( response );

    } );

    it( 'sets the value of the size of the request on end', function( callback ) {

        const incoming = new mock.Request( {
            buffer: new Buffer( 1000 ),
        } );
        
        const response = new Response( incoming );
        const value = size( response );

        incoming.on( 'end', function() {
            
            expect( value.size ).toEqual( 1000 );
            callback();

        } );

        incoming.resume();

    } );

} );