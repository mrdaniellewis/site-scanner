'use strict';

const expect = require( 'expect' );
const stream = require( 'stream' );
const urlUtils = require( 'url' );

const collect = require( 'stream-collect' );

const LinkManager = require( '../lib/link-manager' );

describe( 'LinkManager', function() {

    it( 'constructs a LinkManager instance', function() {

        expect( new LinkManager() ).toBeA( LinkManager );

    } );

    it( 'is a transform stream', function() {

        expect( new LinkManager() ).toBeA( stream.Transform );

    } );

    it( 'outputs string urls written to it', function() {

        const linkManager = new LinkManager();

        linkManager.write( 'http://www.bbc.co.uk/' );
        linkManager.end( 'http://www.theregister.co.uk/' );

        return collect( linkManager )
            .then( data => {

                expect( data ).toEqual( [
                    { uri: urlUtils.parse( 'http://www.bbc.co.uk/' ) },
                    { uri: urlUtils.parse( 'http://www.theregister.co.uk/' ) },
                ] );

            } );


    } );

    it( 'outputs object urls written to it', function() {

        const linkManager = new LinkManager();

        linkManager.write( urlUtils.parse( 'http://www.bbc.co.uk/' ) );
        linkManager.end( urlUtils.parse( 'http://www.theregister.co.uk/' ) );

        return collect( linkManager )
            .then( data => {

                expect( data ).toEqual( [
                    { uri: urlUtils.parse( 'http://www.bbc.co.uk/' ) },
                    { uri: urlUtils.parse( 'http://www.theregister.co.uk/' ) },
                ] );

            } );


    } );

    it( 'emits an error if an invalid object is written', function() {

        const linkManager = new LinkManager();
        const spy = expect.createSpy();

        linkManager.on( 'error', spy );

        linkManager.end( { foo: 'bar' } );

        expect( spy ).toHaveBeenCalled();

        const error = spy.calls[0].arguments[0];

        expect( error ).toBeAn( Error );
        expect( error.message ).toEqual( 'not a valid url' );
        expect( error.url ).toEqual( { foo: 'bar' } );

    } );

    it( 'removes the hash from urls', function() {

        const linkManager = new LinkManager();

        linkManager.write( 'http://www.bbc.co.uk/1/#test' );
        linkManager.end( urlUtils.parse( 'http://www.bbc.co.uk/2/#test' ) );

        return collect( linkManager )
            .then( data => {

                // Due to the href property on the url we need to do it this way
                const uri1 = urlUtils.parse( 'http://www.bbc.co.uk/1/#test' );
                uri1.hash = null;

                const uri2 = urlUtils.parse( 'http://www.bbc.co.uk/2/#test' );
                uri2.hash = null;

                expect( data ).toEqual( [
                    { uri: uri1 },
                    { uri: uri2 },
                ] );

            } );


    } );

    it( 'emits link events', function() {

        const linkManager = new LinkManager();
        const spy = expect.createSpy();
        linkManager.on( 'link', spy );
        linkManager.end( 'http://www.bbc.co.uk/' );

        return collect( linkManager )
            .then( () => {
                expect( spy ).toHaveBeenCalled();

                const link = spy.calls[0].arguments[0];

                expect( link.url ).toEqual( urlUtils.parse( 'http://www.bbc.co.uk/' ) );
                expect( link.state ).toEqual( LinkManager.LINK_OK );

            } );

    } );

    it( 'filters urls that are not http(s)', function() {

        const linkManager = new LinkManager();
        const spy = expect.createSpy();
        linkManager.on( 'link', spy );
        linkManager.end( 'ftp://www.bbc.co.uk/' );

        return collect( linkManager )
            .then( data => {
               
                expect( data ).toEqual( [] );
                expect( spy.calls[0].arguments[0] )
                    .toEqual( {
                        url: urlUtils.parse( 'ftp://www.bbc.co.uk/' ),
                        state: LinkManager.LINK_WRONG_PROTOCOL,
                    } );

            } );

    } );

    it( 'filters urls with no domain', function() {

        const linkManager = new LinkManager();
        const spy = expect.createSpy();
        linkManager.on( 'link', spy );
        linkManager.end( 'http://' );

        return collect( linkManager )
            .then( data => {
               
                expect( data ).toEqual( [] );
                expect( spy.calls[0].arguments[0] )
                    .toEqual( {
                        url: urlUtils.parse( 'http://' ),
                        state: LinkManager.LINK_NO_DOMAIN,
                    } );

            } );

    } );

    it( 'filters urls already visited', function() {

        const linkManager = new LinkManager();
        linkManager.write( 'http://www.bbc.co.uk/' );
        linkManager.write( 'http://www.bbc.co.uk/' );
        linkManager.end( 'http://www.bbc.co.uk/#test' );

        return collect( linkManager )
            .then( data => {

                expect( data ).toEqual( [ 
                    { uri: urlUtils.parse( 'http://www.bbc.co.uk/' ) },
                ] );

            } );

    } );

    describe( 'filter option', function() {

        it( 'filters urls with a custom sync filter', function() {

            const linkManager = new LinkManager( {

                filter: url => {
                    return url.host === 'www.bbc.co.uk';
                },

            } );

            const spy = expect.createSpy();
            linkManager.on( 'link', spy );

            linkManager.write( 'http://www.bbc.co.uk/' );
            linkManager.end( 'http://www.wikipedia.org.uk/' );

            return collect( linkManager )
                .then( data => {

                    expect( data ).toEqual( [ 
                        { uri: urlUtils.parse( 'http://www.bbc.co.uk/' ) },
                    ] );

                    expect( spy.calls[1].arguments[0] )
                        .toEqual( {
                            url: urlUtils.parse( 'http://www.wikipedia.org.uk/' ),
                            state: LinkManager.LINK_FILTERED,
                        } );

                } );

        } );

        it( 'filters urls with a custom async filter', function() {

            const linkManager = new LinkManager( {

                filter: url => {
                    return Promise.resolve( url.host === 'www.bbc.co.uk' );
                },

            } );

            const spy = expect.createSpy();
            linkManager.on( 'link', spy );

            linkManager.write( 'http://www.bbc.co.uk/' );
            linkManager.end( 'http://www.wikipedia.org.uk/' );

            return collect( linkManager )
                .then( data => {

                    expect( data ).toEqual( [ 
                        { uri: urlUtils.parse( 'http://www.bbc.co.uk/' ) },
                    ] );

                    expect( spy.calls[1].arguments[0] )
                        .toEqual( {
                            url: urlUtils.parse( 'http://www.wikipedia.org.uk/' ),
                            state: LinkManager.LINK_FILTERED,
                        } );

                } );

        } );

        it( 'emits an error if the filter returns an error', function() {

            const linkManager = new LinkManager( {

                filter: () => {
                    return Promise.reject( new Error( 'error' ) );
                },

            } );

            linkManager.write( 'http://www.bbc.co.uk/' );
            linkManager.end( 'http://www.wikipedia.org.uk/' );

            return collect( linkManager )
                .then( () => {

                    throw new Error( 'Should not have been called' );
                        
                } )
                .catch( e => {

                    expect( e.message ).toBe( 'error' );

                } );

        } );

    } );

    describe( 'datastore option', function() {

        it( 'saves visited urls to the supplied datastore', function() {

            const spy = expect.createSpy().andReturn( Promise.resolve() );

            const linkManager = new LinkManager( {

                datastore: {
                    setQueued: spy,
                    isQueued: () => Promise.resolve( false ),
                },

            } );

            linkManager.end( 'http://www.bbc.co.uk/' );

            return collect( linkManager )
                .then( data => {
                    
                    expect( data ).toEqual( [ 
                        { uri: urlUtils.parse( 'http://www.bbc.co.uk/' ) },
                    ] );

                    expect( spy ).toHaveBeenCalled();
                    expect( spy.calls[0].arguments[0] ).toEqual( 'http://www.bbc.co.uk/' );
                     
                } );
                

        } );

        it( 'reads visited urls to the supplied datastore', function() {

            const spy = expect.createSpy().andReturn( Promise.resolve( true ) );

            const linkManager = new LinkManager( {

                datastore: {
                    setQueued: () => Promise.resolve(),
                    isQueued: spy,
                },

            } );

            linkManager.end( 'http://www.bbc.co.uk/' );

            return collect( linkManager )
                .then( data => {
                    
                    expect( data ).toEqual( [] );

                    expect( spy ).toHaveBeenCalled();
                    expect( spy.calls[0].arguments[0] ).toEqual( 'http://www.bbc.co.uk/' );
                     
                } );
                

        } );

        it( 'emits an error if the datastore.setQueued returns an error', function() {


            const linkManager = new LinkManager( {

                datastore: {
                    setQueued: () => Promise.reject( new Error( 'error' ) ),
                    isQueued: () => Promise.resolve( false ),
                },

            } );

            linkManager.end( 'http://www.bbc.co.uk/' );

            return collect( linkManager )
                .then( () => {
                    throw new Error( 'Should not have been called' );
                } )
                .catch( e => {
                    
                    expect( e.message ).toEqual( 'error' );
                     
                } );
                

        } );

        it( 'emits an error if the datastore.isQueued returns an error', function() {


            const linkManager = new LinkManager( {

                datastore: {
                    setQueued: () => Promise.resolve( false ),
                    isQueued: () => Promise.reject( new Error( 'error' ) ),
                },

            } );

            linkManager.end( 'http://www.bbc.co.uk/' );

            return collect( linkManager )
                .then( () => {
                    throw new Error( 'Should not have been called' );
                } )
                .catch( e => {
                    
                    expect( e.message ).toEqual( 'error' );
                     
                } );
                

        } );

    } );


} );