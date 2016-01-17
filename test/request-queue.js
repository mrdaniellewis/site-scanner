/**
 *	Test RequestQueue
 */
'use strict';

var http = require('http');

var expect = require('expect');

var RequestQueue = require( '../lib/request-queue' );

describe( 'RequestQueue', function() {

	it( 'is a function', function() {

		expect( RequestQueue ).toBeA( Function );

	} );

	it( 'returns a RequestQueue instance', function() {

		expect( new RequestQueue() ).toBeA( RequestQueue );

	} );

	describe( 'request', function() {

		it( 'returns a Promise', function() {

			var requestQueue = new RequestQueue();

			return requestQueue.request( { url: 'http://www.bbc.co.uk' } )
				.then( function(response) {
					expect( response ).toBeA( http.IncomingMessage );
				} );

		} );

	} );

} );