'use strict';

const urlUtils = require( 'url' );

const expect = require( 'expect' );

const LinkManager = require( '../lib/link-manager' );

describe( 'LinkManager', function() {
    
    it( 'is a function', function() {

        expect( LinkManager ).toBeA( Function );

    } );

    it( 'creates a linkManger instance', function() {

        expect( new LinkManager() ).toBeA( LinkManager );

    } );

    describe( 'valid links', function() {

        it( 'writes the supplied url to requester', function() {

            const add = expect.createSpy();
            const requester = { add };
            const linkManager = new LinkManager( { requester } );

            return linkManager.add( 'http://www.bbc.co.uk/' )
                .then( () => {
                    expect( add ).toHaveBeenCalledWith( 'http://www.bbc.co.uk/' );
                } );

        } );

        it( 'emits an event', function() {

            const spy = expect.createSpy();

            const linkManager = new LinkManager();
            linkManager.on( 'link', spy );

            return linkManager.add( 'http://www.bbc.co.uk/' )
                .then( () => {
                    expect( spy ).toHaveBeenCalledWith( {
                        status: 'added',
                        url: 'http://www.bbc.co.uk/',
                    } );
                } );

        } );

    } );

    describe( 'invalid links', function() {

        describe( 'links without the https? protocol', function() {
           
            it( 'filters links', function() {

                const add = expect.createSpy();
                const requester = { add };
                const linkManager = new LinkManager( { requester } );

                return Promise.all( [
                    linkManager.add( 'ftp://www.bbc.co.uk/' ),
                    linkManager.add( 'http://www.bbc.co.uk/' ),
                    linkManager.add( 'https://www.bbc.co.uk/' ),
                ] )
                    .then( () => {
                        
                        expect( add.calls )
                            .toEqual( [
                                { context: { add }, arguments: ['http://www.bbc.co.uk/'] },
                                { context: { add }, arguments: ['https://www.bbc.co.uk/'] },
                            ] );
                    } );

            } );

            it( 'emits an event', function() {

                const spy = expect.createSpy();

                const linkManager = new LinkManager();
                linkManager.on( 'link', spy );

                return linkManager.add( 'ftp://www.bbc.co.uk/' )
                    .then( () => {
                        expect( spy ).toHaveBeenCalledWith( {
                            status: 'not http',
                            url: 'ftp://www.bbc.co.uk/',
                        } );
                    } );

            } );

        } );

        describe( 'links without a host', function() {

            it( 'filters links', function() {

                const add = expect.createSpy();
                const requester = { add };
                const linkManager = new LinkManager( { requester } );


                return Promise.resolve( linkManager.add( 'http://' ) )
                    .then( () => {
                        expect( add ).toNotHaveBeenCalled();
                    } );

            } );

            it( 'emits an event', function() {

                const spy = expect.createSpy();

                const linkManager = new LinkManager();
                linkManager.on( 'link', spy );

                return linkManager.add( 'http://' )
                    .then( () => {
                        expect( spy ).toHaveBeenCalledWith( {
                            status: 'no host',
                            url: 'http://',
                        } );
                    } );

            } );

        } );

        describe( 'links already visited', function() {

            it( 'filters links', function() {

                const add = expect.createSpy();
                const requester = { add };
                const linkManager = new LinkManager( { requester } );

                return Promise.all( [
                    linkManager.add( 'http://www.bbc.co.uk/' ),
                    linkManager.add( 'http://www.bbc.co.uk/' ),
                    linkManager.add( 'http://www.bbc.co.uk/#test' ),
                ] )
                    .then( () => {
                        
                        expect( add.calls )
                            .toEqual( [
                                { context: { add }, arguments: ['http://www.bbc.co.uk/'] },
                            ] );
                    } );
            } );

            it( 'emits an event', function() {

                const spy = expect.createSpy();

                const linkManager = new LinkManager();
                linkManager.on( 'link', spy );

                return Promise.all( [
                    linkManager.add( 'http://www.bbc.co.uk/' ),
                    linkManager.add( 'http://www.bbc.co.uk/' ),

                ] )
                    .then( () => {
                        expect( spy ).toHaveBeenCalledWith( {
                            status: 'already visited',
                            url: 'http://www.bbc.co.uk/',
                        } );
                    } );

            } );

        } );

        describe( 'links using a custom filter', function() {

            it( 'emits an event', function() {

                const add = expect.createSpy();
                const requester = { add };
                const filter = x => x.host === 'www.bbc.co.uk';
                const linkManager = new LinkManager( { requester, filter } );

                return Promise.all( [
                    linkManager.add( 'http://www.bbc.co.uk/' ),
                    linkManager.add( 'http://gov.uk/' ),
                ] )
                    .then( () => {
                        
                        expect( add.calls )
                            .toEqual( [
                                { context: { add }, arguments: ['http://www.bbc.co.uk/'] },
                            ] );
                    } );

            } );

            it( 'emits an event', function() {

                const spy = expect.createSpy();
                const filter = x => x.host === 'www.bbc.co.uk';
                const linkManager = new LinkManager( { filter } );

                linkManager.on( 'link', spy );

                linkManager.add( 'http://gov.uk/' )
                    .then( () => {
                        expect( spy ).toHaveBeenCalledWith( {
                            status: 'custom filter',
                            url: 'http://gov.uk/',
                        } );
                    } );

            } );

        } );

        describe( 'alternative ways of specifying links', function() {

            it( 'allows links to be specified as a string url property', function() {

                const add = expect.createSpy();
                const requester = { add };
                const filter = x => x.host === 'www.bbc.co.uk';
                const linkManager = new LinkManager( { requester, filter } );

                return Promise.all( [
                    linkManager.add( { url: 'http://www.bbc.co.uk/' } ),
                    linkManager.add( { url: 'http://www.bbc.co.uk/#test' } ),
                    linkManager.add( { url: 'http://gov.uk/' } ),
                ] )
                    .then( () => {
                        expect( add ).toHaveBeenCalledWith( 
                            { url: 'http://www.bbc.co.uk/' }
                        );
                    } );

            } );

            it( 'allows links to be specified as a string uri property', function() {

                const add = expect.createSpy();
                const requester = { add };
                const filter = x => x.host === 'www.bbc.co.uk';
                const linkManager = new LinkManager( { requester, filter } );

                return Promise.all( [
                    linkManager.add( { uri: 'http://www.bbc.co.uk/' } ),
                    linkManager.add( { uri: 'http://www.bbc.co.uk/#test' } ),
                    linkManager.add( { uri: 'http://gov.uk/' } ),
                ] )
                    .then( () => {
                        expect( add ).toHaveBeenCalledWith( 
                            { uri: 'http://www.bbc.co.uk/' }
                        );
                    } );

            } );

            it( 'allows links to be specified as an object url property', function() {

                const add = expect.createSpy();
                const requester = { add };
                const filter = x => x.host === 'www.bbc.co.uk';
                const linkManager = new LinkManager( { requester, filter } );

                return Promise.all( [
                    linkManager.add( { url: urlUtils.parse( 'http://www.bbc.co.uk/' ) } ),
                    linkManager.add( { url: urlUtils.parse( 'http://www.bbc.co.uk/#test' ) } ),
                    linkManager.add( { url: urlUtils.parse( 'http://gov.uk/' ) } ),
                ] )
                    .then( () => {
                        expect( add ).toHaveBeenCalledWith( 
                            { url: urlUtils.parse( 'http://www.bbc.co.uk/' ) }
                        );
                    } );

            } );

            it( 'allows links to be specified as an object uri property', function() {

                const add = expect.createSpy();
                const requester = { add };
                const filter = x => x.host === 'www.bbc.co.uk';
                const linkManager = new LinkManager( { requester, filter } );

                return Promise.all( [
                    linkManager.add( { uri: urlUtils.parse( 'http://www.bbc.co.uk/' ) } ),
                    linkManager.add( { uri: urlUtils.parse( 'http://www.bbc.co.uk/#test' ) } ),
                    linkManager.add( { uri: urlUtils.parse( 'http://gov.uk/' ) } ),
                ] )
                    .then( () => {
                        expect( add ).toHaveBeenCalledWith( 
                            { uri: urlUtils.parse( 'http://www.bbc.co.uk/' ) }
                        );
                    } );

            } );

        } );

    } ); 

} );