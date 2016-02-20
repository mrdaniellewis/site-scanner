/**
 *  Queues and performs http requests
 */
'use strict';

const stream = require( 'stream' );
const Url = require( 'url' );

const debug = require( 'debug' )( 'site-scanner:requester' );
const request = require( 'request' );

const Response = require( './response' );
const Datastore = require( './datastores/datastore' );

module.exports = class extends stream.Transform {

    /**
     *  @param {Integer} [options.highWaterMark=5] The number of parallel requests to run
     */
    constructor( options ) {
        
        const _options = options || {};
        const highWaterMark = _options.highWaterMark || 5;

        super( { objectMode: true, highWaterMark } );

        this.request = request.defaults( {
            followRedirect: false,
            jar: true,
            time: true,
            headers: _options.headers || {},
        } );

        if ( _options.init ) {
            _options.init.call( this );
        }

    }

    _transform( options, encoding, callback ) {


        debug( 'transform', options, this._writableState.length );

        this.request( options )
            .on( 'error', e => {
                this.emit( 'error', e );
            } )
            .on( 'response', content => {
                
                debug( 'response', options );

                content.pause();
                // content.setMaxListeners( 15 );

                const response = new Response( content );

                callback( null, response );

            } );
    }

};

if ( debug.enabled ) {
    const _write = module.exports.prototype.write;
    module.exports.prototype.write = function( data ) {
        debug( 'write', data );
        _write.call( this, data );
    };
}


