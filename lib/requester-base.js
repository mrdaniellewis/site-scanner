/**
 *  Queues and performs http requests
 */
'use strict';

const events = require( 'events' );

const debug = require( 'debug' )( 'site-scanner:requester-base' );
const request = require( 'request' );

const queue = require( './queue' );

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

        this._fifo = queue.fifo( { parallel, infinite: false } );
        this._queued = [];
        this._started = false;
    }

    /**
     *  User defined initiation function
     */
    init() {
        // Nothing to do here
    }

    add( requestOptions ) {
        debug( 'add', requestOptions );

        if ( !this._started ) {
            this._queued.push( requestOptions );
        } else {
            this._add( requestOptions );
        }
    }

    _add( requestOptions ) {
    
        debug( '_add', requestOptions );
        this._fifo( this._run.bind( this, requestOptions ) );
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
            .then( () => {
                this._started = true;
                this._queued.forEach( item => {
                    this._add( item );
                } );
                return this._fifo.done;
            } );
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

                    resolve( new Response( response ) );

                } );

        } );

        
    }

};


