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

    // 1. Collect files to process (supports up to 5 screenshots)
    const filesToProcess = [];
    if (Array.isArray(data.files) && data.files.length > 0) {
      filesToProcess.push(...data.files.slice(0, 5)); // Maximum 5 screenshots
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

            // Match Google Form URL format exactly: https://drive.google.com/open?id=...
            uploadedUrls.push("https://drive.google.com/open?id=" + file.getId());
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

    // 3. Locate sheet (works for both container-bound and standalone scripts)
    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    const nextRow = sheet.getLastRow() + 1;

    // 4. Calculate Sequential Ticket ID (Starting from 1 based on actual submissions)
    let submissionCount = 0;
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const colAValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < colAValues.length; i++) {
        const val = colAValues[i][0];
        if (val !== "" && val !== null && val !== undefined) {
          submissionCount++;
        }
      }
    }
    const ticketSeq = submissionCount + 1;
    const ticketId = "#DUT-" + ticketSeq;

    // 5. Prepare preview formulas for ALL uploaded images (Columns K, L, M...)
    const previewFormulas = uploadedIds.map(id => `=IFERROR(IMAGE("https://drive.google.com/thumbnail?id=${id}&sz=w1000", 1), "")`);

    // Ensure header in Column B if not present
    try {
      if (sheet.getRange(1, 2).getValue() === "") {
        sheet.getRange(1, 2).setValue("Ticket ID");
      }
    } catch (hdrErr) {
      console.warn("Header check: " + hdrErr);
    }

    // 6. Append row: Column A (Timestamp), Column B (Ticket ID), followed by C through J and image previews
    sheet.appendRow([
      new Date(),                                 // A: Timestamp
      ticketId,                                   // B: Ticket ID (just after timestamp!)
      data.consultantName || "",                  // C: Consultant Name
      data.projectName || data.companyName || "", // D: Project Name
      data.requestType || "",                     // E: Request Type
      data.urgency || "",                         // F: Urgency Level
      data.title || "",                           // G: Request Title
      data.category || "",                        // H: Category / Module
      data.description || "",                     // I: Description
      fileUrl,                                    // J: Upload a Screenshot (comma-separated URLs)
      ...previewFormulas                          // K, L, M... Previews for every image!
    ]);

    // Set row height to 100 so thumbnails and text fit cleanly
    sheet.setRowHeight(nextRow, 100);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      ticketId: ticketId,
      ticketNumber: ticketSeq,
      totalRequests: ticketSeq,
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

// GET endpoint: Lets the website fetch the live total count of requests directly from Google Sheets!
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    let totalCount = 0;
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const colAValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < colAValues.length; i++) {
        const val = colAValues[i][0];
        if (val !== "" && val !== null && val !== undefined) {
          totalCount++;
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      totalRequests: totalCount,
      nextTicketId: "#DUT-" + (totalCount + 1)
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// STEP 1 HELPER: Run this function in the Apps Script editor to authorize Google Drive & test folder permissions
function testDriveAccess() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const file = folder.createFile("test_permission.txt", "Drive access verified!");
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  Logger.log("SUCCESS! Created file: " + file.getUrl());
}

// STEP 2 HELPER: Run this function once in Apps Script to automatically fill Column B with #DUT-1, #DUT-2... for all existing rows in your sheet!
function fillTicketIdsForExistingRows() {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  const lastRow = sheet.getLastRow();
  
  // Set Column B header
  sheet.getRange(1, 2).setValue("Ticket ID");
  
  if (lastRow < 2) {
    Logger.log("No data rows found.");
    return;
  }
  
  let count = 0;
  for (let r = 2; r <= lastRow; r++) {
    const current = sheet.getRange(r, 2).getValue();
    if (!current || String(current).trim() === "") {
      sheet.getRange(r, 2).setValue("#DUT-" + (r - 1));
      count++;
    }
  }
  Logger.log("Updated " + count + " existing rows with Ticket IDs in Column B.");
}

