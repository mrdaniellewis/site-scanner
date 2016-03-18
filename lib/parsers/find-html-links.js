/**
 *  Parse the html
 */
'use strict';

const htmlparser = require( 'htmlparser2' );

const findCssLinks = require( './find-css-links' );

class Handler {

    constructor() {

        this.links = [];
        this.inElement = undefined;
        this.buffer = '';
    }

    onparserinit( parser ) {
        this._parser = parser;
    }

    onopentag( name, attributes ) {

        if ( attributes.style ) {
            this._styleAttribute( name, attributes.style );
        }

        switch ( name ) {

            case 'base':

                // Even though the specification says the 
                // base must be specified before any element with an
                // attribute that is a url.
                // Most browsers support putting it anywhere
                if ( !this.base ) {
                    this.base = attributes.href;  
                }

                break;

            case 'meta':

                if ( attributes['http-equiv'] 
                    && attributes['http-equiv'].toLowerCase() === 'refresh'
                    && attributes.content ) {

                    const url = /^\d+;\s*(url\s*=)?\s*(.+)$/i.exec( attributes.content.trim() );
                    if ( url ) {
                        this.links.push( {
                            url: url[2],
                            attr: 'content',
                            attributes: attributes,
                            nodeName: name,
                            index: this._parser.startIndex,
                            type: 'meta-refresh',
                        } );
                    }

                }

                break;

            case 'a':
            case 'area':
            case 'link':

                if ( 'href' in attributes ) {

                    this.links.push( {
                        url: attributes.href,
                        attr: 'href',
                        attributes: attributes,
                        nodeName: name,
                        index: this._parser.startIndex,
                    } );

                }

                break;

            case 'img':
            case 'source':

                this.links.push( {
                    url: attributes.src,
                    attr: 'src',
                    attributes: attributes,
                    nodeName: name,
                    index: this._parser.startIndex,
                } );

                if ( attributes.srcset ) {

                    attributes.srcset.split( ',' )
                        .forEach( src => {
                            
                            const srcparts = src.trim().split( /\s+/ );

                            this.links.push( {
                                url: srcparts[0],
                                descriptor: srcparts[1] || '',
                                attr: 'srcset',
                                attributes: attributes,
                                nodeName: name,
                                index: this._parser.startIndex,
                            } );
                        } );
                }

                break;
  
            case 'script':

                if ( 'src' in attributes ) {
                    this.links.push( {
                        url: attributes.src,
                        attr: 'src',
                        attributes: attributes,
                        nodeName: name,
                        index: this._parser.startIndex,
                    } );
                }

                break;

            case 'iframe':

                if ( 'src' in attributes ) {
                    this.links.push( {
                        url: attributes.src,
                        attr: 'src',
                        attributes: attributes,
                        nodeName: name,
                        index: this._parser.startIndex,
                    } );
                }

                break;

            case 'form':

                this.links.push( {
                    url: attributes.action || '',
                    attr: 'action',
                    attributes: attributes,
                    nodeName: name,
                    index: this._parser.startIndex,
                } );

                break;

            case 'input':

                if ( attributes.src && attributes.type === 'image' ) {

                    this.links.push( {
                        url: attributes.src,
                        attr: 'src',
                        attributes: attributes,
                        nodeName: name,
                        index: this._parser.startIndex,
                    } );

                }

                if ( attributes.formaction && attributes.type && /^image|submit$/.test( attributes.type ) ) {

                    this.links.push( {
                        url: attributes.formaction,
                        attr: 'formaction',
                        attributes: attributes,
                        nodeName: name,
                        index: this._parser.startIndex,
                    } );

                }

                break;

            case 'button':


                if ( attributes.formaction && attributes.type === 'submit' ) {

                    this.links.push( {
                        url: attributes.formaction,
                        attr: 'formaction',
                        attributes: attributes,
                        nodeName: name,
                        index: this._parser.startIndex,
                    } );

                }

                break;

            case 'style':
                this.inElement = {
                    name,
                    attributes,
                    index: this._parser.startIndex,
                };
                this.buffer = '';
                break;   
        }

    }

    _styleAttribute( name, value ) {

        findCssLinks( 'x{ ' + value + '}' )
            .forEach( link => {
                
                const save = {
                    url: link.url,
                    attr: 'style',
                    property: link.property,
                    nodeName: name,
                    index: this._parser.startIndex,
                    type: 'style-attribute',
                };

                this.links.push( save );
            } );
        
    }

    onclosetag( name ) {

        switch ( name ) {

            case 'style': {

                const isCss = this.buffer 
                    && this.inElement 
                    && this.inElement.name === 'style' 
                    && ( !this.inElement.attributes.type 
                        || this.inElement.attributes.type.toLowerCase() === 'text/css' 
                    );

                if ( isCss ) {
                    findCssLinks( this.buffer )
                        .forEach( link => {
                            link.index = this.inElement.index;
                            link.nodeName = this.inElement.name;
                            link.attributes = this.inElement.attributes;
                            link.type = 'style-element';
                            this.links.push( link );
                        } );
                }

                this.inElement = null;

                break;
            }


        }

    }

    ontext( text ) {

        if ( this.inElement ) {
            this.buffer += text;
        }

    }

}

function lineColFromIndex( link, body ) {

    const slice = body.slice( 0, link.index );
    const regex = /\n/g;
    let line = 1;
    while ( regex.exec( slice ) ) {
        ++line;
    }
    const column = slice.length - regex.lastIndex + 1;

    delete link.index;

    if ( link.line ) {
        if ( link.line === 1 ) {
            link.column += column;
        }
        link.line += line - 1;
    } else {
        link.line = line;
        link.column = column;
    }

    return link;
}


module.exports = function( body ) {

    const handler = new Handler();
    const parser = new htmlparser.Parser( handler, {   
        lowerCaseAttributeNames: true, 
        decodeEntities: true,
    } );

    parser.write( body );

    return handler.links
        .filter( link => link.url !== undefined )
        .map( link => lineColFromIndex( link, body ) )
        .map( link => {
            link.base = handler.base;
            return link;
        } );

};