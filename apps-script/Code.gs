var STATS_SPREADSHEET_ID_PROPERTY = 'CECE_STATS_SPREADSHEET_ID';
var STATS_SPREADSHEET_NAME = 'CeCe Ocean Typing Stats';
var VISITORS_SHEET = 'Visitors';
var PLAYS_SHEET = 'Plays';
var SCORES_SHEET = 'Scores';

function doGet(e) {
  var params = (e && e.parameter) || {};
  var callback = String(params.callback || '').trim();
  var action = String(params.action || 'stats').trim().toLowerCase();
  var visitorId = cleanId_(params.visitorId);

  try {
    var payload;
    if (action === 'visit') {
      payload = handleVisit_(visitorId);
    } else if (action === 'start') {
      payload = handleStart_(visitorId);
    } else if (action === 'score') {
      payload = handleScore_(visitorId, Number(params.score) || 0);
    } else {
      payload = readStats_();
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

function handleVisit_(visitorId) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var spreadsheet = getStatsSpreadsheet_();
    var visitors = spreadsheet.getSheetByName(VISITORS_SHEET);
    ensureVisitor_(visitors, visitorId);
    return readStatsFromSpreadsheet_(spreadsheet);
  } finally {
    lock.releaseLock();
  }
}

function handleStart_(visitorId) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var spreadsheet = getStatsSpreadsheet_();
    ensureVisitor_(spreadsheet.getSheetByName(VISITORS_SHEET), visitorId);
    spreadsheet.getSheetByName(PLAYS_SHEET).appendRow([new Date(), visitorId]);
    return readStatsFromSpreadsheet_(spreadsheet);
  } finally {
    lock.releaseLock();
  }
}

function handleScore_(visitorId, score) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var spreadsheet = getStatsSpreadsheet_();
    ensureVisitor_(spreadsheet.getSheetByName(VISITORS_SHEET), visitorId);
    var oldBest = getTopScores_(spreadsheet, 1)[0];
    var isNewBest = score > 0 && (!oldBest || score > oldBest.score);
    if (score > 0) {
      spreadsheet.getSheetByName(SCORES_SHEET).appendRow([new Date(), visitorId, score]);
    }
    var stats = readStatsFromSpreadsheet_(spreadsheet);
    stats.newBest = isNewBest;
    return stats;
  } finally {
    lock.releaseLock();
  }
}

function readStats_() {
  return readStatsFromSpreadsheet_(getStatsSpreadsheet_());
}

function getStatsSpreadsheet_() {
  var properties = PropertiesService.getScriptProperties();
  var spreadsheetId = properties.getProperty(STATS_SPREADSHEET_ID_PROPERTY);
  var spreadsheet;

  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create(STATS_SPREADSHEET_NAME);
    properties.setProperty(STATS_SPREADSHEET_ID_PROPERTY, spreadsheet.getId());
  }

  ensureSheets_(spreadsheet);
  return spreadsheet;
}

function ensureSheets_(spreadsheet) {
  ensureSheet_(spreadsheet, VISITORS_SHEET, ['FIRST_SEEN', 'VISITOR_ID', 'LAST_SEEN']);
  ensureSheet_(spreadsheet, PLAYS_SHEET, ['STARTED_AT', 'VISITOR_ID']);
  ensureSheet_(spreadsheet, SCORES_SHEET, ['FINISHED_AT', 'VISITOR_ID', 'SCORE']);
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

function ensureVisitor_(sheet, visitorId) {
  visitorId = cleanId_(visitorId);
  var now = new Date();
  var row = findVisitorRow_(sheet, visitorId);
  if (row > 0) {
    sheet.getRange(row, 3).setValue(now);
    return;
  }
  sheet.appendRow([now, visitorId, now]);
}

function findVisitorRow_(sheet, visitorId) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  var values = sheet.getRange(2, 2, lastRow - 1, 1).getDisplayValues();
  for (var i = 0; i < values.length; i += 1) {
    if (values[i][0] === visitorId) return i + 2;
  }
  return 0;
}

function readStatsFromSpreadsheet_(spreadsheet) {
  return {
    players: Math.max(0, spreadsheet.getSheetByName(VISITORS_SHEET).getLastRow() - 1),
    plays: Math.max(0, spreadsheet.getSheetByName(PLAYS_SHEET).getLastRow() - 1),
    scores: getTopScores_(spreadsheet, 3)
  };
}

function getTopScores_(spreadsheet, limit) {
  var sheet = spreadsheet.getSheetByName(SCORES_SHEET);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  return values.map(function (row) {
    return {
      at: row[0] instanceof Date ? row[0].getTime() : 0,
      score: Number(row[2]) || 0
    };
  }).filter(function (item) {
    return item.score > 0;
  }).sort(function (a, b) {
    return b.score - a.score || a.at - b.at;
  }).slice(0, limit);
}

function cleanId_(value) {
  var text = String(value || '').trim();
  if (!text) text = 'guest-' + Utilities.getUuid();
  return text.replace(/[^a-zA-Z0-9_.:-]/g, '').slice(0, 80);
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
