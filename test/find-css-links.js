'use strict';

const findCssLinks = require( '../lib/parsers/find-css-links' );

const expect = require( 'expect' );

describe( 'findCssLinks', function() {

    it( 'is a function', function() {

        expect( findCssLinks ).toBeA( Function );

    } );

    it( 'finds token @import urls', function() {

        const links = findCssLinks( '@import foo.css' );

        expect( links ).toEqual( [{
            url: 'foo.css',
            selector: '@import',
            media: '',
            line: 1,
            column: 1,
        }] );

    } );

    it( 'finds string @import urls', function() {

        const links = findCssLinks( '@import "foo.css"' );

        expect( links ).toEqual( [{
            url: 'foo.css',
            selector: '@import',
            media: '',
            line: 1,
            column: 1,
        }] );

    } );

    it( 'finds url @import urls', function() {

        const links = findCssLinks( '@import url(foo.css)' );

        expect( links ).toEqual( [{
            url: 'foo.css',
            selector: '@import',
            media: '',
            line: 1,
            column: 1,
        }] );

    } );

    it( 'finds @import urls with media queries', function() {

        const links = findCssLinks( '@import foo.css print' );

        expect( links ).toEqual( [{
            url: 'foo.css',
            selector: '@import',
            media: 'print',
            line: 1,
            column: 1,
        }] );

    } );

    it( 'finds the line and column number', function() {

        const links = findCssLinks( '\n\n  @import foo.css' );

        expect( links ).toEqual( [{
            url: 'foo.css',
            selector: '@import',
            media: '',
            line: 3,
            column: 3,
        }] );

    } );

    it( 'finds links in property declarations', function() {

        const links = findCssLinks( `a { 
            background-image: 
                url(https://mdn.mozillademos.org/files/11305/firefox.png), 
                url(https://mdn.mozillademos.org/files/11307/bubbles.png), 
                linear-gradient(to right, rgba(30, 75, 115, 1), 
                rgba(255, 255, 255, 0)); 
        }` );

        expect( links ).toEqual( [
            {   
                url: 'https://mdn.mozillademos.org/files/11305/firefox.png',
                selector: 'a',
                property: 'background-image',
                media: '',
                line: 2,
                column: 13,
            },
            {   
                url: 'https://mdn.mozillademos.org/files/11307/bubbles.png',
                selector: 'a',
                property: 'background-image',
                media: '',
                line: 2,
                column: 13,
            },
        ] );

    } );

    it( 'finds @rules of declarations', function() {

        const links = findCssLinks( `@media print and (max-width: 100px) { 
            @media scripting {
                @supports ( position: sticky ) {
                    a { 
                        background-image: url( 'foobar.png' )
                    }
                }
            }
        }` );

        expect( links ).toEqual( [{   
            url: 'foobar.png',
            selector: 'a',
            property: 'background-image',
            media: '@media print and (max-width: 100px) { @media scripting { @supports ( position: sticky ) } }',
            line: 5,
            column: 25,
        }] );

    } );

    it( 'throws an error for invalid css', function() {

        let caught = false;
        try {
            findCssLinks( `<a href="food.bar"></a>` );
        } catch ( e ) {
            caught = true;
            expect( e.name ).toEqual( 'CssSyntaxError' );
        }

        expect( caught ).toBe( true );

    } );

} );