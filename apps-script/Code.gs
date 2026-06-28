var STATS_SPREADSHEET_ID = '1gNbDyTqyEy8L5z8-b-1mdADHTWT6rLvvARSch1VQ8xM';
var VISITORS_SHEET = 'Visitors';
var PLAYS_SHEET = 'Plays';
var SCORES_SHEET = 'Scores';

function doGet(e) {
  var params = (e && e.parameter) || {};
  var callback = String(params.callback || '').trim();
  var action = String(params.action || 'stats').trim().toLowerCase();
  var visitorId = cleanId_(params.visitorId);
  var level = cleanLevel_(params.level);

  try {
    var payload;
    if (action === 'visit') {
      payload = handleVisit_(visitorId, level);
    } else if (action === 'start') {
      payload = handleStart_(visitorId, level);
    } else if (action === 'score') {
      payload = handleScore_(visitorId, level, Number(params.score) || 0);
    } else {
      payload = readStats_(level);
    }
    payload.ok = true;
    return output_(callback, payload);
  } catch (err) {
    return output_(callback, {
      ok: false,
      error: err && err.message ? err.message : String(err)
    });
  }
}

function setupCeCeStats() {
  var spreadsheet = getStatsSpreadsheet_();
  ensureSheets_(spreadsheet);
  return {
    ok: true,
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl()
  };
}

function handleVisit_(visitorId, level) {
  if (isTestVisitor_(visitorId)) return readStats_(level);
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var spreadsheet = getStatsSpreadsheet_();
    var visitors = spreadsheet.getSheetByName(VISITORS_SHEET);
    ensureVisitor_(visitors, visitorId, level);
    return readStatsFromSpreadsheet_(spreadsheet, level);
  } finally {
    lock.releaseLock();
  }
}

function handleStart_(visitorId, level) {
  if (isTestVisitor_(visitorId)) return readStats_(level);
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var spreadsheet = getStatsSpreadsheet_();
    ensureVisitor_(spreadsheet.getSheetByName(VISITORS_SHEET), visitorId, level);
    spreadsheet.getSheetByName(PLAYS_SHEET).appendRow([new Date(), visitorId, level]);
    return readStatsFromSpreadsheet_(spreadsheet, level);
  } finally {
    lock.releaseLock();
  }
}

function handleScore_(visitorId, level, score) {
  if (isTestVisitor_(visitorId)) {
    var testStats = readStats_(level);
    testStats.newBest = false;
    return testStats;
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var spreadsheet = getStatsSpreadsheet_();
    ensureVisitor_(spreadsheet.getSheetByName(VISITORS_SHEET), visitorId, level);
    var oldBest = getTopScores_(spreadsheet, level, 1)[0];
    var isNewBest = score > 0 && (!oldBest || score > oldBest.score);
    if (score > 0) {
      spreadsheet.getSheetByName(SCORES_SHEET).appendRow([new Date(), visitorId, level, score]);
    }
    var stats = readStatsFromSpreadsheet_(spreadsheet, level);
    stats.newBest = isNewBest;
    return stats;
  } finally {
    lock.releaseLock();
  }
}

function readStats_(level) {
  return readStatsFromSpreadsheet_(getStatsSpreadsheet_(), level);
}

function getStatsSpreadsheet_() {
  var spreadsheet = SpreadsheetApp.openById(STATS_SPREADSHEET_ID);
  ensureSheets_(spreadsheet);
  return spreadsheet;
}

function ensureSheets_(spreadsheet) {
  ensureSheet_(spreadsheet, VISITORS_SHEET, ['FIRST_SEEN', 'VISITOR_ID', 'LEVEL', 'LAST_SEEN']);
  ensureSheet_(spreadsheet, PLAYS_SHEET, ['STARTED_AT', 'VISITOR_ID', 'LEVEL']);
  ensureSheet_(spreadsheet, SCORES_SHEET, ['FINISHED_AT', 'VISITOR_ID', 'LEVEL', 'SCORE']);
}

function ensureSheet_(spreadsheet, sheetName, headers) {
  var sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return sheet;
  }

  var current = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  var needsHeader = headers.some(function (header, index) {
    return current[index] !== header;
  });
  if (needsHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function ensureVisitor_(sheet, visitorId, level) {
  visitorId = cleanId_(visitorId);
  level = cleanLevel_(level);
  var now = new Date();
  var row = findVisitorRow_(sheet, visitorId, level);
  if (row > 0) {
    sheet.getRange(row, 4).setValue(now);
    return;
  }
  sheet.appendRow([now, visitorId, level, now]);
}

function findVisitorRow_(sheet, visitorId, level) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  var values = sheet.getRange(2, 2, lastRow - 1, 2).getDisplayValues();
  for (var i = 0; i < values.length; i += 1) {
    if (values[i][0] === visitorId && cleanLevel_(values[i][1]) === level) return i + 2;
  }
  return 0;
}

function readStatsFromSpreadsheet_(spreadsheet, level) {
  level = cleanLevel_(level);
  return {
    players: countRowsForLevel_(spreadsheet.getSheetByName(VISITORS_SHEET), level, 2, 3),
    plays: countRowsForLevel_(spreadsheet.getSheetByName(PLAYS_SHEET), level, 2, 3),
    scores: getTopScores_(spreadsheet, level, 3)
  };
}

function countRowsForLevel_(sheet, level, visitorColumn, levelColumn) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  var width = Math.max(visitorColumn, levelColumn);
  var values = sheet.getRange(2, 1, lastRow - 1, width).getDisplayValues();
  return values.filter(function (row) {
    var visitorId = row[visitorColumn - 1];
    var rowLevel = row[levelColumn - 1];
    return !isTestVisitor_(visitorId) && cleanLevel_(rowLevel) === level;
  }).length;
}

function getTopScores_(spreadsheet, level, limit) {
  var sheet = spreadsheet.getSheetByName(SCORES_SHEET);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  level = cleanLevel_(level);
  var values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  return values.map(function (row) {
    var visitorId = String(row[1] || '');
    var rowLevel = cleanLevel_(row[2]);
    var rowScore = Number(row[3]) || 0;
    if (!row[3] && Number(row[2])) {
      rowLevel = 'level1';
      rowScore = Number(row[2]) || 0;
    }
    return {
      at: row[0] instanceof Date ? row[0].getTime() : 0,
      visitorId: visitorId,
      level: rowLevel,
      score: rowScore
    };
  }).filter(function (item) {
    return !isTestVisitor_(item.visitorId) && item.level === level && item.score > 0;
  }).sort(function (a, b) {
    return b.score - a.score || a.at - b.at;
  }).slice(0, limit);
}

function cleanId_(value) {
  var text = String(value || '').trim();
  if (!text) text = 'guest-' + Utilities.getUuid();
  return text.replace(/[^a-zA-Z0-9_.:-]/g, '').slice(0, 80);
}

function cleanLevel_(value) {
  var text = String(value || 'level1').trim().toLowerCase();
  return text === 'level2' || text === 'level3' ? text : 'level1';
}

function isTestVisitor_(visitorId) {
  return String(visitorId || '').indexOf('codex-') === 0;
}

function output_(callback, payload) {
  if (callback) {
    var safeCallback = callback.replace(/[^\w.$]/g, '');
    return ContentService
      .createTextOutput(safeCallback + '(' + JSON.stringify(payload) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
