/**
 *  The requester hooked up to everything else
 */
'use strict';


const RequesterBase = require( './requester-base' );
const LinkManager = require( './link-manager' );

const Datastore = require( './datastore' ); 

const timing = require( './actions/timing' );
const size = require( './actions/size' );
const redirect = require( './actions/redirect' );
const htmlLinkParser = require( './actions/parse-html-links' );
const cssLinkParser = require( './actions/parse-css-links' );
const save = require( './actions/save' );

module.exports = class extends RequesterBase {

    constructor( _options ) {

        super( _options );

        const options = _options || {};

        this.actions = options.actions || this.actions;
        this.dataStore = options.dataStore || new Datastore(); 

        this.linkManager = options.linkManager || new LinkManager( {
            filter: options.filter,
            requester: this,
        } );

        // Pass through link events
        this.linkManager.on( 'link', this.emit.bind( this, 'link' ) );

        this.htmlLinkParser = htmlLinkParser( { 
            dataStore: this.dataStore,
            linkManager: this.linkManager,
        } );

        this.cssLinkParser = cssLinkParser( { 
            dataStore: this.dataStore,
            linkManager: this.linkManager,
        } );

        this.redirect = redirect( {
            dataStore: this.dataStore,
            linkManager: this.linkManager,
        } );

        this.save = save( {
            dataStore: this.dataStore,
        } );

    }
    
    *actions() {
        // Nothing to do here
    }

    *_actions( response ) {

        yield timing( response );
        yield size( response );
        yield this.redirect( response );
        yield this.htmlLinkParser( response );
        yield this.cssLinkParser( response );
        yield* this.actions( response );
        yield this.save( response );

    }

};