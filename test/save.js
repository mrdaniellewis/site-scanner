'use strict';

const urlUtils = require( 'url' );

const expect = require( 'expect' );

const save = require( '../lib/actions/save' );
const Response = require( '../lib/response' );

const mockIncoming = require( './util/mock-incoming' );

describe( 'save', function() {
    
    it( 'is a function', function() {

        expect( save ).toBeA( Function );

    } );

    it( 'returns a function', function() {

        expect( save() ).toBeA( Function );

    } );

    it( 'returns the response object', function() {

        const incoming = mockIncoming( {
            statusCode: 200,
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
        } );

        const response = new Response( incoming );

        expect( save()( response ) ).toBe( response );

    } );

    it( 'saves to the supplied dataStore', function() {

        const incoming = mockIncoming( {
            statusCode: 200,
            request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
        } );

        const response = new Response( incoming );

        const dataStore = {
            addResponse() {},
        };

        const spy = expect.spyOn( dataStore, 'addResponse' )
            .andReturn( Promise.resolve() );

        return save( { dataStore } )( response )
            .resume()
            .then( () => {
                expect( spy ).toHaveBeenCalledWith( response );
            } );


    } );

} );