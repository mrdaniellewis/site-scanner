/**
 *  Queues and performs http requests
 */
'use strict';

const stream = require( 'stream' );

const debug = require( 'debug' )( 'site-scanner:requester' );
const request = require( 'request' );

const Response = require( './response' );

module.exports = class extends stream.Transform {

    /**
     *  @param {Integer} [options.highWaterMark=5] The number of parallel requests to run
     */
    constructor( options ) {
        
        const _options = options || {};
        const highWaterMark = _options.highWaterMark || 5;

        super( { objectMode: true, highWaterMark } );

        this._request = request.defaults( {
            followRedirect: false,
            jar: true,
            time: true,
            headers: _options.headers || {},
        } );

    }

    _transform( options, encoding, callback ) {

        this._request( options )
            .on( 'error', e => {
                this.emit( 'error', e );
            } )
            .on( 'response', content => {
                
                debug( 'response', options );

                content.pause();
                content.setMaxListeners( 15 );

                const response = new Response( { content } );

                callback( null, response );

            } );

    }

};
