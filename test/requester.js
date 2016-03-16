'use strict';

const events = require( 'events' );
const urlUtils = require( 'url' );

const expect = require( 'expect' );

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

    describe( 'events', function() {

        it( 'it passes on link events', function() {

            const request = mockRequest();
            const spy = expect.createSpy();
            const requester = new Requester( { request } );
            requester.on( 'link', spy );

            requester.linkManager.add( 'http://www.bbc.co.uk/' )
                .then( () => requester.start() )
                .then( () => {
                    expect( spy ).toHaveBeenCalledWith( {
                        status: 'added',
                        url: 'http://www.bbc.co.uk/',
                    } );
                } );

        } );

    } );

} );