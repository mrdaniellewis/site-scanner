/**
 *	Controls requesting pages
 */
'use strict';

var URL = require('url');

var debug = require('debug')('site-scanner:controller');
var promiseUtil = require('promise-util');

module.exports = class {

	constructor( options ) {

		options = options || {};

		// Visited pages, use url as the key
		this.visited = new Map();

		// Actions to perform on a request
		this.actions = options.actions || [];

		if ( options.filter ) {
			this.filter = options.filter;
		}

		// The queue to perform requests
		this.requestQueue = options.requestQueue;

		this.count = 0;
		this.done = promiseUtil.defer();

	}

	/**
	 *	Add a location to be visited
	 *	@param {String} url Visit the URL using a GET request
	 *	@param {Object} url Visit using an object.  The object can be anything request accepts
	 */
	add( url, options ) {

		if ( typeof url === 'string' ) {
			url = {
				url: url,
				method: 'GET'
			};
		}

		var parsed = URL.parse( url.url );
		parsed.hash = null;
		url.url = URL.format(parsed);

		if ( !this.filter( url.url ) ) {
			debug( 'add', 'offsite', url.url );
			return;
		}

		if ( this.visited.has(url.url) ) {
			debug( 'add', 'visited', url.url );
			return;
		}

		this.visited.set( url.url, url );

		this._visit(url);

	}

	/**
	 *	Should the url be visited?
	 */
	filter(url) {

		return true;

	}

	/**
	 *	Visit a url and run the sequence of actions
	 */
	_visit(options) {


		debug( 'visit', options );

		++this.count;
		this.requestQueue.request( options )
			.then( response => {
				options.contentType = response.contentType;
				options.statusCode = response.statusCode;
				return response;
			})
			.then( this._sequence.bind( this, options ) )
			.then( response => {
				response.resume();
				response.on( 'end', () => { 

					debug( 'visited', options );
					--this.count;

					if ( this.count === 0 ) {
						this.done.resolve();
					}

				} );
			})
			.catch( e => {
				console.error(e);
				console.error(e.stack);
				options.error = e;
			} );
			

	}

	/**
	 *	Run the sequence of actions
	 */
	_sequence( options, response ) {

		var cursor = 0;

		var run = data => {


			if ( data === false ) {
				return response;
			}

			var fn = this.actions[cursor];

			++cursor;

			if ( !fn ) {
				return response;
			}

			return new Promise( resolve => {
					resolve( fn.call( this, options, response ) );
				} )
				.then( run );

		};

		return run(response);

	}



};