'use strict';

const urlUtils = require( 'url' );

const expect = require( 'expect' );

const Datastore = require( '../lib/datastore' );
const Response = require( '../lib/response' );

const mockIncoming = require( './util/mock-incoming' );

describe( 'Datastore', function() {

    it( 'is a function', function() {

        expect( Datastore ).toBeA( Function );

    } );

    it( 'is initiates a Datastore instance', function() {

        expect( new Datastore() ).toBeA( Datastore );

    } );

    it( 'saves references to an array', function() {

        const datastore = new Datastore();
        const value = {};

        return datastore.addReference( value )
            .then( () => {

                expect( datastore.references ).toEqual( [value] );

            } );

    } );

    it( 'saves responses to a set', function() {

        const datastore = new Datastore();
        const incoming = mockIncoming( {
            statusCode: 200,
            statusMessage: 'OK',
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
        } );

        const response = new Response( incoming );
        response.randomValue = 'foo';

        return datastore.addResponse( response )
            .then( () => {

                expect( datastore.responses.size ).toEqual( 1 );
                const saved = datastore.responses.get( 'http://www.bbc.co.uk/' );
                expect( saved ).toNotBe( response );
                expect( saved )
                    .toEqual( {
                        url: 'http://www.bbc.co.uk/',
                        statusCode: 200,
                        statusMessage: 'OK',
                        randomValue: 'foo',
                        headers: {},
                    } );

            } );

    } );

} );