const FOLDER_ID = "1rQPbR3_Bb2ZdRh4rsTDlQHboqBWRUqIHTE2MjjCJCDFtS3XpXxW5QvAIJ5LSzXT-co-8RTyt";
const SPREADSHEET_ID = "1MnCgjj6SRIufY-xm0ZJcGTblc1ygGvBMC7TizwRXXZQ";
const SHEET_NAME = "Form responses 1";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Prevent race conditions on concurrent row appends

  try {
    const data = JSON.parse(e.postData.contents);
    const uploadedUrls = [];
    const uploadedIds = [];

    // 1. Collect files to process (supports up to 10 screenshots)
    const filesToProcess = [];
    if (Array.isArray(data.files) && data.files.length > 0) {
      filesToProcess.push(...data.files.slice(0, 10)); // Maximum 10 screenshots
    } else if (data.fileData && data.fileName) {
      // Fallback for single-file payloads
      filesToProcess.push({
        fileData: data.fileData,
        fileName: data.fileName,
        mimeType: data.mimeType || "image/png"
      });
    }

    // 2. Process and save each screenshot to Google Drive
    if (filesToProcess.length > 0) {
      try {
        const folder = DriveApp.getFolderById(FOLDER_ID);
        for (let i = 0; i < filesToProcess.length; i++) {
          const item = filesToProcess[i];
          if (!item.fileData) continue;
          try {
            const decodedBytes = Utilities.base64Decode(item.fileData);
            const blob = Utilities.newBlob(decodedBytes, item.mimeType || "image/png", item.fileName || ("screenshot_" + (i + 1) + ".png"));
            const file = folder.createFile(blob);

            // Make file accessible with link
            try {
              file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            } catch (shareErr) {
              console.warn("Share warning: " + shareErr);
            }

            uploadedUrls.push(file.getUrl());
            uploadedIds.push(file.getId());
          } catch (fileErr) {
            console.error("Error creating file " + (i + 1) + ": " + fileErr);
          }
        }
      } catch (driveErr) {
        console.error("Drive folder error: " + driveErr);
      }
    }

    const fileUrl = uploadedUrls.length > 0 ? uploadedUrls.join(", ") : "N/A";
    const primaryFileId = uploadedIds.length > 0 ? uploadedIds[0] : "";

    // 3. Locate sheet (works for both container-bound and standalone scripts)
    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    const nextRow = sheet.getLastRow() + 1;

    // 4. Prepare preview formula for first image (Column J)
    const previewFormula = primaryFileId 
      ? `=IFERROR(IMAGE("https://drive.google.com/thumbnail?id=${primaryFileId}&sz=w1000", 1), "")` 
      : "";

    // 5. Append row matching new Columns A through J
    sheet.appendRow([
      new Date(),                     // A: Timestamp
      data.consultantName || "",      // B: Consultant Name
      data.companyName || "",         // C: Company Name
      data.requestType || "",         // D: Request Type
      data.urgency || "",             // E: Urgency Level
      data.title || "",               // F: Request Title
      data.category || "",            // G: Category / Module
      data.description || "",         // H: Description
      fileUrl,                        // I: Upload a Screenshot (comma-separated URLs)
      previewFormula                  // J: Screenshot Preview (first image)
    ]);

    // Set row height to 100 so thumbnails and text fit cleanly
    sheet.setRowHeight(nextRow, 100);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      count: uploadedUrls.length,
      fileUrls: uploadedUrls,
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

// STEP 1 HELPER: Run this function in the Apps Script editor to authorize Google Drive & test folder permissions
function testDriveAccess() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const file = folder.createFile("test_permission.txt", "Drive access verified!");
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  Logger.log("SUCCESS! Created file: " + file.getUrl());
}
