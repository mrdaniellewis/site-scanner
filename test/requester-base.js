'use strict';

const events = require( 'events' );
const urlUtils = require( 'url' );

const expect = require( 'expect' );

const Response = require( '../lib/response' );
const RequesterBase = require( '../lib/requester-base' );

const mockIncoming = require( './util/mock-incoming' );

function mockRequest() {

    const incoming = mockIncoming( {
        statusCode: 301,
        request: { uri: urlUtils.parse( 'http://www.bbc.co.uk' ) },
        headers: { location: 'http://www.bbc.co.uk/' },
    } );

    const emitter = new events.EventEmitter();

    setImmediate( () => {
        emitter.emit( 'response', incoming );
    } );

    return emitter;


}


describe( 'RequesterBase', function() {

    it( 'is a function', function() {

        expect( RequesterBase ).toBeA( Function );

    } );

    it( 'it creates a RequesterBase instance', function() {

        expect( new RequesterBase() ).toBeA( RequesterBase );

    } );

    describe( 'run', function() {

        it( 'it returns a Promise', function() {

            const requester = new RequesterBase();

            // Need to add something or it won't start
            requester.add( 'http://www.bbc.co.uk' );

            return requester.start();

        } );

        it( 'it processes requests', function() {

            const request = expect.createSpy().andCall( mockRequest );

            const requester = new RequesterBase( { request } );

            requester.add( 'http://www.bbc.co.uk' );

            return requester.start()
                .then( () => {
                    expect( request.calls.length ).toEqual( 1 );
                    expect( request ).toHaveBeenCalledWith( 'http://www.bbc.co.uk' );
                } );

        } );

        it( 'it emits a request event before a request', function() {

            const request = mockRequest;
            const requester = new RequesterBase( { request } );

            const spy = expect.createSpy();
            requester.on( 'request', spy );

            requester.add( 'http://www.bbc.co.uk' );

            return requester.start()
                .then( () => {
                    expect( spy.calls.length ).toEqual( 1 );
                    expect( spy ).toHaveBeenCalledWith( 'http://www.bbc.co.uk' );
                } );

        } );

        it( 'it emits a response event after a request completes', function() {

            const request = mockRequest;
            const requester = new RequesterBase( { request } );

            const spy = expect.createSpy();
            requester.on( 'response', spy );

            requester.add( 'http://www.bbc.co.uk' );

            return requester.start()
                .then( () => {
                    expect( spy.calls.length ).toEqual( 1 );
                    const response = spy.calls[0].arguments[0];
                    expect( response ).toBeA( Response );
                    expect( response.ended ).toBe( true );
                } );

        } );

    } );

} );