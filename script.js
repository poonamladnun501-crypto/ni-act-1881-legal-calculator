/* =========================================================
   NI ACT 1881
   SECTION 138 LIMITATION CALCULATOR
   ========================================================= */


/* =========================================================
   ELEMENTS
   ========================================================= */

   const chequeDate = document.getElementById("chequeDate");
   const presentationDate = document.getElementById("presentationDate");
   const dishonourDate = document.getElementById("dishonourDate");
   const noticeDate = document.getElementById("noticeDate");
   
   const servedDate = document.getElementById("servedDate");
   const presumptionDate = document.getElementById("presumptionDate");
   
   const filingDate = document.getElementById("filingDate");
   
   const servedDateRow = document.getElementById("servedDateRow");
   const presumptionDateRow = document.getElementById("presumptionDateRow");
   
   const chequeValidity = document.getElementById("chequeValidity");
   const presentationStatus = document.getElementById("presentationStatus");
   const noticeStatus = document.getElementById("noticeStatus");
   
   const resultBox = document.getElementById("resultBox");
   const resultTitle = document.getElementById("resultTitle");
   const resultMessage = document.getElementById("resultMessage");
   
   
   /*
       The payment period end, cause of action and complaint
       limitation dates are no longer shown as boxes on the page.
       The calculation still runs internally, and the complaint
       limitation date is stored here for the filing result.
   */
   
   let complaintLimitValue = null;
   let causeOfActionValue = null;
   
   
   /* =========================================================
      TIMELINE ELEMENTS
      ========================================================= */
   
   const timelineCheque = document.getElementById("timelineCheque");
   const timelinePresentation = document.getElementById("timelinePresentation");
   const timelineDishonour = document.getElementById("timelineDishonour");
   const timelineNotice = document.getElementById("timelineNotice");
   const timelineService = document.getElementById("timelineService");
   const timelineComplaint = document.getElementById("timelineComplaint");
   
   
   /* =========================================================
      DATE FUNCTIONS
      ========================================================= */
   
   
   /*
       Convert DD-MM-YYYY into a JavaScript Date.
   
       We deliberately do NOT use:
       new Date("21-06-2025")
   
       because that format is unreliable in browsers.
   
       Instead we manually parse:
       DD-MM-YYYY
   */
   
   function parseDate(value) {
   
       if (!value) {
           return null;
       }
   
       const parts = value.trim().split("-");
   
       if (parts.length !== 3) {
           return null;
       }
   
       const day = Number(parts[0]);
       const month = Number(parts[1]);
       const year = Number(parts[2]);
   
       if (
           !Number.isInteger(day) ||
           !Number.isInteger(month) ||
           !Number.isInteger(year)
       ) {
           return null;
       }
   
       if (year < 1000 || year > 9999) {
           return null;
       }
   
       if (month < 1 || month > 12) {
           return null;
       }
   
       const date = new Date(year, month - 1, day);
   
       /*
           This prevents invalid dates such as:
   
           31-02-2025
           45-05-2025
       */
   
       if (
           date.getFullYear() !== year ||
           date.getMonth() !== month - 1 ||
           date.getDate() !== day
       ) {
           return null;
       }
   
       /*
           Remove time component.
       */
   
       date.setHours(0, 0, 0, 0);
   
       return date;
   }
   
   
   /*
       Convert JavaScript Date into DD-MM-YYYY
   */
   
   function formatDate(date) {
   
       if (!date || isNaN(date.getTime())) {
           return "";
       }
   
       const day = String(date.getDate()).padStart(2, "0");
       const month = String(date.getMonth() + 1).padStart(2, "0");
       const year = date.getFullYear();
   
       return `${day}-${month}-${year}`;
   }
   
   
   /*
       Add days to a date.
   */
   
   function addDays(date, days) {
   
       const result = new Date(date);
   
       result.setDate(result.getDate() + days);
   
       return result;
   }
   
   
   /*
       Add calendar months.
   
       This is safer than adding a fixed number of days.
   */
   
   function addMonths(date, months) {
   
       const result = new Date(date);
   
       const originalDay = result.getDate();
   
       result.setDate(1);
   
       result.setMonth(result.getMonth() + months);
   
       /*
           Handle dates such as 31 January + 1 month.
       */
   
       const lastDay = new Date(
           result.getFullYear(),
           result.getMonth() + 1,
           0
       ).getDate();
   
       result.setDate(Math.min(originalDay, lastDay));
   
       return result;
   }
   
   
   /*
       Compare dates.
   
       Returns:
          -1 = first date before second
           0 = same
           1 = first date after second
   */
   
   function compareDates(a, b) {
   
       const first = new Date(a);
       const second = new Date(b);
   
       first.setHours(0, 0, 0, 0);
       second.setHours(0, 0, 0, 0);
   
       if (first < second) return -1;
       if (first > second) return 1;
   
       return 0;
   }
   
   
   /*
       Difference in days.
   */
   
   function daysBetween(start, end) {
   
       const a = new Date(start);
       const b = new Date(end);
   
       a.setHours(0, 0, 0, 0);
       b.setHours(0, 0, 0, 0);
   
       const milliseconds = b - a;
   
       return Math.round(
           milliseconds / (1000 * 60 * 60 * 24)
       );
   }
   
   
   /* =========================================================
      INPUT FORMAT
      ========================================================= */
   
   
   /*
       Automatically format:
   
       21062025
   
       into:
   
       21-06-2025
   */
   
   function formatDateInput(event) {
   
       let value = event.target.value.replace(/\D/g, "");
   
       if (value.length > 8) {
           value = value.substring(0, 8);
       }
   
       if (value.length >= 5) {
   
           value =
               value.substring(0, 2) +
               "-" +
               value.substring(2, 4) +
               "-" +
               value.substring(4);
   
       } else if (value.length >= 3) {
   
           value =
               value.substring(0, 2) +
               "-" +
               value.substring(2);
   
       }
   
       event.target.value = value;
   
       calculate();
   }
   
   
   /*
       Apply date formatting to every date input.
   */
   
   document
       .querySelectorAll(".date-input")
       .forEach(input => {
   
           input.addEventListener(
               "input",
               formatDateInput
           );
   
       });
   
   
   /* =========================================================
      CLEAR CALCULATED VALUES
      ========================================================= */
   
   function clearCalculatedValues() {
   
       chequeValidity.textContent =
           "Cheque validity endpoint —";
   
       presentationStatus.textContent =
           "—";
   
       noticeStatus.textContent =
           "—";
   
       presumptionDate.value = "";
   
       complaintLimitValue = null;
   
       causeOfActionValue = null;
   
   }
   
   
   /* =========================================================
      CHEQUE VALIDITY
      ========================================================= */
   
   
   /*
       Cheques are generally presented within
       three months from the date of the cheque
       under the applicable banking validity rule.
   
       This calculator displays the three-month endpoint.
   
       Example:
   
       20-01-2025
             +
          3 months
             =
       20-04-2025
   */
   
   function calculateChequeValidity() {
   
       const cheque = parseDate(
           chequeDate.value
       );
   
       if (!cheque) {
   
           chequeValidity.textContent =
               "Cheque validity endpoint —";
   
           return null;
       }
   
       const endpoint = addMonths(
           cheque,
           3
       );
   
       chequeValidity.textContent =
           "Cheque validity endpoint: " +
           formatDate(endpoint);
   
       return endpoint;
   }
   
   
   /* =========================================================
      PRESENTATION CHECK
      ========================================================= */
   
   function calculatePresentation() {
   
       const cheque = parseDate(
           chequeDate.value
       );
   
       const presentation = parseDate(
           presentationDate.value
       );
   
       if (!cheque || !presentation) {
   
           presentationStatus.textContent =
               "—";
   
           return;
       }
   
       const validity = addMonths(
           cheque,
           3
       );
   
       if (compareDates(presentation, validity) <= 0) {
   
           presentationStatus.textContent =
               "Presentation is within the displayed cheque validity period.";
   
           presentationStatus.style.color =
               "#126b2f";
   
       } else {
   
           presentationStatus.textContent =
               "Presentation is after the displayed cheque validity endpoint.";
   
           presentationStatus.style.color =
               "#a91515";
       }
   }
   
   
   /* =========================================================
      NOTICE PERIOD CHECK
      ========================================================= */
   
   
   /*
       Under Section 138(b), statutory notice is required
       within 30 days of receipt of information regarding
       dishonour.
   
       This calculator therefore checks:
   
           Notice Date
           <=
           Dishonour Intimation + 30 days
   */
   
   function calculateNoticePeriod() {
   
       const dishonour = parseDate(
           dishonourDate.value
       );
   
       const notice = parseDate(
           noticeDate.value
       );
   
       if (!dishonour || !notice) {
   
           noticeStatus.textContent = "—";
   
           return;
       }
   
       const lastNoticeDate = addDays(
           dishonour,
           30
       );
   
       if (
           compareDates(
               notice,
               lastNoticeDate
           ) <= 0
       ) {
   
           noticeStatus.textContent =
               "Notice is within the displayed 30-day period.";
   
           noticeStatus.style.color =
               "#126b2f";
   
       } else {
   
           noticeStatus.textContent =
               "Notice is after the displayed 30-day period.";
   
           noticeStatus.style.color =
               "#a91515";
       }
   }
   
   
   /* =========================================================
      SERVICE / PRESUMPTION
      ========================================================= */
   
   function getSelectedServiceType() {
   
       const selected =
           document.querySelector(
               'input[name="serviceType"]:checked'
           );
   
       return selected
           ? selected.value
           : "served";
   }
   
   
   /*
       Presumption-date workflow.
   
       Per your requested application design:
   
       Notice Issued / Sent
                 +
              30 days
                 =
          Presumption Date
   
       IMPORTANT:
       This is an APPLICATION CONVENTION, not a universal
       statement that legal service is automatically presumed
       exactly 30 days after every dispatch.
   */
   
   function calculatePresumptionDate() {
   
       const notice = parseDate(
           noticeDate.value
       );
   
       if (!notice) {
   
           presumptionDate.value = "";
   
           return null;
       }
   
       const calculated =
           addDays(notice, 30);
   
       presumptionDate.value =
           formatDate(calculated);
   
       return calculated;
   }
   
   
   /*
       Determine the date used for the 15-day payment period.
   */
   
   function getApplicableServiceDate() {
   
       const type =
           getSelectedServiceType();
   
   
       /* ACTUAL SERVICE */
   
       if (type === "served") {
   
           return parseDate(
               servedDate.value
           );
       }
   
   
       /* PRESUMPTION */
   
       return calculatePresumptionDate();
   }
   
   
   /* =========================================================
      MAIN LIMITATION CALCULATION
      ========================================================= */
   
   function calculateLimitation() {
   
       const serviceDate =
           getApplicableServiceDate();
   
   
       if (!serviceDate) {
   
           complaintLimitValue = null;
   
           causeOfActionValue = null;
   
           return;
       }
   
   
       /*
           The drawer gets 15 days to make payment.
   
           Example:
   
           Service:
           21-07-2025
   
           15-day period:
           05-08-2025
   
           Cause of action:
           06-08-2025
   
       */
   
       const paymentEnd =
           addDays(serviceDate, 15);
   
   
       const causeOfAction =
           addDays(paymentEnd, 1);
   
   
       /*
           Section 142(b) provides one month for
           making the complaint from the date on
           which the cause of action arises,
           subject to the statutory proviso.
   
           We therefore use calendar-month addition,
           not a fixed 30-day approximation.
       */
   
       const limitation =
           addMonths(causeOfAction, 1);
   
   
       complaintLimitValue = limitation;
   
       causeOfActionValue = causeOfAction;
   
   }
   
   
   /* =========================================================
      FILING RESULT
      ========================================================= */
   
   /*
       Collect every rule that has been broken.
   
       Section 138(a)      cheque presented within 3 months of its date
       Section 138(b)      notice within 30 days of information of dishonour
       Section 138(c)      drawer has 15 days from receipt of notice to pay
       Section 142(1)(b)   complaint within one month of the cause of action
   
       The cause of action arises only AFTER the 15-day payment period
       ends, so a complaint filed before that date is premature.
   */
   
   function getRuleBreaches() {
   
       const breaches = [];
   
       const cheque = parseDate(chequeDate.value);
       const presentation = parseDate(presentationDate.value);
       const dishonour = parseDate(dishonourDate.value);
       const notice = parseDate(noticeDate.value);
       const filing = parseDate(filingDate.value);
   
   
       if (
           cheque &&
           presentation &&
           compareDates(presentation, addMonths(cheque, 3)) > 0
       ) {
   
           breaches.push(
               "Cheque was presented after its 3-month validity period (Section 138(a))."
           );
       }
   
   
       if (
           dishonour &&
           notice &&
           compareDates(notice, addDays(dishonour, 30)) > 0
       ) {
   
           breaches.push(
               "Notice was issued more than 30 days after information of dishonour (Section 138(b))."
           );
       }
   
   
       if (
           filing &&
           causeOfActionValue &&
           compareDates(filing, causeOfActionValue) < 0
       ) {
   
           breaches.push(
               "Complaint is premature: it was filed before the cause of action arose on " +
               formatDate(causeOfActionValue) +
               ", because the 15-day payment period had not ended (Section 138(c))."
           );
       }
   
   
       if (
           filing &&
           complaintLimitValue &&
           compareDates(filing, complaintLimitValue) > 0
       ) {
   
           breaches.push(
               "Complaint was filed after the one-month limitation date of " +
               formatDate(complaintLimitValue) +
               " (Section 142(1)(b)). The delay can be condoned only if the Court finds sufficient cause."
           );
       }
   
       return breaches;
   }
   
   
   function calculateFilingResult() {
   
       const filing =
           parseDate(filingDate.value);
   
       const limitation =
           complaintLimitValue;
   
       resultBox.classList.add("hidden");
   
       resultBox.classList.remove(
           "result-green",
           "result-red",
           "result-warning"
       );
   
   
       if (!filing || !limitation) {
           return;
       }
   
   
       resultBox.classList.remove("hidden");
   
   
       const breaches = getRuleBreaches();
   
   
       if (breaches.length === 0) {
   
           resultBox.classList.add(
               "result-green"
           );
   
           resultTitle.textContent =
               "Complaint is within the limitation date.";
   
           resultMessage.textContent =
               "All entered dates satisfy the time limits of Sections 138 and 142.";
   
       } else {
   
           resultBox.classList.add(
               "result-red"
           );
   
           resultTitle.textContent =
               "Complaint does not satisfy the Section 138 / 142 time limits.";
   
           resultMessage.textContent =
               breaches.join("\n");
   
       }
   
   }
   
   
   /* =========================================================
      TIMELINE
      ========================================================= */
   
   /*
       Colour the timeline steps.
   
       Green = the step follows the rule.
       Red   = the step breaks the rule.
       No colour = not enough dates entered to judge.
   */
   
   function setStepStatus(span, status) {
   
       const step = span.parentElement;
   
       step.classList.remove("step-ok", "step-bad");
   
       if (status === "ok") {
           step.classList.add("step-ok");
       } else if (status === "bad") {
           step.classList.add("step-bad");
       }
   }
   
   
   function updateTimelineColors() {
   
       const cheque = parseDate(chequeDate.value);
       const presentation = parseDate(presentationDate.value);
       const dishonour = parseDate(dishonourDate.value);
       const notice = parseDate(noticeDate.value);
       const filing = parseDate(filingDate.value);
       const serviceDate = getApplicableServiceDate();
   
   
       /* 1. CHEQUE */
   
       setStepStatus(
           timelineCheque,
           cheque ? "ok" : null
       );
   
   
       /* 2. PRESENTATION - within 3 months of cheque date */
   
       if (cheque && presentation) {
   
           setStepStatus(
               timelinePresentation,
               compareDates(presentation, addMonths(cheque, 3)) <= 0
                   ? "ok"
                   : "bad"
           );
   
       } else {
   
           setStepStatus(timelinePresentation, null);
       }
   
   
       /* 3. DISHONOUR */
   
       setStepStatus(
           timelineDishonour,
           dishonour ? "ok" : null
       );
   
   
       /* 4. NOTICE - within 30 days of dishonour intimation */
   
       if (dishonour && notice) {
   
           setStepStatus(
               timelineNotice,
               compareDates(notice, addDays(dishonour, 30)) <= 0
                   ? "ok"
                   : "bad"
           );
   
       } else {
   
           setStepStatus(timelineNotice, null);
       }
   
   
       /* 5. SERVICE */
   
       setStepStatus(
           timelineService,
           serviceDate ? "ok" : null
       );
   
   
       /* 6. COMPLAINT - within limitation date */
   
       if (filing && complaintLimitValue && causeOfActionValue) {
   
           setStepStatus(
               timelineComplaint,
               (
                   compareDates(filing, causeOfActionValue) >= 0 &&
                   compareDates(filing, complaintLimitValue) <= 0
               )
                   ? "ok"
                   : "bad"
           );
   
       } else {
   
           setStepStatus(timelineComplaint, null);
       }
   }
   
   
   function updateTimeline() {
   
       timelineCheque.textContent =
           chequeDate.value || "—";
   
       timelinePresentation.textContent =
           presentationDate.value || "—";
   
       timelineDishonour.textContent =
           dishonourDate.value || "—";
   
       timelineNotice.textContent =
           noticeDate.value || "—";
   
   
       const serviceType =
           getSelectedServiceType();
   
   
       if (serviceType === "served") {
   
           timelineService.textContent =
               servedDate.value || "—";
   
       } else {
   
           timelineService.textContent =
               presumptionDate.value || "—";
       }
   
   
       timelineComplaint.textContent =
           filingDate.value || "—";
   
       updateTimelineColors();
   }
   
   
   /* =========================================================
      RADIO BUTTON HANDLING
      ========================================================= */
   
   document
       .querySelectorAll(
           'input[name="serviceType"]'
       )
       .forEach(radio => {
   
           radio.addEventListener(
               "change",
               function () {
   
                   const type =
                       getSelectedServiceType();
   
   
                   if (type === "served") {
   
                       servedDateRow.classList.remove(
                           "hidden"
                       );
   
                       presumptionDateRow.classList.add(
                           "hidden"
                       );
   
                   } else {
   
                       servedDateRow.classList.add(
                           "hidden"
                       );
   
                       presumptionDateRow.classList.remove(
                           "hidden"
                       );
   
                       calculatePresumptionDate();
                   }
   
                   calculate();
   
               }
           );
   
       });
   
   
   /* =========================================================
      MAIN CALCULATE FUNCTION
      ========================================================= */
   
   function calculate() {
   
       calculateChequeValidity();
   
       calculatePresentation();
   
       calculateNoticePeriod();
   
       calculateLimitation();
   
       calculateFilingResult();
   
       updateTimeline();
   
   }
   
   
   /* =========================================================
      LISTENERS
      ========================================================= */
   
   [
       chequeDate,
       presentationDate,
       dishonourDate,
       noticeDate,
       servedDate,
       filingDate
   ].forEach(input => {
   
       input.addEventListener(
           "input",
           calculate
       );
   
   });
   
   
   /* =========================================================
      FONT SIZE CONTROLS
      ========================================================= */
   
   let fontScale = 1;
   
   
   document
       .getElementById("fontPlus")
       .addEventListener(
           "click",
           function () {
   
               fontScale =
                   Math.min(
                       fontScale + 0.08,
                       1.25
                   );
   
               document.documentElement.style.fontSize =
                   `${fontScale}em`;
   
           }
       );
   
   
   document
       .getElementById("fontNormal")
       .addEventListener(
           "click",
           function () {
   
               fontScale = 1;
   
               document.documentElement.style.fontSize =
                   "1em";
   
           }
       );
   
   
   document
       .getElementById("fontMinus")
       .addEventListener(
           "click",
           function () {
   
               fontScale =
                   Math.max(
                       fontScale - 0.08,
                       0.85
                   );
   
               document.documentElement.style.fontSize =
                   `${fontScale}em`;
   
           }
       );
   
   
   /* =========================================================
      ACTION BUTTONS
      ========================================================= */
   
   
   /* CALCULATE LIMITATION */
   
   document
       .getElementById("calculateBtn")
       .addEventListener(
           "click",
           function () {
   
               calculate();
   
               if (
                   !complaintLimitValue ||
                   !parseDate(filingDate.value)
               ) {
   
                   resultBox.classList.remove(
                       "hidden",
                       "result-green",
                       "result-red"
                   );
   
                   resultBox.classList.add(
                       "result-warning"
                   );
   
                   resultTitle.textContent =
                       "Please complete the required dates.";
   
                   resultMessage.textContent =
                       "Enter the notice date (served, or issued/sent for presumption) and the date of filing complaint to see the result.";
               }
   
           }
       );
   
   
   /* RESET */
   
   document
       .getElementById("resetBtn")
       .addEventListener(
           "click",
           function () {
   
               document
                   .querySelectorAll(".date-input")
                   .forEach(input => {
                       input.value = "";
                   });
   
               document.querySelector(
                   'input[name="serviceType"][value="served"]'
               ).checked = true;
   
               servedDateRow.classList.remove("hidden");
               presumptionDateRow.classList.add("hidden");
   
               clearCalculatedValues();
   
               presentationStatus.style.color = "";
               noticeStatus.style.color = "";
   
               calculate();
   
           }
       );
   
   
   /* LOAD EXAMPLE */
   
   document
       .getElementById("exampleBtn")
       .addEventListener(
           "click",
           function () {
   
               chequeDate.value = "01-01-2025";
               presentationDate.value = "15-01-2025";
               dishonourDate.value = "20-01-2025";
               noticeDate.value = "25-01-2025";
               servedDate.value = "28-01-2025";
               filingDate.value = "10-03-2025";
   
               document.querySelector(
                   'input[name="serviceType"][value="served"]'
               ).checked = true;
   
               servedDateRow.classList.remove("hidden");
               presumptionDateRow.classList.add("hidden");
   
               calculate();
   
           }
       );
   
   
   /* PRINT RESULT */
   
   document
       .getElementById("printBtn")
       .addEventListener(
           "click",
           function () {
   
               window.print();
   
           }
       );
   
   
   /* =========================================================
      INITIAL STATE
      ========================================================= */
   
   document.addEventListener(
       "DOMContentLoaded",
       function () {
   
           servedDateRow.classList.remove(
               "hidden"
           );
   
           presumptionDateRow.classList.add(
               "hidden"
           );
   
           clearCalculatedValues();
   
           updateTimeline();
   
       }
   );