 //Add product 
 document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".forms-sample");
    const imageInputs = [
      document.getElementById("image1"),
      document.getElementById("image2"),
      document.getElementById("image3"),
    ];
    const cropContainer = document.getElementById("crop-container");
    const cropImage = document.getElementById("crop-image");
    const cropButton = document.getElementById("crop-button");
    let cropper;
    let currentInput;
    let currentPreview;
    let croppedImagesData = {};

    imageInputs.forEach((input) => {
      input.addEventListener("change", function (event) {
        document.getElementById("crop-button").style.display = "block";
        currentPreview = document.getElementById(
          `image-preview${imageInputs.indexOf(input) + 1}`
        );
        currentPreview.src = '';
        currentInput = input;
        const file = event.target.files[0];
        input.value = '';
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            cropImage.src = e.target.result;
            cropContainer.style.display = "block";
            if (cropper) {
              cropper.destroy();
            }
            cropper = new Cropper(cropImage, {
              aspectRatio: 0.72,
              viewMode: 1,
              movable: false,
              zoomable: false,
              rotatable: false,
              scalable: false,
            });
          };
          reader.readAsDataURL(file);
        }
      });
    });

    cropButton.addEventListener("click", () => {
      if (cropper) {
        const canvas = cropper.getCroppedCanvas();
        const croppedImageDataURL = canvas.toDataURL();
        cropContainer.style.display = "none";

        currentPreview.src = croppedImageDataURL;
        currentPreview.style.maxWidth = "100%";

        const inputName = currentInput.getAttribute("name");
        croppedImagesData[inputName] = dataURLtoBlob(croppedImageDataURL);
      }
    });

    function dataURLtoBlob(dataurl) {
      let arr = dataurl.split(","),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const productName = document.getElementById("productName").value.trim();
      const productPrice = document.getElementById("productPrice").value.trim();
      const productQuantity = document
        .getElementById("productQuantity")
        .value.trim();
      const productDescription = document
        .getElementById("productDescription")
        .value.trim();
      const brand = document.getElementById("brands").value.trim();
      const category = document.getElementById("Categories").value.trim();

      let errorMessage = "";

      if (!productName) {
        errorMessage += "Product Name is required.<br>";
      }
      if (!productPrice || isNaN(productPrice) || productPrice <= 0) {
        errorMessage += "Please enter a valid Product Price.<br>";
      }
      if (!productQuantity || isNaN(productQuantity) || productQuantity <= 0) {
        errorMessage += "Please enter a valid Product Quantity.<br>";
      }
      if (!productDescription) {
        errorMessage += "Product Description is required.<br>";
      }
      if (!brand) {
        errorMessage += "Brand is required.<br>";
      }
      if (!category) {
        errorMessage += "Category is required.<br>";
      }
      if (!croppedImagesData["image1"]) {
        errorMessage += "Product Image 1 is required.<br>";
      }
      if (!croppedImagesData["image2"]) {
        errorMessage += "Product Image 2 is required.<br>";
      }
      if (!croppedImagesData["image3"]) {
        errorMessage += "Product Image 3 is required.<br>";
      }

      if (errorMessage) {
        Swal.fire({
          icon: "error",
          title: "Error",
          html: errorMessage,
        });
        return;
      }

      const formData = new FormData();
      formData.append("productname", productName);
      formData.append("productprice", productPrice);
      formData.append("productquantity", productQuantity);
      formData.append("productdescription", productDescription);
      formData.append("brands", brand);
      formData.append("Categories", category);

      
      Object.keys(croppedImagesData).forEach((key) => {
        formData.append(key, croppedImagesData[key], `${key}.png`);
      });

      
      const files = {
        image1: document.getElementById("image1").files[0],
        image2: document.getElementById("image2").files[0],
        image3: document.getElementById("image3").files[0],
      };
      
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          formData.append(key, file);
        }
      }

      try {
        const response = await fetch("/admin/AddProducts", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Success",
            text: "Product added successfully!",
          }).then(() => {
            window.location.href = "/admin/Products";
          });
        } else {
          const data = await response.json();
          Swal.fire({
            icon: "error",
            title: "Error",
            text: data.message,
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "An unexpected error occurred.",
        });
      }
    });
  });
 
 
 document.querySelectorAll('.unlist-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
        const brandId = btn.getAttribute('data-id');
        const action = btn.textContent.trim() === 'Unlist' ? 'unlist' : 'list';

        Swal.fire({
            title: `Are you sure you want to ${action} this brand?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: `Yes, ${action} it!`,
            cancelButtonText: 'Cancel',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`/admin/Brands/unlist/${brandId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                    const result = await response.json();
                    if (result.success) {
                        Swal.fire({
                            title: 'Success!',
                            text: `Brand has been ${result.isUnlisted ? 'unlisted' : 'listed'} successfully.`,
                            icon: 'success',
                            confirmButtonText: 'OK',
                        });
                        btn.textContent = result.isUnlisted ? 'List' : 'Unlist';
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: 'Failed to unlist/list brand.',
                            icon: 'error',
                            confirmButtonText: 'OK',
                        });
                    }
                } catch (error) {
                    console.error('Error:', error);
                    Swal.fire({
                        title: 'Error!',
                        text: 'Failed to unlist/list brand.',
                        icon: 'error',
                        confirmButtonText: 'OK',
                    });
                }
            }
        });
    });
});

