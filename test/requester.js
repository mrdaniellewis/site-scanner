'use strict';

const events = require( 'events' );
const urlUtils = require( 'url' );

const expect = require( 'expect' );

const Response = require( '../lib/response' );
const Requester = require( '../lib/requester' );

const mockIncoming = require( './util/mock-incoming' );

function mockRequest() {

    const incoming = mockIncoming( {
        statusCode: 200,
        statusMessage: 'OK',
        request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
        buffer: '<p>test</p>',
    } );

    const emitter = new events.EventEmitter();

    setImmediate( () => {
        emitter.emit( 'response', incoming );
    } );

    return emitter;
}

describe( 'Requester', function() {

    it( 'is a function', function() {

        expect( Requester ).toBeA( Function );

    } );

    it( 'it creates a RequesterBase instance', function() {

        expect( new Requester() ).toBeA( Requester );

    } );

    describe( 'run', function() {

        it( 'it processes requests', function() {

            const request = expect.createSpy().andCall( mockRequest );

            const requester = new Requester( { request } );

            requester.add( 'http://www.bbc.co.uk' );

            return requester.start()
                .then( () => {
                    expect( request.calls.length ).toEqual( 1 );
                    expect( request ).toHaveBeenCalledWith( 'http://www.bbc.co.uk' );
                } );

        } );

    } );

} );