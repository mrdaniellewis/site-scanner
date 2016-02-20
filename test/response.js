'use strict';

const expect = require( 'expect' );
const http = require( 'http' );
const url = require( 'url' );

const Response = require( '../lib/response' );

describe( 'Response', function() {

    let incoming;

    const values = {
        statusCode: 200,
        statusMessage: 'OK',
        request: {
            uri: url.parse( 'http://www.bbc.co.uk/' ),
        },
        headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0',
            'content-type': 'text/html; encoding=utf-8',
        },
    };

    beforeEach( function() {
        
        incoming = new http.IncomingMessage();
        Object.assign( incoming, values );

    } );


    it( 'constructs a Response instance', function() {

        expect( new Response( incoming ) ).toBeA( Response );

    } );

    it( 'sets the contents to the response stream', function() {
        
        const response = new Response( incoming );

        expect( response.contents ).toBe( incoming );

    } );

    it( 'sets the status code and message', function() {

        const response = new Response( incoming );

        expect( response.statusCode ).toEqual( values.statusCode );
        expect( response.statusMessage ).toEqual( values.statusMessage );

    } );

    it( 'sets the url', function() {
        
        const response = new Response( incoming );

        expect( response.url ).toEqual( values.request.uri );

    } );

    it( 'sets the headers', function() {
        
        const response = new Response( incoming );

        expect( response.headers ).toEqual( values.headers );

    } );

    it( 'sets the contentType', function() {
        
        const response = new Response( incoming );

        expect( response.contentType ).toEqual( 'text/html' );

    } );

    it( 'does not error if the content type is invalid', function() {
        
        incoming.headers = {
            'content-type': 'asdasd`~~*7=sds; sds^^&\x00',
        };

        const response = new Response( incoming );

        expect( response.contentType ).toEqual( undefined );

    } );


} );