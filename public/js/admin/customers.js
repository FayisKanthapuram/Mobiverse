document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".unblock-btn , .block-btn").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.preventDefault();
      const target = event.currentTarget;
      const customerId = target.dataset.customerId;
      const isBlocked = target.dataset.isBlocked === "true";

      
      if(!isBlocked&&!confirm("Are you sure you want to block this customer?"))
        return;
    
      target.disabled=true;
    
      try {
        const response = await axios.patch(
          `/admin/customer/block/${customerId}`
        );
        if (response.data.success) {
          target.dataset.isBlocked = (!isBlocked).toString();
          let activeCount=Number(document.getElementById('active-count').textContent);
          let blockCount=Number(document.getElementById('block-count').textContent);
          if (isBlocked) {
            activeCount++;
            blockCount--;
            target.textContent = "Block";
            target.classList.replace("unblock-btn","block-btn");
          } else {
            activeCount--;
            blockCount++;
            target.textContent = "Unblock";
            target.classList.replace("block-btn", "unblock-btn");
          }
          document.getElementById('active-count').textContent=activeCount;
          document.getElementById('block-count').textContent=blockCount;

          const badge = document.querySelector(
            `[data-customer-status][data-customer-id="${customerId}"]`
          );

          if(badge){
            badge.textContent=isBlocked?"Active":"Blocked";
            badge.classList.toggle('status-blocked',!isBlocked);
            badge.classList.toggle('status-active',isBlocked);
          }

          Toastify({
            text: !isBlocked ? "Customer Blocked" : "Customer Unblocked",
            duration: 1500,
            gravity: "top",
            position: "right",
            style: {
              background: !isBlocked
                ? "#e74c3c"
                : "linear-gradient(to right, #00b09b, #96c93d)",
            },
          }).showToast();
        }
      } catch (error) {
        console.log(error);
        Toastify({
          text: error.response?.data?.message || "Something went wrong",
          duration: 2000,
          gravity: "top",
          position: "right",
          style: { background: "#e74c3c" },
        }).showToast();
      }finally{
        target.disabled=false;
      }
    });
  });
});

function changePage(page) {
  const url = new URL(window.location);
  url.searchParams.set("page", page);
  window.location.href = url.href;
}