'use strict';

const urlUtils = require( 'url' );

const debug = require( 'debug' )( 'site-scanner:parse-css-links' );
const postcss = require( 'postcss' );
const valueParser = require( 'postcss-value-parser' );

const queue = require( '../queue' );

function iterateNode( node ) {

    let found = [];

    if ( node.type === 'atrule' && node.name === 'import' ) {

        let value = valueParser( node.params ).nodes[0];
        if ( value.type === 'function' && value.value === 'url' ) {
            value = value.nodes[0];
        }

        if ( value && value.type === 'word' || value.type === 'string' ) {
            
            return [{
                url: value.value,
                source: {
                    rule: '@import',
                },
            }];
        }

    } else if ( node.type === 'decl' ) {

        return valueParser( node.value ).nodes
            .filter( x => x.type === 'function' && x.value === 'url' )
            .map( x => ( {
                url: x.nodes[0].value,
                source: {
                },
            } ) );

    }

    if ( node.nodes ) {
        found = node.nodes.map( iterateNode )
            .reduce( ( a, b ) => a.concat( b ) );
    }

    return found;
}


function findLinks( options ) {

    const body = options.body;
    const processLink = options.processLink;
    const url = options.url;

    const root = postcss.parse( body );

    const processed = root.nodes.map( iterateNode )
        .reduce( ( a, b ) => a.concat( b ) )
        .filter( link => link.url )
        .map( link => { 
            link.source.url = url;
            link.source.type = 'css';
            link.url = urlUtils.resolve( url, link.url );
            return link;       
        } )
        .map( link => queue.coroutine( processLink, link ) );

    return Promise.all( processed );

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

        if ( response.statusCode !== 200 || response.contentType !== 'text/css' ) {

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