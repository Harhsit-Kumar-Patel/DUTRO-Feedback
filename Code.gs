function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Form responses 1") || ss.getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    var fileUrl = "N/A";
    var directImgUrl = "";

    // 1. If screenshot is attached, save to Google Drive & generate viewable thumbnail
    if (data.fileData) {
      try {
        var contentType = data.fileType || "image/jpeg";
        var fileName = data.fileName || "screenshot.jpg";
        var decoded = Utilities.base64Decode(data.fileData);
        var blob = Utilities.newBlob(decoded, contentType, fileName);
        var file = DriveApp.createFile(blob);
        
        // Ensure file is viewable with link
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (shareErr) {
          console.warn("Share warning: " + shareErr);
        }

        var fileId = file.getId();
        fileUrl = file.getUrl();
        // Direct thumbnail URL for Google Sheets =IMAGE() formula
        directImgUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1000";
      } catch (fileErr) {
        console.error("Drive upload error: " + fileErr);
      }
    }

    // 2. Append new ticket row (Columns A through I)
    var timestamp = new Date();
    sheet.appendRow([
      timestamp,
      data.requestType || "",
      data.urgency || "N/A",
      data.title || "",
      data.category || "",
      data.description || "",
      fileUrl,
      data.email || "",
      directImgUrl ? '=IMAGE("' + directImgUrl + '", 1)' : ""
    ]);

    // 3. Set row height & embed cell image preview if uploaded
    var lastRow = sheet.getLastRow();
    if (directImgUrl) {
      sheet.setRowHeight(lastRow, 80);
      try {
        var cellImage = SpreadsheetApp.newCellImage().setSourceUrl(directImgUrl).build();
        sheet.getRange(lastRow, 9).setValue(cellImage);
      } catch (imgErr) {
        // Fallback formula is already in place from appendRow
        sheet.getRange(lastRow, 9).setFormula('=IMAGE("' + directImgUrl + '", 1)');
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error("Error in doPost: " + err);
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Fallback: If native Google Form is submitted directly
function onFormSubmit(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Form responses 1") || ss.getActiveSheet();
    var row = e ? e.range.getRow() : sheet.getLastRow();
    if (row <= 1) return;

    var fileUrl = sheet.getRange(row, 7).getValue();
    if (!fileUrl || typeof fileUrl !== "string") return;

    var match = fileUrl.match(/[-\w]{25,}/);
    if (!match) return;

    var fileId = match[0];
    try {
      var file = DriveApp.getFileById(fileId);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (eShare) {}

    var directImgUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1000";
    sheet.setRowHeight(row, 80);
    try {
      var cellImage = SpreadsheetApp.newCellImage().setSourceUrl(directImgUrl).build();
      sheet.getRange(row, 9).setValue(cellImage);
    } catch (err) {
      sheet.getRange(row, 9).setFormula('=IMAGE("' + directImgUrl + '", 1)');
    }
  } catch (err) {
    console.error("onFormSubmit error: " + err);
  }
}
