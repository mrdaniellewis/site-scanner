'use strict';

const findMeta = require( '../lib/parsers/find-meta' );

const expect = require( 'expect' );

describe( 'findMeta', function() {

    it( 'is a function', function() {

        expect( findMeta ).toBeA( Function );

    } );

    describe( '<title>', function() {

        it( 'finds the title', function() {

            const meta = findMeta( '<title>My title</title>' );

            expect( meta ).toEqual( {
                title: 'My title',
            } );

        } );

        it( 'Only finds the first title', function() {

            const meta = findMeta( '<title>My title</title><title>Second title</title>' );

            expect( meta ).toEqual( {
                title: 'My title',
            } );

        } );

    } );

    describe( '<meta>', function() {

        it( 'finds the meta', function() {

            const meta = findMeta( `
                <meta name="keywords" content="foo, bar" />
                <meta name="og:type" content="website" />
            ` );

            expect( meta ).toEqual( {
                keywords: 'foo, bar',
                'og:type': 'website',
            } );

        } );

        it( 'ignores meta charset', function() {

            const meta = findMeta( '<meta charset="utf-8" />' );

            expect( meta ).toEqual( {} );

        } );

    } );

} );