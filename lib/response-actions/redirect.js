/**
 *  Handle redirects
 */
'use strict';

const URL = require( 'url' );
const stream = require( 'stream' );


// Status codes that should request in a redirect
const redirectStatusCodes = [300, 301, 302, 303, 307, 308];

module.exports = function( options ) {

    const maxRedirects = options.maxRedirects || 20;
    
    return new stream.Transform( {

        objectMode: true,

        transform( response, encoding, callback ) {

            if ( redirectStatusCodes.indexOf( response.statusCode ) === -1 ) {
                
                callback( null, response );
                return;
            }

            if ( !response.headers.location && response.statusCode !== 300 ) {
                
                callback( new Error( 'Location field missing' ) );
                return;
            }

            const linkData = {
                url: URL.resolve( response.url, response.headers.location ),
                source: {
                    type: 'location-header',
                    url: response.url,
                    statusCode: response.statusCode,
                },
            };
            options.linkManager.write( linkData );

            callback( null, response );

        },

    } );


};