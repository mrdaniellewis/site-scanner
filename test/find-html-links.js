'use strict';

const findHtmlLinks = require( '../lib/parsers/find-html-links' );

const expect = require( 'expect' );

describe( 'findHtmlLinks', function() {

    it( 'is a function', function() {

        expect( findHtmlLinks ).toBeA( Function );

    } );

    describe( '<a>', function() {

        it( 'finds links', function() {

            const links = findHtmlLinks( '<a href="http://www.bbc.co.uk/" class="test">text</a>' );

            expect( links ).toEqual( [{
                url: 'http://www.bbc.co.uk/',
                nodeName: 'a',
                attr: 'href',
                attributes: { href: 'http://www.bbc.co.uk/', class: 'test' },
                base: undefined,
                line: 1,
                column: 1,
            }] );

        } );

        it( 'doesn\'t find placeholder links', function() {

            const links = findHtmlLinks( '<a>text</a>' );

            expect( links ).toEqual( [] );

        } );

    } ); 

    describe( '<area>', function() {

        it( 'finds links', function() {

            const links = findHtmlLinks( '<area href="http://www.bbc.co.uk/" class="test">text</a>' );

            expect( links ).toEqual( [{
                url: 'http://www.bbc.co.uk/',
                nodeName: 'area',
                attr: 'href',
                attributes: { href: 'http://www.bbc.co.uk/', class: 'test' },
                base: undefined,
                line: 1,
                column: 1,
            }] );

        } );

        it( 'doesn\'t find placeholder links', function() {

            const links = findHtmlLinks( '<area>text</area>' );

            expect( links ).toEqual( [] );

        } );

    } );

    describe( '<meta http-equiv="refresh">', function() {

        it( 'finds links', function() {

            const links = findHtmlLinks( '<meta http-equiv="refresh" content="0; url=test.htm">' );

            expect( links ).toEqual( [{
                url: 'test.htm',
                nodeName: 'meta',
                attr: 'content',
                attributes: { 'http-equiv': 'refresh', content: '0; url=test.htm' },
                type: 'meta-refresh',
                base: undefined,
                line: 1,
                column: 1,
            }] );

        } );

        it( 'finds links without "url="', function() {

            const links = findHtmlLinks( '<meta http-equiv="refresh" content="0; test.htm">' );

            expect( links ).toEqual( [{
                url: 'test.htm',
                nodeName: 'meta',
                attr: 'content',
                attributes: { 'http-equiv': 'refresh', content: '0; test.htm' },
                type: 'meta-refresh',
                base: undefined,
                line: 1,
                column: 1,
            }] );

        } ); 

    } ); 

    describe( '<link>', function() {

        it( 'finds links', function() {

            const links = findHtmlLinks( '<link href="http://www.bbc.co.uk/">text</a>' );

            expect( links ).toEqual( [{
                url: 'http://www.bbc.co.uk/',
                nodeName: 'link',
                attr: 'href',
                attributes: { href: 'http://www.bbc.co.uk/' },
                base: undefined,
                line: 1,
                column: 1,
            }] );

        } );

        it( 'doesn\'t find <link> with no href', function() {

            const links = findHtmlLinks( '<link>text</link>' );

            expect( links ).toEqual( [] );

        } );

    } );

    ['img', 'source'].forEach( name => {

        const htmlStart = '<' + name;

        describe( htmlStart + '>', function() {

            it( 'finds links', function() {

                const links = findHtmlLinks( htmlStart + ' src="http://www.bbc.co.uk/" />' );

                expect( links ).toEqual( [{
                    url: 'http://www.bbc.co.uk/',
                    nodeName: name,
                    attr: 'src',
                    attributes: { src: 'http://www.bbc.co.uk/' },
                    base: undefined,
                    line: 1,
                    column: 1,
                }] );

            } );

            it( 'doesn\'t find ' + htmlStart + '> with no src', function() {

                const links = findHtmlLinks( htmlStart + ' />' );

                expect( links ).toEqual( [] );

            } );

            it( 'finds srcset links', function() {

                const links = findHtmlLinks( 
                    htmlStart + ' src="http://www.bbc.co.uk/" srcset="foo.png, bar.png x2" />' 
                );

                expect( links ).toEqual( [
                    {
                        url: 'http://www.bbc.co.uk/',
                        nodeName: name,
                        attr: 'src',
                        attributes: { src: 'http://www.bbc.co.uk/', srcset: 'foo.png, bar.png x2' },
                        base: undefined,
                        line: 1,
                        column: 1,
                    },
                    {
                        url: 'foo.png',
                        nodeName: name,
                        attr: 'srcset',
                        descriptor: '',
                        attributes: { src: 'http://www.bbc.co.uk/', srcset: 'foo.png, bar.png x2' },
                        base: undefined,
                        line: 1,
                        column: 1,
                    },
                    {
                        url: 'bar.png',
                        nodeName: name,
                        attr: 'srcset',
                        descriptor: 'x2',
                        attributes: { src: 'http://www.bbc.co.uk/', srcset: 'foo.png, bar.png x2' },
                        base: undefined,
                        line: 1,
                        column: 1,
                    },
                ] );

            } );

        } );

    } );

    describe( '<script>', function() {

        it( 'finds <script> links', function() {

            const links = findHtmlLinks( '<script src="http://www.bbc.co.uk/" /><script>' );

            expect( links ).toEqual( [{
                url: 'http://www.bbc.co.uk/',
                nodeName: 'script',
                attr: 'src',
                attributes: { src: 'http://www.bbc.co.uk/' },
                base: undefined,
                line: 1,
                column: 1,
            }] );

        } );

        it( 'doesn\'t find elements with no src', function() {

            const links = findHtmlLinks( '<script>foo=1</script>' );

            expect( links ).toEqual( [] );

        } );

    } );

    describe( '<iframe>', function() {

        it( 'finds <iframe> links in the content', function() {

            const links = findHtmlLinks( '<iframe src="http://www.bbc.co.uk/" /><iframe>' );

            expect( links ).toEqual( [{
                url: 'http://www.bbc.co.uk/',
                nodeName: 'iframe',
                attr: 'src',
                attributes: { src: 'http://www.bbc.co.uk/' },
                base: undefined,
                line: 1,
                column: 1,
            }] );

        } );

        it( 'doesn\'t find elements with no src', function() {

            const links = findHtmlLinks( '<iframe></iframe>' );

            expect( links ).toEqual( [] );

        } );

    } );

    describe( '<form>', function() {

        it( 'finds <form> links', function() {

            const links = findHtmlLinks( '<form action="http://www.bbc.co.uk/"></form>' );

            expect( links ).toEqual( [{
                url: 'http://www.bbc.co.uk/',
                nodeName: 'form',
                attr: 'action',
                attributes: { action: 'http://www.bbc.co.uk/' },
                base: undefined,
                line: 1,
                column: 1,
            }] );

        } );

        it( 'finds elements with no action', function() {

            const links = findHtmlLinks( '<form></form>' );

            expect( links ).toEqual( [{
                url: '',
                nodeName: 'form',
                attr: 'action',
                attributes: {},
                base: undefined,
                line: 1,
                column: 1,
            }] );

        } );

    } );

    describe( '<input>', function() {

        it( 'finds <input type="image" src="..."> links', function() {

            const links = findHtmlLinks( '<input src="http://www.bbc.co.uk/" type="image" />' );

            expect( links ).toEqual( [{
                url: 'http://www.bbc.co.uk/',
                nodeName: 'input',
                attr: 'src',
                attributes: { src: 'http://www.bbc.co.uk/', type: 'image' },
                base: undefined,
                line: 1,
                column: 1,
            }] );

        } );

        it( 'doesn\'t find elements with a different type', function() {

            const links = findHtmlLinks( '<input src="http://www.bbc.co.uk/" type="text" />' );

            expect( links ).toEqual( [] );

        } );

        it( 'finds <input formaction="..."> links', function() {

            const links = findHtmlLinks( '<input formaction="http://www.bbc.co.uk/" type="image" />' );

            expect( links ).toEqual( [{
                url: 'http://www.bbc.co.uk/',
                nodeName: 'input',
                attr: 'formaction',
                attributes: { formaction: 'http://www.bbc.co.uk/', type: 'image' },
                base: undefined,
                line: 1,
                column: 1,
            }] );

        } );

        it( 'doesn\'t find elements with a different type', function() {

            const links = findHtmlLinks( '<input formaction="http://www.bbc.co.uk/" type="text" />' );

            expect( links ).toEqual( [] );

        } );

        
    } );

    describe( '<button>', function() {

        it( 'finds <button formaction="..."> links', function() {

            const links = findHtmlLinks( '<button formaction="http://www.bbc.co.uk/" type="submit" />' );

            expect( links ).toEqual( [{
                url: 'http://www.bbc.co.uk/',
                nodeName: 'button',
                attr: 'formaction',
                attributes: { formaction: 'http://www.bbc.co.uk/', type: 'submit' },
                base: undefined,
                line: 1,
                column: 1,
            }] );

        } );

        it( 'doesn\'t find elements with a different type', function() {

            const links = findHtmlLinks( '<input formaction="http://www.bbc.co.uk/" type="button" />' );

            expect( links ).toEqual( [] );

        } );

        
    } );

    describe( '<style>', function() {

        it( 'finds links in inline CSS', function() {

            const links = findHtmlLinks( `<style>
                @import foobar.css;
            </style>` );

            expect( links ).toEqual( [{
                url: 'foobar.css',
                nodeName: 'style',
                attributes: {},
                media: '',
                selector: '@import',
                base: undefined,
                line: 2,
                column: 17,
                type: 'style-element',
            }] );

        } );

        it( 'finds links in inline CSS with type text/css', function() {

            const links = findHtmlLinks( `<style type="text/css">
                @import foobar.css;
            </style>` );

            expect( links ).toEqual( [{
                url: 'foobar.css',
                nodeName: 'style',
                attributes: { type: 'text/css' },
                media: '',
                selector: '@import',
                base: undefined,
                line: 2,
                column: 17,
                type: 'style-element',
            }] );

        } );

        it( 'doesn\'t find links in inline CSS with other types', function() {

            const links = findHtmlLinks( `<style type="text/x-foo">
                @import foobar.css;
            </style>` );

            expect( links ).toEqual( [] );

        } );


    } );

    describe( 'style attributes', function() {

        it( 'finds links', function() {

            const links = findHtmlLinks( '<div style="background: url(foo.png)"></div>' );

            expect( links ).toEqual( [{
                url: 'foo.png',
                nodeName: 'div',
                attr: 'style',
                property: 'background',
                base: undefined,
                line: 1,
                column: 1,
                type: 'style-attribute',
            }] );

        } );

    } );

} );