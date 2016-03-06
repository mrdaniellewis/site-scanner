/**
 *  Handle redirects
 */
'use strict';

const urlUtils = require( 'url' );

const debug = require( 'debug' )( 'site-scanner:redirect' );

// Status codes that should request in a redirect
const redirectStatusCodes = [300, 301, 302, 303, 307, 308];

module.exports = function( options ) {

    const dataStore = options && options.dataStore || {
        addReference() {
            return Promise.resolve();
        },
    };

    const linkManager = options && options.linkManager || {
        add() {
            return Promise.resolve();
        },
    };

    return function( response ) {

        debug( response.url );

        if ( redirectStatusCodes.indexOf( response.statusCode ) === -1 ) {
                    
            debug( 'no-redirect', response.statusCode );

            return response;
        }

        if ( !response.headers.location && response.statusCode !== 300 ) {
        
            debug( 'no-location-header', response.statusCode );

            throw new Error( 'Location header missing' );

        }

        const location = response.headers.location;
        const url = urlUtils.resolve( response.url, location );

        const reference = {
            url,
            source: {
                type: 'http',
                url: response.url,
                statusCode: response.statusCode,
                header: 'location',
                value: location,
            },
        };

        debug( 'redirect', url );

        return dataStore.addReference( reference )
            .then( () => linkManager.add( url ) )
            .then( () => response );
          
    };

};