/**
 *	Test RequestQueue
 */
'use strict';

var expect = require('expect');
var proxyquire =  require('proxyquire');

var RequestManager = require( '../lib/request-manager' );

describe( 'RequestQueue', function() {

	it( 'is a function', function() {

		expect( RequestManager ).toBeA( Function );

	} );

	it( 'returns a RequestQueue instance', function() {

		expect( new RequestManager() ).toBeA( RequestManager );

	} );

	/*describe( 'request', function() {

		it( 'returns a Promise', function() {

			var requestQueue = new RequestQueue();

			return requestQueue.request( { url: 'http://www.bbc.co.uk' } )
				.then( function(response) {
					expect( response ).toBeA( http.IncomingMessage );
				} );

		} );

	} );*/

} );