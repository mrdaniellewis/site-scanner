/**
 *	@fileoverview
 *
 *	Queues and dispatches requests
 */
'use strict';

var contentType = require('content-type');
var debug = require('debug')('site-scanner:request-queue');

var request = require('request');
var promiseUtil = require('promise-util');


module.exports = class {

	/**
	 *	@param {Integer} [options.parallel=0] The number of parallel requests to run
	 */
	constructor( options ) {
		
		options = options || {};

		this._setupQueue(options);

		this._request = request.defaults( {
			followRedirect: false,
			jar: true,
			time: true,
			headers: options.headers || {}
		} );

	}

	_setupQueue( options ) {

		/*this._queue = [];
		this.done = new promiseUtil.Queue()
			.then( function(fn) {
				return fn();
			} )
			.catch( () => {} )
			.runSeries( this._queue, { parallel: options.parallel } );*/


		this._queue = promiseUtil.fifo(options);

	}

	/**
	 *	Queue a request
	 *	@returns {Promise<http.IncomingMessage>}
	 */
	request( options ) {

		debug( 'queueing', options );

		/*var promise = promiseUtil.defer();
		var fn = this._send.bind( this, options );

		function run() {
			new Promise( resolve => resolve(fn()) )
				.then( promise.resolve, promise.reject );
		}

		this._queue.push( run );

		return promise;*/

		return this._queue( this._send.bind( this, options ) );


	}

	_send( options ) {

		options = Object.assign( 
			{ method: 'GET' }, 
			options
		);

		return new Promise( (resolve, reject) => {

			var start = process.hrtime();

			this._request( options )
				.on( 'error', reject )
				.on( 'response', response => {
					
					response.pause();
					response.setMaxListeners(15);

					debug( 'response', options );
			
					response.timerStart = start;
					if ( response.headers['content-type'] ) {
						response.contentType = contentType.parse( response.headers['content-type'] ).type;
					}

					resolve(response);
				} );

		} );

	}
 

};