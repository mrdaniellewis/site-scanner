'use strict';

const urlUtils = require( 'url' );

const expect = require( 'expect' );

const parseLinks = require( '../lib/actions/parse-css-links' );
const Response = require( '../lib/response' );

const mockResponse = require( './util/mock-incoming' );

describe( 'parseCssLinks', function() {

    it( 'is a function', function() {

        expect( parseLinks ).toBeA( Function );

    } );

    it( 'it creates an event emitter', function() {

        expect( parseLinks() ).toBeA( Function );

    } );

    it( 'returns the response object for non-css requests ', function() {

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
            headers: { 'content-type': 'text/css' },
        } );

        const response = new Response( incoming );
        const value = parseLinks()( response );

        expect( value ).toBe( response );

    } );

    it( 'returns the response object for css requests with a 200 status code', function() {

        const incoming = mockResponse( {
            statusCode: 200,
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
            headers: { 'content-type': 'text/css' },
        } );

        const response = new Response( incoming );
        const value = parseLinks()( response );

        expect( value ).toBe( response );

    } );

    describe( 'finding links', function() {

        function testFindingLinks( content ) {

            const incoming = mockResponse( {
                statusCode: 200,
                request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
                headers: { 'content-type': 'text/css' },
                buffer: content,
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
                .then( () => spy );
        }

        it( 'finds token @import urls in the content', function() {

            return testFindingLinks( '@import foo.css' )
                .then( spy => {
                    expect( spy ).toHaveBeenCalledWith( {
                        url: 'http://www.bbc.co.uk/foo.css',
                        source: {
                            rule: '@import',
                            url: 'http://www.bbc.co.uk/',
                            type: 'css',
                        },
                    } );
                } );

        } );

        it( 'finds string @import urls in the content', function() {

            return testFindingLinks( '@import "foo.css"' )
                .then( spy => {
                    expect( spy ).toHaveBeenCalledWith( {
                        url: 'http://www.bbc.co.uk/foo.css',
                        source: {
                            rule: '@import',
                            url: 'http://www.bbc.co.uk/',
                            type: 'css',
                        },
                    } );
                } );

        } );

        it( 'finds string @import urls in the content', function() {

            return testFindingLinks( '@import "foo.css"' )
                .then( spy => {
                    expect( spy ).toHaveBeenCalledWith( {
                        url: 'http://www.bbc.co.uk/foo.css',
                        source: {
                            rule: '@import',
                            url: 'http://www.bbc.co.uk/',
                            type: 'css',
                        },
                    } );
                } );

        } );

        it( 'finds url @import links in the content', function() {

            return testFindingLinks( '@import url(foo.css)' )
                .then( spy => {
                    expect( spy ).toHaveBeenCalledWith( {
                        url: 'http://www.bbc.co.uk/foo.css',
                        source: {
                            rule: '@import',
                            url: 'http://www.bbc.co.uk/',
                            type: 'css',
                        },
                    } );
                } );

        } );

        it( 'finds @import links with media queries in the content', function() {

            return testFindingLinks( '@import url(foo.css)' )
                .then( spy => {
                    expect( spy ).toHaveBeenCalledWith( {
                        url: 'http://www.bbc.co.uk/foo.css',
                        source: {
                            rule: '@import',
                            url: 'http://www.bbc.co.uk/',
                            type: 'css',
                        },
                    } );
                } );

        } );

        it( 'finds links in property declarations', function() {

            const css = `a { 
                background-image: 
                    url(https://mdn.mozillademos.org/files/11305/firefox.png), 
                    url(https://mdn.mozillademos.org/files/11307/bubbles.png), 
                    linear-gradient(to right, rgba(30, 75, 115, 1), 
                    rgba(255, 255, 255, 0)); 
            }`;

            return testFindingLinks( css )
                .then( spy => {
                    
                    expect( spy.calls.length ).toEqual( 2 );

                    expect( spy ).toHaveBeenCalledWith( {
                        url: 'https://mdn.mozillademos.org/files/11305/firefox.png',
                        source: {
                            url: 'http://www.bbc.co.uk/',
                            type: 'css',
                        },
                    } );

                    expect( spy ).toHaveBeenCalledWith( {
                        url: 'https://mdn.mozillademos.org/files/11307/bubbles.png',
                        source: {
                            url: 'http://www.bbc.co.uk/',
                            type: 'css',
                        },
                    } );
                } );

        } );

    } );
    
} );