'use strict';

const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
const match = source.match(/const\s+schema\s*=\s*`([\s\S]*)`\s*;?\s*module\.exports/s);

if (!match) {
  throw new Error('Unable to load database schema from schema.sql');
}

module.exports = match[1];
