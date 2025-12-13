function applyFilters() {
  const reportType = document.getElementById("reportType").value;
  const startDate = document.getElementById("startDate")?.value || "";
  const endDate = document.getElementById("endDate")?.value || "";
  const statusFilter = document.getElementById("statusFilter").value;

  // Show/hide custom date inputs
  const customRange1 = document.getElementById("customDateRange");
  const customRange2 = document.getElementById("customDateRange2");
  if (reportType === "custom") {
    customRange1.style.display = "";
    customRange2.style.display = "";
  } else {
    customRange1.style.display = "none";
    customRange2.style.display = "none";
  }

  const urlParams = new URLSearchParams();
  urlParams.set("reportType", reportType);

  if (reportType === "custom" ) {
    urlParams.set("startDate", startDate);
    urlParams.set("endDate", endDate);
  }

  if (statusFilter) {
    urlParams.set("status", statusFilter);
  }

  window.location.href = "/admin/sales-report?" + urlParams.toString();
}

function clearFilters() {
  window.location.href = "/admin/sales-report";
}

function changePage(page) {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set("page", page);
  window.location.href = "/admin/sales-report?" + urlParams.toString();
}

function downloadPDF() {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set("format", "pdf");
  window.location.href = "/admin/sales-report/download?" + urlParams.toString();
}

function downloadExcel() {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set("format", "excel");
  window.location.href = "/admin/sales-report/download?" + urlParams.toString();
}
