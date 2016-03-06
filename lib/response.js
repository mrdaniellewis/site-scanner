/**
 *  An object holding a IncomingMessage
 */
'use strict';

const collect = require( 'stream-collect' );
const contentType = require( 'content-type' );
const iconv = require( 'iconv-lite' );

module.exports = class {
    
    constructor( response ) {

        Object.defineProperty( this, 'stream', {
            writable: true,
            value: response,
        } );

        this.statusCode = response.statusCode;
        this.statusMessage = response.statusMessage;
        this.url = response.request && response.request.uri.format() || '';
        this.headers = response.headers;

        this._setContentType( response.headers['content-type'] );

        Object.defineProperty( this, 'endQueue', {
            value: [],
        } );

        Object.defineProperty( this, '_collectAdded', {
            writable: true,
            value: false,
        } );

        Object.defineProperty( this, 'ended', {
            writable: true,
            value: false,
        } );

    }

    _setContentType( header ) {

        if ( !header ) {
            return;
        }

        try {
            const result = contentType.parse( header );
            this.contentType = result.type;
            this.charset = result.parameters.charset;

        } catch ( e ) {
            if ( !( e instanceof TypeError ) ) {
                throw e;
            }
        }

    }

    /**
     *  Run at the end
     *  @param {Function} fn A function that can return a Promise
     */
    onEnd( fn ) {
        this.endQueue.push( fn );
    }

    /**
     *  Run at the end, downloading contents
     *  @param {Function} fn A function that can return a Promise
     */
    onDownload( fn ) {

        if ( !this._collectAdded ) {

            collect.addToStream( this.stream );    

            this.stream.on( 'collect', body => {
                
                if ( this.charset && iconv.encodingExists( this.charset ) ) {
                    this.body = iconv.decode( body, this.charset );
                } else {
                    this.body = body;
                }
            } );

            this._collectAdded = true;
        }

        this.onEnd( fn );
    }

    /**
     *  Resume the download
     *  @returns {Promise} A promise resolving when all download actions are completed
     */
    resume() {

        return new Promise( ( resolve, reject ) => {

            this.stream
                .on( 'end', () => {
                    Promise.all( this.endQueue.map( fn => fn( this ) ) )
                        .then( () => {
                            this.ended = true;
                            resolve( this );
                        } )
                        .catch( reject );

                } )
                .on( 'error', reject );

            this.stream.resume();

        } );

    }

};