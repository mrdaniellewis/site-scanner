'use strict';

const postcss = require( 'postcss' );
const valueParser = require( 'postcss-value-parser' );

function getSelectorRecursivly( node ) {

    let cursor = node;
    const selector = [];

    while ( cursor.parent ) {
        cursor = cursor.parent;

        if ( cursor.type === 'rule' ) {
            selector.unshift( cursor.selector );
        }
    }

    return selector.join( ' ' );

}

function getMediaRecursivly( node ) {

    let cursor = node;
    const selector = [];

    while ( cursor.parent ) {
        cursor = cursor.parent;

        if ( cursor.type === 'atrule' ) {
            selector.unshift( '@' + cursor.name + ' ' + cursor.params );
        }
    }
    
    if ( selector.length > 1 ) {
        return selector.join( ' { ' ) + Array( selector.length - 1 ).fill( ' }' ).join( '' );
    }

    return selector[0] || '';

}

function iterateNode( node ) {

    if ( node.type === 'atrule' && node.name === 'import' ) {

        const values = valueParser( node.params );
        let value = values.nodes[0];

        if ( value.type === 'function' && value.value === 'url' ) {
            value = value.nodes[0];
        }

        if ( value && value.type === 'word' || value.type === 'string' ) {
            
            return [{
                url: value.value,
                selector: '@import',
                media: values.nodes.slice( 1 ).map( x => x.value ).join( ' ' ).trim(),
                line: node.source.start.line,
                column: node.source.start.column,
            }];
        }

    } else if ( node.type === 'decl' ) {

        return valueParser( node.value ).nodes
            .filter( x => x.type === 'function' && x.value === 'url' )
            .map( x => ( {
                url: x.nodes[0].value,
                selector: getSelectorRecursivly( node ),
                property: node.prop,
                media: getMediaRecursivly( node ),
                line: node.source.start.line,
                column: node.source.start.column,
            } ) );

    }

    if ( node.nodes ) {    
        return node.nodes.map( iterateNode )
            .reduce( ( a, b ) => a.concat( b ) ); 
    }

    return [];
}


/**
 * Returns an array of CSS links
 */
module.exports = function( body ) {

    const root = postcss.parse( body );

    return iterateNode( root )
        .filter( link => link.url );  

};