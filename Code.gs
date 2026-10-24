const FOLDER_ID = "1rQPbR3_Bb2ZdRh4rsTDlQHboqBWRUqIHTE2MjjCJCDFtS3XpXxW5QvAIJ5LSzXT-co-8RTyt";
const SPREADSHEET_ID = "1MnCgjj6SRIufY-xm0ZJcGTblc1ygGvBMC7TizwRXXZQ";
const SHEET_NAME = "Form responses 1";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Prevent race conditions on concurrent row appends

  try {
    const data = JSON.parse(e.postData.contents);
    let fileUrl = "N/A";
    let fileId = "";

    // 1. Process and save the screenshot if provided
    if (data.fileData && data.fileName) {
      try {
        const folder = DriveApp.getFolderById(FOLDER_ID);
        const decodedBytes = Utilities.base64Decode(data.fileData);
        const blob = Utilities.newBlob(decodedBytes, data.mimeType || "image/png", data.fileName);
        const file = folder.createFile(blob);

        // Make the file viewable with link
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (shareErr) {
          console.warn("Share warning: " + shareErr);
        }

        fileUrl = file.getUrl();
        fileId = file.getId();
      } catch (driveErr) {
        console.error("Drive upload error: " + driveErr);
      }
    }

    // 2. Locate sheet (works for both container-bound and standalone scripts)
    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    const nextRow = sheet.getLastRow() + 1;

    // 3. Prepare preview formula for Column I
    const previewFormula = fileId 
      ? `=IMAGE("https://drive.google.com/thumbnail?id=${fileId}&sz=w1000", 1)` 
      : "";

    // 4. Append row matching Columns A through I
    sheet.appendRow([
      new Date(),              // A: Timestamp
      data.requestType || "",  // B: Request Type
      data.urgency || "",      // C: Urgency Level
      data.title || "",        // D: Request Title
      data.category || "",     // E: Category / Module
      data.description || "",  // F: Description
      fileUrl,                 // G: Upload a Screenshot
      data.email || "",        // H: Contact Email
      previewFormula           // I: Screenshot Preview
    ]);

    // Set row height so the thumbnail is clearly visible
    if (fileId) {
      sheet.setRowHeight(nextRow, 80);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      fileUrl: fileUrl
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

// STEP 1 HELPER: Run this function in the Apps Script editor to authorize Google Drive & test the folder
function testDriveAccess() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const file = folder.createFile("test_permission.txt", "Drive access verified!");
  Logger.log("SUCCESS! Created file: " + file.getUrl());
}
