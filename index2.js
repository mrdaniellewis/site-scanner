/**
 *  Using a streaming model
 */
'use strict';

const stream = require( 'stream' );

const LinkManager = require( './lib/link-manager' );
const Requester = require( './lib/requester' );
const Redirect = require( './lib/response-actions/redirect' );
const ParseLinks = require( './lib/response-actions/parse-links' );
const Size = require( './lib/response-actions/size' );
const Timing = require( './lib/response-actions/timing' );

const linkManager = new LinkManager();

const requester = new Requester();

requester
    .pipe( new Redirect( { linkManager } ) )
    .pipe( new ParseLinks( { linkManager } ) )
    .pipe( new Size() )
    .pipe( new Timing() );

linkManager
    .pipe( new stream.Transform( {
        
        objectMode: true,

        transform( object, encoding, callback ) {

            if ( !object.error ) {
                
                if ( object.url.indexOf( 'https://www.citizensadvice.org.uk/' ) !== 0 ) {
                    object.error = 'offsite';
                } 
            }

            callback( null, object );

        },
 
    } ) )
    .pipe( new stream.Transform( {
        
        objectMode: true,

        transform( object, encoding, callback ) {

            if ( !object.error ) {

                linkManager.addVisited( object.url );
                this.push( object.url );
            }

            callback();

        },
 
    } ) )
    .pipe( requester );

linkManager.write( 'https://www.citizensadvice.org.uk/' );

