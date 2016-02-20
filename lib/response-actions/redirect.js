/**
 *  Handle redirects
 */
'use strict';

const Url = require( 'url' );
const stream = require( 'stream' );

const debug = require( 'debug' )( 'site-scanner:redirect' );

// Status codes that should request in a redirect
const redirectStatusCodes = [300, 301, 302, 303, 307, 308];

module.exports = function( options ) {

    const maxRedirects = options.maxRedirects || 20;
    
    return new stream.Transform( {

        objectMode: true,

        transform( response, encoding, callback ) {           

            debug( 'transform', response.formattedUrl );

            if ( redirectStatusCodes.indexOf( response.statusCode ) === -1 ) {
                
                debug( 'transform', 'no-redirect', response.statusCode );

                callback( null, response );
                return;
            }

            if ( !response.contents.headers.location && response.statusCode !== 300 ) {
                
                callback( new Error( 'Location field missing' ) );
                return;
            }

            const url = Url.resolve( response.url, response.contents.headers.location );

            options.linkManager.write( url );
            
            options.datastore.addReference( {
                url,
                source: {
                    type: 'location-header',
                    url: response.url,
                    statusCode: response.statusCode,
                },
            } )
                .then( () => {
                    callback( null, response );
                } )
                .catch( e => {
                    this.emit( 'error', e );
                } );

        },

    } );


};