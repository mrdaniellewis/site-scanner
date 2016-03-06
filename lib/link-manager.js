/**
 *  Determines if a link should be visited
 */

'use strict';

const events = require( 'events' );
const urlUtils = require( 'url' );

const queue = require( './queue' );

const debug = require( 'debug' )( 'site-scanner:link-manager' );

module.exports = class extends events.EventEmitter {

    constructor( options ) {

        super();

        this.visited = options && options.visited || new Set();
        this.filter = options && options.filter || ( () => true );
        this.requester = options && options.requester || {
            add: () => {},
        };

        this._fifo = queue.fifo();

    }

    add( requestOptions ) {
        return this._fifo( () => {
            return queue.coroutine( 
                this._run.bind( this ), 
                requestOptions 
            );
        } );
    }

    /**
     *  The series of things to do for each requested url
     */
    *_run( requestOptions ) {

        debug( '_run', requestOptions );

        let url;

        if ( typeof requestOptions === 'string' ) {
            url = urlUtils.parse( requestOptions );
        } else {
            url = urlUtils.parse( requestOptions.uri || requestOptions.url );
        }

        // Not interested in the hash
        url.hash = null;

        if ( !/^https?/.test( url.protocol ) ) {
            // Must be https?

            debug( 'not https?', requestOptions );

            return null;
        }

        if ( !url.host ) {
            // Must have a host

            debug( 'no host', requestOptions );

            return null;
        }

        if ( yield this.visited.has( url.format() ) ) {

            debug( 'already visited', requestOptions );

            return null;
        }
    
        const include = yield this.filter( url );
        if ( !include ) {

            debug( 'filtered out', requestOptions );

            return null;
        }

        yield this.visited.add( url.format() );

        debug( 'add', requestOptions );

        this.requester.add( requestOptions );
    }

};