'use strict';

const urlUtils = require( 'url' );

const expect = require( 'expect' );

const parseLinks = require( '../lib/actions/parse-html-links' );
const Response = require( '../lib/response' );

const mockResponse = require( './util/mock-incoming' );

describe( 'parseHtmlLinks', function() {

    it( 'is a function', function() {

        expect( parseLinks ).toBeA( Function );

    } );

    it( 'it creates an event emitter', function() {

        expect( parseLinks() ).toBeA( Function );

    } );

    it( 'returns the response object for non-html requests ', function() {

        const incoming = mockResponse( {
            statusCode: 200,
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
        } );

        const response = new Response( incoming );
        const value = parseLinks()( response );

        expect( value ).toBe( response );

    } );

    it( 'returns the response object for requests without a 200 status', function() {

        const incoming = mockResponse( {
            statusCode: 300,
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
            headers: { 'content-type': 'text/html' },
        } );

        const response = new Response( incoming );
        const value = parseLinks()( response );

        expect( value ).toBe( response );

    } );

    it( 'returns the response object for html requests with a 200 status code', function() {

        const incoming = mockResponse( {
            statusCode: 200,
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
            headers: { 'content-type': 'text/html' },
        } );

        const response = new Response( incoming );
        const value = parseLinks()( response );

        expect( value ).toBe( response );

    } );

    it( 'finds links', function() {

        const incoming = mockResponse( {
            statusCode: 200,
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
            headers: { 'content-type': 'text/html' },
            buffer: '<a href="http://www.bbc.co.uk/" class="test">text</a>',
        } );

        const response = new Response( incoming );

        const dataStore = {
            addReference() {},
        };

        const spy = expect.spyOn( dataStore, 'addReference' )
                .andReturn( Promise.resolve() );

        const parser = parseLinks( { dataStore } );        

        return parser( response )
            .resume()
            .then( () => {
                
                expect( spy ).toHaveBeenCalledWith( [{
                    url: 'http://www.bbc.co.uk/',
                    source: {
                        url: 'http://www.bbc.co.uk/',
                        nodeName: 'a',
                        attr: 'href',
                        attributes: { class: 'test', href: 'http://www.bbc.co.uk/' },
                        line: 1,
                        column: 1,
                        type: 'html',
                        base: undefined,
                        resource: 'http://www.bbc.co.uk/',
                    },
                }] );

            } );

    } );

    describe( 'linkManager option', function() {

        it( 'passes links to the supplied linkManager', function() {

            const incoming = mockResponse( {
                statusCode: 200,
                request: { uri: urlUtils.parse( 'http://www.bbc.co.uk/' ) },
                headers: { 'content-type': 'text/html' },
                buffer: '<a href="/test">text</a>',
            } );

            const response = new Response( incoming );

            const linkManager = {
                add() {},
            };

            const spy = expect.spyOn( linkManager, 'add' )
                .andReturn( Promise.resolve() );

            const parser = parseLinks( { linkManager } );

            return parser( response )
                .resume()
                .then( () => {
                    expect( spy ).toHaveBeenCalledWith( 'http://www.bbc.co.uk/test' );
                } );

        } );

        describe( 'filter option', function() {

            it( 'filters out links using a custom function', function() {

                const incoming = mockResponse( {
                    statusCode: 200,
                    request: { uri: urlUtils.parse( 'http://www.bbc.co.uk/' ) },
                    headers: { 'content-type': 'text/html' },
                    buffer: '<a href="/test1">text</a><a href="/test2">text</a>',
                } );

                const response = new Response( incoming );

                const filter = reference => {
                    return reference.source.attributes.href === '/test1';
                };

                const linkManager = {
                    add() {},
                };

                const spy = expect.spyOn( linkManager, 'add' )
                    .andReturn( Promise.resolve() );

                const parser = parseLinks( { linkManager, filter } );

                return parser( response )
                    .resume()
                    .then( () => {
                        expect( spy.calls.length ).toEqual( 1 );
                        expect( spy ).toHaveBeenCalledWith( 'http://www.bbc.co.uk/test1' );
                    } );

            } );

        } );

    } );

} );