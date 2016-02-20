/**
 *  Save the response to the database
 *
 *  This acts as a sink
 */
'use strict';

const stream = require( 'stream' );

const debug = require( 'debug' )( 'site-scanner:save' );

module.exports = function( options ) {

    return new stream.Transform( {

        objectMode: true,

        transform( response, encoding, callback ) {

            response.contents
                .on( 'end', () => {

                    if ( debug.enabled ) {
                        debug( Object.assign( response, { contents: undefined } ) );
                    }

                    options.datastore.addResponse( response )
                        .then( () => {
                            callback();
                        } )
                        .catch( callback );

                } );

            response.contents.resume();

            this.push( response );

        },

    } );

};