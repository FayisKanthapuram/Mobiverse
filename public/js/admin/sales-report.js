/* ---------------- APPLY FILTERS ---------------- */
function applyFilters() {
  const reportType = document.getElementById("reportType").value;
  const startDate = document.getElementById("startDate")?.value || "";
  const endDate = document.getElementById("endDate")?.value || "";

  const customRange1 = document.getElementById("customDateRange");
  const customRange2 = document.getElementById("customDateRange2");

  if (reportType === "custom") {
    customRange1.style.display = "";
    customRange2.style.display = "";
  } else {
    customRange1.style.display = "none";
    customRange2.style.display = "none";
  }

  const params = new URLSearchParams();
  params.set("reportType", reportType);

  if (reportType === "custom") {
    params.set("startDate", startDate);
    params.set("endDate", endDate);
  }

  window.location.href = "/admin/sales-report?" + params.toString();
}

/* ---------------- CLEAR FILTERS ---------------- */
function clearFilters() {
  window.location.href = "/admin/sales-report";
}

/* ---------------- PAGINATION ---------------- */
function changePage(page) {
  const params = new URLSearchParams(window.location.search);
  params.set("page", page);
  window.location.href = "/admin/sales-report?" + params.toString();
}

/* =================================================
   PDF DOWNLOAD WITH MODAL
================================================= */

/* 🔹 Open modal instead of direct download */
function downloadPDF() {
  openPdfModal();
}

/* 🔹 Open modal */
function openPdfModal() {
  buildPdfLimitOptions();
  document.getElementById("pdfModal").classList.remove("hidden");
}


/* 🔹 Close modal */
function closePdfModal() {
  document.getElementById("pdfModal").classList.add("hidden");
}

/* 🔹 Show warning for large limits */
document.getElementById("pdfLimit")?.addEventListener("change", (e) => {
  const limit = Number(e.target.value);
  const warning = document.getElementById("pdfWarning");

  if (limit >= 10000) {
    warning.classList.remove("hidden");
  } else {
    warning.classList.add("hidden");
  }
});


/* 🔹 Confirm & download PDF */
function confirmPdfDownload() {
  const select = document.getElementById("pdfLimit");
  let limit = Number(select.value);

  // ✅ HARD GUARD
  if (!Number.isInteger(limit) || limit <= 0) {
    alert("No orders available for PDF download");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  params.set("limit", limit);

  closePdfModal();

  window.location.href = `/admin/sales-report/pdf?${params.toString()}`;
}


/* ---------------- BUILD PDF LIMIT OPTIONS ---------------- */
function buildPdfLimitOptions() {
  const select = document.getElementById("pdfLimit");
  const warning = document.getElementById("pdfWarning");

  if (!select) return;

  select.innerHTML = "";

  const total = Number(window.TOTAL_ORDERS || 0);

  // Edge case: no orders
  if (total === 0) {
    const opt = document.createElement("option");
    opt.value = 0;
    opt.textContent = "No orders available";
    select.appendChild(opt);
    select.disabled = true;
    return;
  }

  const limits = [100, 500, 1000, 5000, 10000, 50000, 100000];

  const validLimits = limits.filter(l => l <= total);

  validLimits.forEach(l => {
    const opt = document.createElement("option");
    opt.value = l;
    opt.textContent =
      l >= 10000
        ? `${l.toLocaleString()} orders ⚠️`
        : `${l.toLocaleString()} orders`;

    select.appendChild(opt);
  });

  // If total < 100, auto-select total
  if (total < 100) {
    const opt = document.createElement("option");
    opt.value = total;
    opt.textContent = `${total} orders (All)`;
    select.appendChild(opt);
    select.value = total;
  } else {
    select.value = validLimits[0];
  }

  warning.classList.add("hidden");
  select.disabled = false;
}


/* =================================================
   EXCEL DOWNLOAD (UNCHANGED)
================================================= */
async function downloadExcel() {
  const params = new URLSearchParams(window.location.search);
  const url = "/admin/sales-report/excel?" + params.toString();

  try {
    const response = await fetch(url);

    // ❌ No data / validation error
    if (!response.ok) {
      const error = await response.json();
      alert(error.message || "No sales data available");
      return;
    }

    // ✅ Valid Excel file
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "delivered-sales-report.xlsx";
    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.error(err);
    alert("Failed to download report");
  }
}

