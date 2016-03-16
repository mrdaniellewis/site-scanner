/**
 *  Queues and performs http requests
 */
'use strict';

const events = require( 'events' );

const debug = require( 'debug' )( 'site-scanner:requester-base' );
const request = require( 'request' );

const promiseUtil = require( 'promise-util' );

const Response = require( './response' );

module.exports = class extends events.EventEmitter {

    constructor( _options ) {
        
        super();

        const options = _options || {};
        const parallel = options.parallel || 5;

        this.request = options.request || request.defaults( {
            followRedirect: false,
            jar: true,
            time: true,
            headers: options.headers || {},
        } );

        if ( options.init ) {
            this.init = options.init;
        }

        this._queue = new promiseUtil.Queue( 
            this._run.bind( this ), 
            { parallel } 
        );
    }

    /**
     *  User defined initiation function
     */
    init() {
        // Nothing to do here
    }

    add( requestOptions ) {
        debug( 'add', requestOptions );
        this._queue.add( requestOptions );
    }

    /**
     *  The series of things to do for each requested url
     */
    *_run( requestOptions ) {

        // Start download
        const response = yield this._request( requestOptions );

        // Setup actions on the download
        yield* this._actions( response );

        // Download 
        yield response.resume();

        // Emit the completed download
        this.emit( 'response', response );

    }

    *_actions() {
        // To be extended by a subclass
    }

    /**
     *  Start visiting urls
     */
    start() {

        return Promise.resolve( this.init() )
            .then( () => this._queue.run() );
    }

    _request( options ) {

        debug( '_request', options );

        this.emit( 'request', options );

        return new Promise( ( resolve, reject ) => {

            this.request( options )
                .on( 'error', reject )
                .on( 'response', response => {
                    
                    debug( 'response', options );

                    response.pause();
                    // content.setMaxListeners( 15 );

                    const responseOb = new Response( response );
                    resolve( responseOb );

                    this.emit( 'response', responseOb );
                } );

        } );

        
    }

};


