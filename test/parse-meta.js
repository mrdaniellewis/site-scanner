'use strict';

const urlUtils = require( 'url' );

const expect = require( 'expect' );

const parseMeta = require( '../lib/actions/parse-meta' );
const Response = require( '../lib/response' );

const mockResponse = require( './util/mock-incoming' );

describe( 'parseMeta', function() {

    it( 'is a function', function() {

        expect( parseMeta ).toBeA( Function );

    } );

    it( 'it creates an event emitter', function() {

        expect( parseMeta() ).toBeA( Function );

    } );

    it( 'returns the response object for non-html requests ', function() {

        const incoming = mockResponse( {
            statusCode: 200,
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
        } );

        const response = new Response( incoming );
        const value = parseMeta()( response );

        expect( value ).toBe( response );

    } );

    it( 'returns the response object for requests without a 200 status', function() {

        const incoming = mockResponse( {
            statusCode: 300,
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
            headers: { 'content-type': 'text/html' },
        } );

        const response = new Response( incoming );
        const value = parseMeta()( response );

        expect( value ).toBe( response );

    } );

    it( 'returns the response object for html requests with a 200 status code', function() {

        const incoming = mockResponse( {
            statusCode: 200,
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
            headers: { 'content-type': 'text/html' },
        } );

        const response = new Response( incoming );
        const value = parseMeta()( response );

        expect( value ).toBe( response );

    } );

    it( 'finds meta', function() {

        const incoming = mockResponse( {
            statusCode: 200,
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
            headers: { 'content-type': 'text/html' },
            buffer: '<title>Foo bar</title>',
        } );

        const response = new Response( incoming );

        const parser = parseMeta();        

        return parser( response )
            .resume()
            .then( () => {
                
                expect( response.meta ).toEqual( {
                    title: 'Foo bar',
                } );

            } );

    } );

} );