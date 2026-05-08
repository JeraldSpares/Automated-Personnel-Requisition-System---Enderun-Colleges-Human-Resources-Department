// --- CONFIGURATION ---
// Palitan ng aktwal na email addresses ng COO/approvers (pwedeng comma-separated for multiple recipients)
var COO_EMAIL = "PUT_COO_EMAIL_HERE";
// Palitan ng email address ng Admin/HR (mag-receive ng system alerts)
var ADMIN_EMAIL = "PUT_ADMIN_EMAIL_HERE";

// --- GOOGLE DOCS & FOLDERS CONFIGURATION ---
// Google Docs Template ID (kunin sa URL ng template doc: docs.google.com/document/d/<TEMPLATE_ID>/edit)
var TEMPLATE_ID = "PUT_TEMPLATE_DOC_ID_HERE";

// Dito mapupunta ang mga Generated TRF Docs (Subfolder will be created here)
// Google Drive Folder ID (kunin sa URL ng folder: drive.google.com/drive/folders/<FOLDER_ID>)
var TRF_FOLDER_ID = "PUT_TRF_FOLDER_ID_HERE";

// Dito mapupunta ang mga Uploaded Attachments (Subfolder will be created here)
// Google Drive Folder ID (kunin sa URL ng folder: drive.google.com/drive/folders/<FOLDER_ID>)
var ATTACHMENT_FOLDER_ID = "PUT_ATTACHMENT_FOLDER_ID_HERE";

// --- PURE LIGHT BLUE THEME PALETTE ---
var COLORS = {
  bg: "#e1f5fe",
  primary: "#0288d1",
  secondary: "#81d4fa",
  border: "#b3e5fc",
  heading: "#01579b",
  text: "#455a64",
  white: "#ffffff",
  successText: "#2e7d32",
  successBg: "#e8f5e9",
  dangerText: "#c62828",
  dangerBg: "#ffebee",
  btnRed: "#ef5350"
};

/***************************************
 * 1. WEB APP ENTRY POINT (Form & Approvals)
 ***************************************/
function doGet(e) {
  try {
    // KUNG WALANG ROW PARAMETER, IPAKITA ANG HTML FORM
    if (!e || !e.parameter || !e.parameter.row) {
      return HtmlService.createHtmlOutputFromFile('Index')
        .setTitle('Personnel Requisition Form')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // KUNG MAY ROW PARAMETER, TUMAKBO ANG APPROVAL LOGIC
    console.log("Received parameters: " + JSON.stringify(e.parameter));
    var action = e.parameter.action;
    var level = e.parameter.level || "dept";
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Personnel Requisition Tracker");

    // --- STRICT ROW FINDER GAMIT ANG REQ ID ---
    var targetReqId = e.parameter.reqId;
    var rowParam = e.parameter.row ? Number(e.parameter.row) : null;
    var row = -1;

    if (targetReqId) {
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var ids = sheet.getRange(2, 3, lastRow - 1, 1).getValues(); // Kunin lahat ng ID sa Col C
        var targetNum = Number(targetReqId); // Siguraduhing number format (ex. 7)

        // Iisa-isahin natin pababa para mahanap kung saang row eksakto nakalagay
        for (var i = 0; i < ids.length; i++) {
          if (Number(ids[i][0]) === targetNum) {
            row = i + 2; // +2 dahil nag-umpisa tayo sa Row 2
            break; // Pag nahanap na, patigilin na ang paghahanap
          }
        }
      }
    } else if (rowParam) {
      row = rowParam; // Fallback kung lumang link ang na-click na walang reqId
    }

    // Safety check kung invalid ang link o mababa sa Row 1
    if (row < 1) {
      return createMessagePage("Invalid Link", "Please check your latest email request.", false);
    }

    var lastRowCheck = sheet.getLastRow();
    if (row > lastRowCheck) return createMessagePage("Error", "Row does not exist.", false);

    var statusCol = (level === "dept") ? 23 : 25; // Col W for Dept (23), Col Y for COO (25)

    // --- PREVENT DUPLICATE PROCESSING LOGIC ---
    var currentStatus = sheet.getRange(row, statusCol).getValue();

    if (currentStatus !== "") {
      // Kung may laman na ang cell, ibig sabihin na-process na ito.
      return createMessagePage("Already Processed", `This request has already been marked as <b>${currentStatus}</b>. No further action is needed.`, false);
    }

    var decision = (action === "recommend") ? "Recommended" :
                   (action === "approve") ? "Approved" : "Declined";

    // I-save sa sheet ang decision
    sheet.getRange(row, statusCol).setValue(decision);
    sheet.getRange(row, statusCol + 1).setValue(new Date());

    // I-save agad bago mag-email
    SpreadsheetApp.flush();

    sendUnifiedStatusEmail(row, decision, (level === "dept" ? "Department Head" : "COO"));

    if (level === "dept" && action === "recommend") {
      sendEmailToCOOApproval(row);
    }

    return createMessagePage("Success!", "Decision recorded: " + decision, true);

  } catch (err) {
    console.error("DoGet Error: " + err.toString());
    return createMessagePage("Error", err.toString(), false);
  }
}

/***************************************
 * 2. PROCESS FORM DATA FROM WEB APP
 ***************************************/
function processWebAppForm(formData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Personnel Requisition Tracker");

  var uploadedFileUrl = "";
  if (formData.fileContent && formData.fileName) {
    try {
      var blob = Utilities.newBlob(Utilities.base64Decode(formData.fileContent), formData.mimeType, formData.fileName);
      var mainFolder = DriveApp.getFolderById(ATTACHMENT_FOLDER_ID);
      var uploadedFile = mainFolder.createFile(blob);
      uploadedFileUrl = uploadedFile.getUrl();
    } catch (e) {
      Logger.log("File Upload Error: " + e.message);
    }
  }

  var newRowData = [];
  newRowData[0] = new Date(); // Col A
  newRowData[1] = formData.email; // Col B
  newRowData[2] = ""; // Col C
  newRowData[3] = formData.requestorName; // Col D
  newRowData[4] = formData.salary; // Col E
  newRowData[5] = formData.department; // Col F
  newRowData[6] = formData.position; // Col G
  newRowData[7] = formData.resourceCount; // Col H
  newRowData[8] = formData.location; // Col I
  newRowData[9] = formData.deptHeadName; // Col J
  newRowData[10] = formData.deptHeadEmail; // Col K
  newRowData[11] = formData.empType; // Col L
  newRowData[12] = formData.replacement; // Col M
  newRowData[13] = formData.duration; // Col N
  newRowData[14] = formData.startDate; // Col O
  newRowData[15] = formData.workSchedule; // Col P
  newRowData[16] = formData.academic; // Col Q
  newRowData[17] = formData.experience; // Col R
  newRowData[18] = formData.skills; // Col S
  newRowData[19] = formData.other; // Col T
  newRowData[20] = uploadedFileUrl; // Col U

  for(var i = 21; i < 27; i++) { newRowData[i] = ""; }

  sheet.appendRow(newRowData);
  SpreadsheetApp.flush();

  var newRowIndex = sheet.getLastRow();

  if (newRowIndex < 1) newRowIndex = 1;

  var reqId;
  var maxId = 0;
  if (newRowIndex > 2) {
    var ids = sheet.getRange(2, 3, newRowIndex - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      var val = parseInt(ids[i][0], 10);
      if (!isNaN(val) && val > maxId) {
        maxId = val;
      }
    }
  }
  var nextNumber = maxId + 1;
  reqId = nextNumber.toString();

  sheet.getRange(newRowIndex, 3).setValue(reqId);
  SpreadsheetApp.flush();

  generateDocAndFolder(sheet, newRowIndex, reqId);
  SpreadsheetApp.flush();
  Utilities.sleep(2000);
  sendEmailToDepartment(newRowIndex, reqId);

  return reqId;
}

/***************************************
 * 3. TRIGGER: ON FORM SUBMIT (Native Forms)
 ***************************************/
function onFormSubmit(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Personnel Requisition Tracker");
  var row = sheet.getLastRow();

  if (row < 2) {
    Logger.log("Walang data na makita. Headers lang ang nandito.");
    return;
  }

  var maxId = 0;
  if (row > 2) {
    var ids = sheet.getRange(2, 3, row - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      var val = parseInt(ids[i][0], 10);
      if (!isNaN(val) && val > maxId) {
        maxId = val;
      }
    }
  }
  var reqId = (maxId + 1).toString();
  sheet.getRange(row, 3).setValue(reqId);
  SpreadsheetApp.flush();

  generateDocAndFolder(sheet, row, reqId);
  SpreadsheetApp.flush();
  Utilities.sleep(2000);
  sendEmailToDepartment(row, reqId);
}

/***************************************
 * 4. HELPER: DOC & FOLDERS GENERATOR (SEPARATED)
 ***************************************/
function generateDocAndFolder(sheet, row, reqId) {
  try {
    var data = sheet.getRange(row, 1, 1, 27).getValues()[0];

    var requestor     = data[3];
    var salaryRange   = data[4];
    var department    = data[5];
    var position      = data[6];
    var resource      = data[7];
    var location      = data[8];
    var deptheadName  = data[9];
    var emptype       = data[11];
    var replacement   = data[12];
    var projectbased  = data[13];
    var startdate     = data[14] ? Utilities.formatDate(new Date(data[14]), Session.getScriptTimeZone(), "MM/dd/yyyy") : "";
    var workschedule  = data[15];
    var academic      = data[16];
    var yearsofexp    = data[17];
    var skillsreq     = data[18];
    var other         = data[19];
    var attachmentUrls = data[20];

    var folderName = reqId + " - " + position;

    var trfMainFolder = DriveApp.getFolderById(TRF_FOLDER_ID);
    var trfSubFolder = trfMainFolder.createFolder(folderName);

    var templateFile = DriveApp.getFileById(TEMPLATE_ID);
    var copy = templateFile.makeCopy("PRF - " + position, trfSubFolder);

    var attachmentMainFolder = DriveApp.getFolderById(ATTACHMENT_FOLDER_ID);
    var attachmentSubFolder = attachmentMainFolder.createFolder(folderName);

    if (attachmentUrls && attachmentUrls.toString().trim() !== "") {
      var urls = attachmentUrls.toString().split(",");
      urls.forEach(function(url) {
        try {
          var fileId = url.match(/[-\w]{25,}/);
          if (fileId) {
            var file = DriveApp.getFileById(fileId[0]);
            file.moveTo(attachmentSubFolder);
          }
        } catch (err) {
          Logger.log("Error moving file: " + err.message);
        }
      });
    }

    var doc = DocumentApp.openById(copy.getId());
    var body = doc.getBody();

    function replaceTextSafe(placeholder, value) {
      body.replaceText("\\{\\{" + placeholder + "\\}\\}", value ? value.toString() : "");
    }

    replaceTextSafe("requestor", requestor);
    replaceTextSafe("sal", salaryRange);
    replaceTextSafe("department", department);
    replaceTextSafe("positionTitle", position);
    replaceTextSafe("nr", resource);
    replaceTextSafe("al", location);
    replaceTextSafe("dh", deptheadName);
    replaceTextSafe("et", emptype);
    replaceTextSafe("replacement", replacement);
    replaceTextSafe("hiring", projectbased);
    replaceTextSafe("date", startdate);
    replaceTextSafe("ws", workschedule);
    replaceTextSafe("aq", academic);
    replaceTextSafe("re", yearsofexp);
    replaceTextSafe("sr", skillsreq);
    replaceTextSafe("oa", other);
    replaceTextSafe("coo", "PUT_COO_NAME_HERE");
    replaceTextSafe("esd", "PUT_ESD_NAME_HERE");

    doc.saveAndClose();

    sheet.getRange(row, 21).setValue(attachmentSubFolder.getUrl());
    sheet.getRange(row, 22).setValue(copy.getUrl());

  } catch (e) {
    Logger.log("Error generating doc/folder: " + e.toString());
  }
}

/***************************************
 * 5. EMAIL & VISUAL HELPERS
 ***************************************/
function createMessagePage(title, message, isSuccess) {
  var icon = isSuccess ? "✔" : "ℹ";
  return HtmlService.createHtmlOutput(`
    <html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="margin:0; padding:0; background-color:${COLORS.bg}; font-family:'Segoe UI', sans-serif;">
      <div style="display:flex; justify-content:center; align-items:center; height:100vh;">
        <div style="background:white; padding:40px; border-radius:20px; box-shadow:0 10px 25px rgba(2, 136, 209, 0.15); width:90%; max-width:400px; text-align:center; border-top:8px solid ${COLORS.primary};">
          <div style="font-size:50px; color:${COLORS.primary}; margin-bottom:15px;">${icon}</div>
          <h2 style="color:${COLORS.heading}; margin:0 0 10px 0;">${title}</h2>
          <p style="color:${COLORS.text}; font-size:16px;">${message}</p>
        </div>
      </div>
    </body></html>`);
}

function getProgressTracker(stage) {
  var activeColor = COLORS.primary;
  var inactiveColor = "#e0e0e0";
  var c1 = stage >= 1 ? activeColor : inactiveColor;
  var c2 = stage >= 2 ? activeColor : inactiveColor;
  var c3 = stage >= 3 ? activeColor : inactiveColor;
  var l1 = stage >= 2 ? activeColor : inactiveColor;
  var l2 = stage >= 3 ? activeColor : inactiveColor;

  return `
    <table align="center" border="0" cellpadding="0" cellspacing="0" style="width:100%; max-width:250px; margin: 20px auto;">
      <tr>
        <td align="center" width="20"><div style="width:14px; height:14px; background:${c1}; border-radius:50%;"></div></td>
        <td align="center"><div style="height:3px; width:100%; background:${l1};"></div></td>
        <td align="center" width="20"><div style="width:14px; height:14px; background:${c2}; border-radius:50%;"></div></td>
        <td align="center"><div style="height:3px; width:100%; background:${l2};"></div></td>
        <td align="center" width="20"><div style="width:14px; height:14px; background:${c3}; border-radius:50%;"></div></td>
      </tr>
      <tr>
        <td align="center" style="font-size:10px; color:${COLORS.heading}; font-weight:bold; padding-top:5px;">REQ</td>
        <td></td>
        <td align="center" style="font-size:10px; color:${COLORS.heading}; font-weight:bold; padding-top:5px;">DH</td>
        <td></td>
        <td align="center" style="font-size:10px; color:${COLORS.heading}; font-weight:bold; padding-top:5px;">COO</td>
      </tr>
    </table>`;
}

function generateDetailedTable(data, displayValues, includeDeptHead) {
  function row(label1, val1, label2, val2) {
    if (label2 === null) {
        return `<tr><td colspan="2" style="padding:8px 0; vertical-align:top;"><div style="font-size:10px; color:${COLORS.secondary}; font-weight:bold; text-transform:uppercase;">${label1}</div><div style="font-size:13px; color:${COLORS.text}; font-weight:600;">${val1 || "-"}</div></td></tr>`;
    }
    return `<tr><td width="50%" style="padding:8px 0; vertical-align:top;"><div style="font-size:10px; color:${COLORS.secondary}; font-weight:bold; text-transform:uppercase;">${label1}</div><div style="font-size:13px; color:${COLORS.text}; font-weight:600;">${val1 || "-"}</div></td><td width="50%" style="padding:8px 0; vertical-align:top;"><div style="font-size:10px; color:${COLORS.secondary}; font-weight:bold; text-transform:uppercase;">${label2}</div><div style="font-size:13px; color:${COLORS.text}; font-weight:600;">${val2 || "-"}</div></td></tr>`;
  }
  function header(title) {
    return `<tr><td colspan="2" style="padding:15px 0 5px 0; border-bottom:1px dashed ${COLORS.border}; color:${COLORS.primary}; font-size:11px; font-weight:bold; letter-spacing:1px;">${title.toUpperCase()}</td></tr>`;
  }

  var html = `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">`;
  html += row("Request ID", data[2], "Requestor", data[3]);
  html += row("Department", data[5], includeDeptHead ? "Dept Head" : null, includeDeptHead ? data[9] : null);
  html += header("Position Details");
  html += row("Position Title", data[6], "No. of headcount for hire", data[7] + " Resource(s)");
  html += row("Assigned Location", data[8], "Employment Type", data[11]);
  html += row("Duration", data[13], null, null);
  html += header("Planning");
  html += row("Start Date", displayValues[14], "Work Schedule", data[15]);
  html += row("Justification/Replacement:", data[12], null, null);
  html += header("Requirements");
  html += row("Academic Qualification", data[16], "Experience", data[17]);
  html += row("Skills Required", data[18], null, null);
  html += row("Salary Range", data[4], null, null);
  var fileLink = data[20] ? `<a href="${data[20]}" style="color:${COLORS.primary}; text-decoration:none; font-weight:bold;">📎 View Attachment</a>` : "None";
  html += row("Attachment", fileLink, null, null);
  html += `</table>`;
  return html;
}

function generateSummaryTable(data, displayValues) {
  return `<table width="100%" cellpadding="10" cellspacing="0" style="background-color:${COLORS.bg}; border-radius:8px; margin-top:15px;"><tr><td style="color:${COLORS.heading}; font-size:12px; font-weight:bold;">${data[2]}</td><td align="right" style="color:${COLORS.heading}; font-size:12px;">${data[6]}</td></tr><tr><td colspan="2" style="color:${COLORS.text}; font-size:11px; border-top:1px solid ${COLORS.white};">Requestor: <b>${data[3]}</b> &nbsp;|&nbsp; Target Start: <b>${displayValues[14]}</b></td></tr></table>`;
}

function sendEmailToDepartment(row, reqId) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Personnel Requisition Tracker");
  var url = ScriptApp.getService().getUrl();
  var data = sh.getRange(row, 1, 1, 27).getValues()[0];
  var displayValues = sh.getRange(row, 1, 1, 27).getDisplayValues()[0];

  var trfButton = data[21] ? `<div style="text-align:center; margin-top: 15px; padding-top: 15px; border-top: 1px dashed ${COLORS.border};"><a href="${data[21]}" style="color:${COLORS.primary}; text-decoration:none; font-weight:bold; background-color:#f0f9ff; padding: 10px 20px; border-radius: 5px; border: 1px solid ${COLORS.secondary}; display:inline-block;">📎 View PRF Attachments</a></div>` : "";
  var btnStyleRecommend = `background-color:${COLORS.primary}; color:white; padding:14px 0; width:220px; text-align:center; text-decoration:none; border-radius:30px; font-weight:bold; font-size:14px; margin:10px; display:inline-block; box-shadow: 0 4px 10px rgba(2, 136, 209, 0.3);`;
  var btnStyleDeclined = `background-color:${COLORS.btnRed}; color:white; padding:14px 0; width:220px; text-align:center; text-decoration:none; border-radius:30px; font-weight:bold; font-size:14px; margin:10px; display:inline-block; box-shadow: 0 4px 10px rgba(239, 83, 80, 0.3);`;

  var htmlBody = `
    <div style="font-family:'Segoe UI', sans-serif; background-color:${COLORS.bg}; padding:40px 10px;">
      <div style="max-width:600px; margin:auto; background-color:${COLORS.white}; border-radius:16px; box-shadow: 0 5px 20px rgba(2, 136, 209, 0.1); overflow:hidden;">
        <div style="padding:30px 20px 10px 20px; text-align:center;">
          <h2 style="color:${COLORS.heading}; margin:0; font-size:24px;">Approval Required</h2>
          ${getProgressTracker(2)}
          <div style="margin-top:15px; border-top:1px dashed ${COLORS.border}; padding-top:15px; text-align:left;">
            <p style="margin:0; font-size:15px; color:${COLORS.text}; line-height: 1.6;">A new personnel request has been submitted by <b>${data[3]}</b> and requires your review and approval.</p>
          </div>
        </div>
        <div style="padding:10px 30px 10px 30px;">
          <div style="border:1px solid ${COLORS.border}; border-radius:8px; padding:20px;">
            <div style="font-size:12px; color:${COLORS.primary}; font-weight:bold; margin-bottom:10px; text-align:center; text-transform:uppercase;">Request Summary</div>
            ${generateDetailedTable(data, displayValues, false)}
            ${trfButton}
          </div>
        </div>
        <div style="background-color:#f5faff; padding:25px; text-align:center; border-top:1px solid ${COLORS.border};">
          <p style="margin:0 0 15px 0; color:${COLORS.text}; font-size:14px;">Please click “Recommend” or “Decline” below to proceed.</p>
          <a href="${url}?reqId=${data[2]}&row=${row}&action=recommend&level=dept" style="${btnStyleRecommend}">RECOMMEND</a>
          <a href="${url}?reqId=${data[2]}&row=${row}&action=not_recommend&level=dept" style="${btnStyleDeclined}">DECLINE</a>
        </div>
      </div>
    </div>`;

  if(data[10] && data[10].toString().includes("@")) {
    MailApp.sendEmail({ to: data[10], name: "Personnel Requisition", subject: `Action Required: Personnel Requisition - ${data[6]}`, htmlBody: htmlBody });
  } else {
    Logger.log("ERROR: Invalid Dept Head Email in Col K: " + data[10]);
  }
}

function sendEmailToCOOApproval(row) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Personnel Requisition Tracker");
  var url = ScriptApp.getService().getUrl();
  var data = sh.getRange(row, 1, 1, 27).getValues()[0];
  var displayValues = sh.getRange(row, 1, 1, 27).getDisplayValues()[0];

  var trfButton = data[21] ? `<div style="text-align:center; margin-top: 15px; padding-top: 15px; border-top: 1px dashed ${COLORS.border};"><a href="${data[21]}" style="color:${COLORS.primary}; text-decoration:none; font-weight:bold; background-color:#f0f9ff; padding: 10px 20px; border-radius: 5px; border: 1px solid ${COLORS.secondary}; display:inline-block;">📎 View PRF Attachments</a></div>` : "";
  var btnStyleApprove = `background-color:${COLORS.primary}; color:white; padding:16px 0; width:220px; text-align:center; text-decoration:none; border-radius:30px; font-weight:bold; font-size:15px; margin:10px; display:inline-block; box-shadow: 0 4px 10px rgba(2, 136, 209, 0.3);`;
  var btnStyleDecline = `background-color:${COLORS.btnRed}; color:white; padding:16px 0; width:220px; text-align:center; text-decoration:none; border-radius:30px; font-weight:bold; font-size:15px; margin:10px; display:inline-block; box-shadow: 0 4px 10px rgba(239, 83, 80, 0.3);`;

  var htmlBody = `
    <div style="font-family:'Segoe UI', sans-serif; background-color:${COLORS.bg}; padding:40px 10px;">
      <div style="max-width:600px; margin:auto; background-color:${COLORS.white}; border-radius:16px; box-shadow: 0 5px 20px rgba(2, 136, 209, 0.1); overflow:hidden; border-top:8px solid ${COLORS.primary};">
        <div style="padding:30px 20px 10px 20px; text-align:center;">
          <h2 style="color:${COLORS.heading}; margin:0; font-size:24px;">Final Approval Required</h2>
          ${getProgressTracker(3)}
          <div style="margin-top:15px; border-top:1px dashed ${COLORS.border}; padding-top:15px; text-align:left;">
            <p style="margin:0; font-size:15px; color:${COLORS.text}; line-height: 1.6;">A new personnel request submitted by <b>${data[3]}</b> has been approved/recommended by the Department Head and now needs your review and final approval.</p>
          </div>
        </div>
        <div style="padding:10px 30px 10px 30px;">
          <div style="border:1px solid ${COLORS.border}; border-radius:8px; padding:20px;">
            ${generateDetailedTable(data, displayValues, true)}
            ${trfButton}
          </div>
        </div>
        <div style="background-color:#f5faff; padding:25px; text-align:center; border-top:1px solid ${COLORS.border};">
          <p style="margin:0 0 15px 0; color:${COLORS.text}; font-size:14px;">Please click “Approve” or “Decline” below to proceed.</p>
          <a href="${url}?reqId=${data[2]}&row=${row}&action=approve&level=coo" style="${btnStyleApprove}">APPROVE</a>
          <a href="${url}?reqId=${data[2]}&row=${row}&action=decline&level=coo" style="${btnStyleDecline}">DECLINE</a>
        </div>
      </div>
    </div>`;

  MailApp.sendEmail({ to: COO_EMAIL, name: "Personnel Requisition", subject: `Final Approval: Personnel Requisition - ${data[6]}`, htmlBody: htmlBody });
}

function sendUnifiedStatusEmail(row, decision, actor) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Personnel Requisition Tracker");
  var data = sheet.getRange(row, 1, 1, 27).getValues()[0];
  var displayValues = sheet.getRange(row, 1, 1, 27).getDisplayValues()[0];

  var isDeclined = decision.toLowerCase().includes("decline");
  var statusTextColor = isDeclined ? COLORS.dangerText : COLORS.successText;
  var statusBgColor = isDeclined ? COLORS.dangerBg : COLORS.successBg;

  function getBody(recipientName, message) {
    return `<div style="font-family:'Segoe UI', sans-serif; background-color:${COLORS.bg}; padding:40px 10px;"><div style="max-width:500px; margin:auto; background-color:${COLORS.white}; border-radius:12px; box-shadow: 0 5px 20px rgba(0,0,0,0.05); overflow:hidden;"><div style="background:${COLORS.primary}; padding:20px; text-align:center;"><h2 style="color:white; margin:0; font-size:18px;">STATUS UPDATE</h2></div><div style="padding:30px;"><p>Hi <b>${recipientName}</b>,</p><p>${message}</p><div style="text-align:center; margin:25px 0;"><div style="display:inline-block; padding:10px 25px; border-radius:50px; background-color:${statusBgColor}; color:${statusTextColor}; font-weight:bold;">${decision.toUpperCase()}</div></div>${generateSummaryTable(data, displayValues)}</div></div></div>`;
  }

  if (data[1]) MailApp.sendEmail({to: data[1], name: "Personnel Requisition", subject: `Update: ${decision}`, htmlBody: getBody(data[3], `Your request has been <b>${decision}</b> by the ${actor}.`)});

  if (actor === "COO" && data[10]) {
      MailApp.sendEmail({to: data[10], name: "Personnel Requisition", subject: `Update: ${decision}`, htmlBody: getBody(data[9], `The request by ${data[3]} has been <b>${decision}</b> by the ${actor}.`)});
  }

  MailApp.sendEmail({to: ADMIN_EMAIL, name: "Personnel Requisition", subject: `System Alert: ${decision}`, htmlBody: getBody("Admin", `Request ID ${data[2]} marked as ${decision}.`)});
}
