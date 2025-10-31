document.getElementById('logout-button').addEventListener('click',async()=>{
    try {
        const responce=await axios.post("/admin/logout");
        if(responce.data.success){
            Toastify({
                text: responce.data.message,
                duration: 2000,
                gravity: "top",
                position: "right",
                backgroundColor: "#00b09b",
            }).showToast();

            setTimeout(() => {
                window.location.href = responce.data.redirect;
            }, 1100);
        }
    } catch (error) {
        Toastify({
            text: error.response?.data?.message || "Logout failed ❌",
            duration: 1000,
            gravity: "top",
            position: "right",
            backgroundColor: "#e74c3c",
        }).showToast();
    }
})