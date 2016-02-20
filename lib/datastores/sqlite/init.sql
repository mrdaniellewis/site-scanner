BEGIN EXCLUSIVE TRANSACTION;

CREATE TABLE IF NOT EXIST settings (
    
    key TEXT PRIMARY KEY,
    value TEXT

) WITHOUT ROWID;

REPLACE INTO settings ( key, value ) VALUES ( 'version', '1.0' );

CREATE TABLE IF NOT EXIST runs (
    
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL

);

CREATE TABLE IF NOT EXIST endpoints (
    
    id INTEGER PRIMARY KEY,
    runId INT NOT NULL,
    url TEXT NOT NULL,
    statusCode INT,
    statusMessage TEXT,

    UNIQUE ( runId, url )
    
);

CREATE TABLE IF NOT EXIST references (
    
    id INTEGER PRIMARY KEY,
    runId INT NOT NULL,
    targetUrl TEXT,
    source TEXT

);

CREATE INDEX IF NOT EXISTS index_references
    ON endpoints
    ( runId, targetUrl );

COMMIT;