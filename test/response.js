'use strict';

const expect = require( 'expect' );
const url = require( 'url' );

const Response = require( '../lib/response' );
const mockIncoming = require( './util/mock-incoming' );

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
            'content-type': 'text/html; charset=utf-8',
        },
        buffer: 'lorem ipsum',
    };

    beforeEach( function() { 
        incoming = mockIncoming( Object.assign( {}, values ) );
    } );


    it( 'constructs a Response instance', function() {

        expect( new Response( incoming ) ).toBeA( Response );

    } );

    it( 'sets #stream to the incoming message stream', function() {
        
        const response = new Response( incoming );

        expect( response.stream ).toBe( incoming );

    } );

    it( 'sets #statusCode and #statusMessage', function() {

        const response = new Response( incoming );

        expect( response.statusCode ).toEqual( values.statusCode );
        expect( response.statusMessage ).toEqual( values.statusMessage );

    } );

    it( 'sets #url', function() {
        
        const response = new Response( incoming );

        expect( response.url ).toEqual( values.request.uri.format() );

    } );

    it( 'sets #headers', function() {
        
        const response = new Response( incoming );

        expect( response.headers ).toEqual( values.headers );

    } );

    it( 'sets #contentType', function() {
        
        const response = new Response( incoming );

        expect( response.contentType ).toEqual( 'text/html' );
        expect( response.charset ).toEqual( 'utf-8' );

    } );

    it( 'does not error if the content type is invalid', function() {

        const response = new Response( incoming );

        expect( Object.assign( {}, response ) )
            .toEqual( {
                statusCode: 200,
                statusMessage: 'OK',
                url: 'http://www.bbc.co.uk/',
                contentType: 'text/html',
                charset: 'utf-8',
                headers: {
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:45.0) Gecko/20100101 Firefox/45.0',
                    'content-type': 'text/html; charset=utf-8',
                },
            } );

    } );

    it( 'does not have any enumerable internals', function() {
        
        incoming.headers = {
            'content-type': 'asdasd`~~*7=sds; sds^^&\x00',
        };

        const response = new Response( incoming );

        expect( response.contentType ).toEqual( undefined );

    } );

    describe( '#resume', function() {

        it( 'returns a promise resolving after the end event', function() {

            const response = new Response( incoming );
            let ended = false;

            response.stream.on( 'end', () => {

                ended = true;

            } );

            return response.resume()
                .then( _response => {
                    expect( _response ).toBe( response );
                    expect( ended ).toBe( true );
                } );

        } );

        it( 'sets the property ended to true', function() {

            const response = new Response( incoming );

            expect( response.ended ).toEqual( false );

            return response.resume()
                .then( _response => {
                    expect( _response ).toBe( response );
                    expect( response.ended ).toEqual( true );
                } );

        } );

    } );

    describe( '#onEnd', function() {

        it( 'sets a function to run on the stream end', function() {

            const response = new Response( incoming );
            let ended = false;
            const spy = expect.createSpy().andCall( _response => {
                expect( _response ).toBe( response );
                expect( ended ).toBe( true );
            } );
            
            response.stream.on( 'end', () => {
                ended = true;
            } );


            response.onEnd( spy );

            return response.resume()
                .then( () => {
                    expect( spy ).toHaveBeenCalled();
                } );

        } );

    } );

    describe( '#onDownload', function() {

        it( 'sets a function to run when content is downloaded', function() {

            incoming.headers = Object.assign( {}, incoming.headers );
            incoming.headers['content-type'] = 'text/html';

            const response = new Response( incoming );
            let ended = false;
            const spy = expect.createSpy().andCall( _response => {
                expect( _response ).toBe( response );
                expect( ended ).toBe( true );
                expect( response.body ).toEqual( new Buffer( 'lorem ipsum' ) );
            } );
            
            response.stream.on( 'end', () => {
                ended = true;
            } );


            response.onDownload( spy );

            return response.resume()
                .then( () => {
                    expect( spy ).toHaveBeenCalled();
                } );

        } );

        it( 'converts body to string if encoding is specified', function() {

            incoming.headers['content-type'] = 'text/html; charset=utf-8';
            const response = new Response( incoming );
            let ended = false;
            const spy = expect.createSpy().andCall( _response => {
                expect( _response ).toBe( response );
                expect( ended ).toBe( true );
                expect( response.body ).toEqual( 'lorem ipsum' );
            } );
            
            response.stream.on( 'end', () => {
                ended = true;
            } );


            response.onDownload( spy );

            return response.resume()
                .then( () => {
                    expect( spy ).toHaveBeenCalled();
                } );

        } );

    } );


} );