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

    describe( 'finding links', function() {

        function testFindingLinks( content, expected ) {

            const incoming = mockResponse( {
                statusCode: 200,
                request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
                headers: { 'content-type': 'text/html' },
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
                .then( () => {
                    expect( spy ).toHaveBeenCalledWith( expected );
                } );
        }

        it( 'finds <a> links in the content', function() {

            return testFindingLinks( 
                '<a href="http://www.bbc.co.uk/" class="test">text</a>',
                {
                    url: 'http://www.bbc.co.uk/',
                    source: {
                        nodeName: 'a',
                        attributes: { href: 'http://www.bbc.co.uk/', class: 'test' },
                        base: undefined,
                        url: 'http://www.bbc.co.uk/',
                        type: 'html',
                    },
                }
            );

        } );

        it( 'finds <area> links in the content', function() {

            return testFindingLinks( 
                '<area href="http://www.bbc.co.uk/" class="test" />',
                {
                    url: 'http://www.bbc.co.uk/',
                    source: {
                        nodeName: 'area',
                        attributes: { href: 'http://www.bbc.co.uk/', class: 'test' },
                        base: undefined,
                        url: 'http://www.bbc.co.uk/',
                        type: 'html',
                    },
                }
            );

        } );

        it( 'finds <img> links in the content', function() {

            return testFindingLinks( 
                '<img src="http://www.bbc.co.uk/" />',
                {
                    url: 'http://www.bbc.co.uk/',
                    source: {
                        nodeName: 'img',
                        attributes: { src: 'http://www.bbc.co.uk/' },
                        base: undefined,
                        url: 'http://www.bbc.co.uk/',
                        type: 'html',
                    },
                }
            );

        } );

        it( 'finds <link> links in the content', function() {

            return testFindingLinks( 
                '<link href="http://www.bbc.co.uk/" />',
                {
                    url: 'http://www.bbc.co.uk/',
                    source: {
                        nodeName: 'link',
                        attributes: { href: 'http://www.bbc.co.uk/' },
                        base: undefined,
                        url: 'http://www.bbc.co.uk/',
                        type: 'html',
                    },
                }
            );

        } );

        it( 'finds <script> links in the content', function() {

            testFindingLinks( 
                '<script src="http://www.bbc.co.uk/" /><script>',
                {
                    url: 'http://www.bbc.co.uk/',
                    source: {
                        nodeName: 'script',
                        attributes: { src: 'http://www.bbc.co.uk/' },
                        base: undefined,
                        url: 'http://www.bbc.co.uk/',
                        type: 'html',
                    },
                }
            );

        } );

        it( 'finds <iframe> links in the content', function() {

            return testFindingLinks( 
                '<iframe src="http://www.bbc.co.uk/" /><iframe>',
                {
                    url: 'http://www.bbc.co.uk/',
                    source: {
                        nodeName: 'iframe',
                        attributes: { src: 'http://www.bbc.co.uk/' },
                        base: undefined,
                        url: 'http://www.bbc.co.uk/',
                        type: 'html',
                    },
                }
            );

        } );

        it( 'finds <form> links in the content', function() {

            return testFindingLinks( 
                '<form action="http://www.bbc.co.uk/" /><form>',
                {
                    url: 'http://www.bbc.co.uk/',
                    source: {
                        nodeName: 'form',
                        attributes: { action: 'http://www.bbc.co.uk/' },
                        base: undefined,
                        url: 'http://www.bbc.co.uk/',
                        type: 'html',
                    },
                }
            );

        } );

        describe( 'link resolving', function() {

            it( 'resolves link using the request url', function() {

                return testFindingLinks( 
                    '<a href="/test">text</a>',
                    {
                        url: 'http://www.bbc.co.uk/test',
                        source: {
                            nodeName: 'a',
                            attributes: { href: '/test' },
                            base: undefined,
                            url: 'http://www.bbc.co.uk/',
                            type: 'html',
                        },
                    }
                );

            } );

            it( 'resolves link using the first found <base>', function() {

                return testFindingLinks( 
                    '<a href="/test">text</a><base href="http://wikipedia.org/"><base href="http://foobar.org/">',
                    {
                        url: 'http://wikipedia.org/test',
                        source: {
                            nodeName: 'a',
                            attributes: { href: '/test' },
                            base: 'http://wikipedia.org/',
                            url: 'http://www.bbc.co.uk/',
                            type: 'html',
                        },
                    }
                );

            } );

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