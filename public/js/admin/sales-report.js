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

function clearFilters() {
  window.location.href = "/admin/sales-report";
}

function changePage(page) {
  const params = new URLSearchParams(window.location.search);
  params.set("page", page);
  window.location.href = "/admin/sales-report?" + params.toString();
}

function downloadPDF() {
  const params = new URLSearchParams(window.location.search);
  window.open("/admin/sales-report/pdf?" + params.toString(), "_blank");
}


function downloadExcel() {
  const params = new URLSearchParams(window.location.search);
  params.set("format", "excel");
  window.location.href = "/admin/sales-report/download?" + params.toString();
}
