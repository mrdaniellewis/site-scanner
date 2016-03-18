'use strict';

const urlUtils = require( 'url' );

const expect = require( 'expect' );

const redirect = require( '../lib/actions/redirect' );
const Response = require( '../lib/response' );

const mockIncoming = require( './util/mock-incoming' );

describe( 'redirect', function() {

    it( 'is a function', function() {

        expect( redirect ).toBeA( Function );

    } );

    it( 'it returns a function', function() {

        expect( redirect() ).toBeA( Function );

    } );

    it( 'returns the response object', function() {

        const incoming = mockIncoming( {
            statusCode: 200,
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
        } );

        const response = new Response( incoming );
        const value = redirect()( response );

        expect( value ).toBe( response );

    } );

    it( 'rejects if the location field is missing for a redirect status code', function() {

        const incoming = mockIncoming( {
            statusCode: 301,
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
        } );

        const response = new Response( incoming );

        expect( () => {
            redirect()( response );
        } ).toThrow( 'Location header missing' );

    } );

    it( 'sets a redirect if it is a redirect status code', function() {

        const incoming = mockIncoming( {
            statusCode: 301,
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
            headers: { location: 'http://www.bbc.co.uk/' },
        } );

        const response = new Response( incoming );
        const linkManager = {
            add() {},
        };

        const spy = expect.spyOn( linkManager, 'add' );

        const redirector = redirect( {
            linkManager,
        } );

        return redirector( response )
            .then( value => {
                expect( value ).toBe( response );
                expect( spy ).toHaveBeenCalledWith( 'http://www.bbc.co.uk/' );
            } );
    } );

    
    it( 'adds a reference to the datastore if it is a redirect', function() {

        const incoming = mockIncoming( {
            statusCode: 301,
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk/' ) },
            headers: { location: 'http://www.bbc.co.uk/' },
        } );

        const response = new Response( incoming );
        const dataStore = {
            addReference() {},
        };

        const spy = expect.spyOn( dataStore, 'addReference' )
            .andReturn( Promise.resolve() );

        const redirector = redirect( {
            dataStore,
        } );

        const expectedReference = {
            url: 'http://www.bbc.co.uk/',
            source: {
                type: 'http',
                resource: 'http://www.bbc.co.uk/',
                statusCode: 301,
                header: 'location',
                value: 'http://www.bbc.co.uk/',
            },
        };

        return redirector( response )
            .then( value => {
                expect( value ).toBe( response );
                expect( spy ).toHaveBeenCalledWith( expectedReference );
            } );
    } );

    it( 'resolves the redirect relative the request url ', function() {

        const incoming = mockIncoming( {
            statusCode: 301,
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk/' ) },
            headers: { location: '/test' },
        } );

        const response = new Response( incoming );
        const linkManager = {
            add() {},
        };
        const dataStore = {
            addReference() {},
        };

        const spyLinkManager = expect.spyOn( linkManager, 'add' );
        const spyDataStore = expect.spyOn( dataStore, 'addReference' )
            .andReturn( Promise.resolve() );

        const redirector = redirect( {
            linkManager,
            dataStore,
        } );

        const expectedReference = {
            url: 'http://www.bbc.co.uk/test',
            source: {
                type: 'http',
                resource: 'http://www.bbc.co.uk/',
                value: '/test',
                header: 'location',
                statusCode: 301,
            },
        };

        return redirector( response )
            .then( () => {
                expect( spyLinkManager ).toHaveBeenCalledWith( 'http://www.bbc.co.uk/test' );
                expect( spyDataStore ).toHaveBeenCalledWith( expectedReference );
            } );
    } );


} );