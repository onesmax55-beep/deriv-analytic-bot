// Compatibility entry point for the SQLite schema.
// The historical schema.sql file stores the SQL inside a template literal;
// keep parsing isolated here so Database.js receives plain SQL.
'use strict';

const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
const match = source.match(/const\s+schema\s*=\s*`([\s\S]*)`\s*;?\s*module\.exports/s);

if (!match) {
  throw new Error('Unable to load database schema from schema.sql');
}

module.exports = match[1];
