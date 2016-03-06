'use strict';

const expect = require( 'expect' );

const index = require( '..' );
const Requester = require( '../lib/requester' );
const RequesterBase = require( '../lib/requester-base' );
const Datastore = require( '../lib/datastore' );
const LinkManager = require( '../lib/link-manager' );
const Response = require( '../lib/response' );

describe( 'index', function() {

    it( 'exposes Requester', function() {

        expect( index.Requester ).toBe( Requester );

    } );

    it( 'exposes RequesterBase', function() {

        expect( index.RequesterBase ).toBe( RequesterBase );

    } );

    it( 'exposes Datastore', function() {

        expect( index.Datastore ).toBe( Datastore );

    } );

    it( 'exposes LinkManager', function() {

        expect( index.LinkManager ).toBe( LinkManager );

    } );

    it( 'exposes Response', function() {

        expect( index.Response ).toBe( Response );

    } );

} );