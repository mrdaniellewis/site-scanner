'use strict';

const urlUtils = require( 'url' );

const debug = require( 'debug' )( 'site-scanner:parse-css-links' );

const findCssLinks = require( '../parsers/find-css-links' );

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

    // Filter links before they go into the queue
    const filter = options && options.filter || ( () => true );

    // Process a link
    function findLinks( response ) {
   
        const links = findCssLinks( response.body )
            .map( link => {
                return {
                    url: urlUtils.resolve( response.url, link.url ),
                    source: Object.assign( link, { 
                        type: 'css',
                        resource: response.url,
                    } ),
                };
            } );

        dataStore.addReference( links );

        const saved = links
            .filter( ref => filter( ref ) )
            .map( ref => linkManager.add( ref.url ) );

        return Promise.all( saved );

    }

    return function( response ) {

        if ( response.statusCode !== 200 || response.contentType !== 'text/css' ) {

            debug( 'not a valid status code or contentType', response.url, response.statusCode, response.contentType );

            return response;
        }

        response.onDownload( findLinks ); 

        return response;

    };
    
};