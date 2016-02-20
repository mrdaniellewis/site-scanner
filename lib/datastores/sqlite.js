'use strict';

const fs = require( 'fs' );
const path = require( 'path' );

const promiseUtil = require( 'promise-util' );
const sqlite = require( 'sqlite3' );

const statementPath = path.resolve( __dirname, 'sqlite' );

module.exports = class {

    constructor( options ) {

        this.options = options || {};

        this.init();
    }

    init() {
        this._db = new sqlite.Database( this.options.path || ':memory:' );

        const initSql = this._getStatement( 'init' );
        this._connection = promiseUtil.callback( this._db, 'exec', initSql )
            .then( () => {

                return this._setRun();

            } );

    }

    /**
     *  Load a SQL statement from the file system
     *  @param {String} name The name of the file
     *  @returns {String} the SQL
     */
    _getStatement( name ) {

        if ( this._statementCache.has( name ) ) {
            return this._statementCache.get( name );
        }

        let statement;

        // Just like require, this is blocking.
        try {
            statement = fs.readFileSync( path.resolve( statementPath, name ), { encoding: 'utf8' } );
        } catch ( e ) {
            if ( e.code === 'ENOENT' ) {
                // Allow for the .sql extension (again like require allows for .js and .node)
                statement = fs.readFileSync( path.resolve( statementPath, name + '.sql' ), { encoding: 'utf8' } );
            } else {
                throw e;
            }
        }

        // sqlite3 does not filter comments
        statement = statement
            .replace( /--.*$/gm, '' ) // Replace -- style comments
            .replace( /\/\*[^]*?\*\//g, '' ); // Replace C style comments

        this._statementCache.set( name, statement );

        return statement;

    }

    _run( sql, params ) {
       
        return this._connection.then( db => {
            
            return new Promise( ( resolve, reject ) => {

                db.run( sql, params, function( e ) {

                    if ( e ) {
                        reject( e );
                        return;
                    }

                    // this is how the api works!
                    resolve( this ); // eslint-disable-line no-invalid-this

                } );

            } );

        } );

    }

    /**
     *  Set the current run in the database
     */
    _setRun() {

        const sql = this._getStatement( 'set-run' );
        return this._run( sql, { $date: new Date() } )
            .then( data => {

                this.runId = data.lastID;

                return this._db;

            } );

    }

    /**
     *  Add a reference to the database
     */
    addReference( reference ) {

        const sql = this._getStatement( 'insert-reference' );

        return this._run( sql, { 
            $runId: this.runId,
            $targetUrl: reference.originalUrl,
            $source: JSON.stringify( reference.source ),
        } );
       
    }

    /**
     *  Add a result to the database
     */
    addResult( result ) {

        const sql = this._getStatement( 'insert-endpoint' );

        return this._run( sql, { 
            $runId: this.runId,
            $url: result.url,
            $statusCode: result.statusCode,
            $statusMessage: result.statusMessage,
        } );

    }


};