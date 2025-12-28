// ========================================
// REFERRAL CODE FUNCTIONS
// ========================================

function copyReferralCode() {
  const code = window.referralData.referralCode;

  if (!code) {
    showToast("No referral code available", "error");
    return;
  }

  navigator.clipboard
    .writeText(code)
    .then(() => {
      showToast("Referral code copied to clipboard!", "success");
    })
    .catch(() => {
      showToast("Failed to copy code", "error");
    });
}

// ========================================
// SHARE FUNCTIONS
// ========================================

function shareViaWhatsApp() {
  const code = window.referralData.referralCode;
  const siteUrl = window.referralData.siteUrl || window.location.origin;

  const message = `Hey! Join Mobiverse using my referral code ${code} and we both get rewards! 🎁 Shop for amazing mobile phones at great prices. Sign up now: ${siteUrl}/signup?ref=${code}`;

  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

function shareViaEmail() {
  const code = window.referralData.referralCode;
  const siteUrl = window.referralData.siteUrl || window.location.origin;

  const subject = "Join Mobiverse and Get Rewards!";
  const body = `Hi there!\n\nI've been shopping at Mobiverse and thought you'd love it too!\n\nUse my referral code: ${code} when you sign up and we both get rewards.\n\nCheck it out: ${siteUrl}/signup?ref=${code}\n\nHappy Shopping!\n`;

  const url = `mailto:?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
}

function shareViaSMS() {
  const code = window.referralData.referralCode;
  const siteUrl = window.referralData.siteUrl || window.location.origin;

  const message = `Join Mobiverse using my code ${code} and get rewards! ${siteUrl}/signup?ref=${code}`;

  const url = `sms:?body=${encodeURIComponent(message)}`;
  window.location.href = url;
}

// ========================================
// PAGINATION FUNCTION
// ========================================

function changeReferralPage(page) {
  const url = new URL(window.location.href);
  url.searchParams.set("page", page);
  window.location.href = url.toString();
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function showToast(message, type) {
  if (typeof Toastify !== "undefined") {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "bottom",
      position: "right",
      style: {
        background: type === "success" ? "#10B981" : "#EF4444",
      },
    }).showToast();
  } else {
    alert(message);
  }
}
