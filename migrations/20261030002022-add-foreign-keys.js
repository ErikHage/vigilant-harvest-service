'use strict';

var dbm;
var type;
var seed;
var fs = require('fs');
var path = require('path');
var Promise;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
  Promise = options.Promise;
};

function readSql(name) {
  var filePath = path.join(__dirname, 'sqls', name);
  return new Promise( function( resolve, reject ) {
    fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
      if (err) return reject(err);
      console.log('received data: ' + data);

      resolve(data);
    });
  });
}

/**
  * A key cannot be added over rows that already break it, and a migration that fails part way
  * leaves some keys added and others not. So count the orphans first, and refuse before
  * altering anything if there are any: scripts/foreign-key-orphans.sql reports and clears them.
  */
function assertNoOrphans(db) {
  return readSql('20261030002022-add-foreign-keys-orphans.sql')
    .then(function(sql) {
      return db.runSql(sql);
    })
    .then(function(rows) {
      var orphaned = rows.filter(function(row) { return Number(row.orphans) > 0; });
      if (orphaned.length > 0) {
        var summary = orphaned.map(function(row) { return row.relationship + ': ' + row.orphans; }).join(', ');
        throw new Error('Cannot add foreign keys while rows reference missing parents (' + summary + '). ' +
          'Clear them with scripts/foreign-key-orphans.sql, then restart.');
      }
    });
}

exports.up = function(db) {
  return assertNoOrphans(db)
    .then(function() {
      return readSql('20261030002022-add-foreign-keys-up.sql');
    })
    .then(function(data) {
      return db.runSql(data);
    });
};

exports.down = function(db) {
  return readSql('20261030002022-add-foreign-keys-down.sql')
    .then(function(data) {
      return db.runSql(data);
    });
};

exports._meta = {
  "version": 1
};
