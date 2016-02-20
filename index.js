/**
 *  Using a streaming model
 */
'use strict';

const Requester = require( './lib/requester' );
const LinkManager = require( './lib/link-manager' );
const Redirect = require( './lib/response-actions/redirect' );
const ParseLinks = require( './lib/response-actions/parse-links' );
const Size = require( './lib/response-actions/size' );
const Timing = require( './lib/response-actions/timing' );
const Save = require( './lib/response-actions/save' );

const DataStore = require( './lib/datastores/datastore' );

const datastore = new DataStore();

const requester = new Requester( {
    datastore,
} );

const linkManager = new LinkManager( {
    filter: url => {
        return url.host === 'www.citizensadvice.org.uk';
    },
} );

requester
    .pipe( new Redirect( { linkManager, datastore } ) )
    .pipe( new ParseLinks( { linkManager, datastore } ) )
    .pipe( new Size() )
    .pipe( new Timing() )
    .pipe( new Save( { datastore } ) );

linkManager.pipe( requester );

linkManager.write( 'https://www.citizensadvice.org.uk/' );

