/**
 *  Parse the html
 */
'use strict';

const urlUtils = require( 'url' );

const debug = require( 'debug' )( 'site-scanner:parse-html-links' );
const htmlparser = require( 'htmlparser2' );
const promiseUtil = require( 'promise-util' );

function findLinks( options ) {

    const body = options.body;
    const processLink = options.processLink;
    const url = options.url;

    const parser = new htmlparser.Stream( {   
        lowerCaseAttributeNames: true, 
        decodeEntities: true,
    } );

    let base;
    const links = [];
    const promise = promiseUtil.defer();

    parser.on( 'opentag', ( name, attributes ) => {

        switch ( name ) {

            case 'base':

                if ( !base ) {
                    base = attributes.href;
                }

                break;

            case 'a':
            case 'area':

                if ( 'href' in attributes ) {

                    links.push( {
                        url: attributes.href,
                        source: {
                            nodeName: name,
                            attributes,
                        },
                    } );

                }

                break;

            case 'img':

                links.push( {
                    url: attributes.src,
                    source: {
                        nodeName: name,
                        attributes,
                    },
                } );

                break;
  
            case 'link': {

                links.push( {
                    url: attributes.href,
                    source: {
                        nodeName: name,
                        attributes,
                    },
                } );

                break;

            }

            case 'script':

                if ( 'src' in attributes ) {
                    links.push( {
                        url: attributes.src,
                        source: {
                            nodeName: name,
                            attributes,
                        },
                    } );
                }

                break;

            case 'iframe':

                if ( 'src' in attributes ) {
                    links.push( {
                        url: attributes.src,
                        source: {
                            nodeName: name,
                            attributes,
                        },
                    } );
                }

                break;

            case 'form':

                links.push( {
                    url: attributes.action || '',
                    source: {
                        nodeName: 'form',
                        attributes,
                    },
                } );

                break;
        }
    } );

    // Wait until the end as the base tag can occur anywhere
    parser.on( 'end', () => {

        const filteredLinks = links
            .filter( link => link.url )
            .map( link => { 
                link.source.base = base;
                link.source.url = url;
                link.source.type = 'html';
                link.url = urlUtils.resolve( base || url, link.url );
                return link;       
            } )
            .map( link => promiseUtil.coroutine( processLink, link ) );

        Promise.all( filteredLinks )
            .then( promise.resolve, promise.reject );

    } );

    parser.end( body );

    return promise;

}

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
    function *processLink( reference ) {
   
        yield dataStore.addReference( reference );

        if ( !( yield filter( reference ) ) ) {
            return;
        }

        yield linkManager.add( reference.url );
    }

    return function( response ) {

        if ( response.statusCode !== 200 || response.contentType !== 'text/html' ) {

            debug( 'not a valid status code or contentType', response.url, response.statusCode, response.contentType );

            return response;
        }

        response.onDownload( () => {
            return findLinks( {
                body: response.body,
                processLink,
                url: response.url,
            } );
        } );

        return response;

    };

};
