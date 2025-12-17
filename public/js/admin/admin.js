document.getElementById('logout-button').addEventListener('click',async()=>{
    try {
        const responce=await axios.post("/admin/logout");
        if(responce.data.success){
            sessionStorage.setItem("toastSuccess", responce.data.message);
            window.location.href = responce.data.redirect;
        }
    } catch (error) {
        Toastify({
            text: error.response?.data?.message || "Logout failed ❌",
            duration: 1000,
            gravity: "bottom",
            position: "right",
            backgroundColor: "#e74c3c",
        }).showToast();
    }
})