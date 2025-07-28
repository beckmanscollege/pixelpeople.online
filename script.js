const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const modal = document.getElementById('modal');
const plusButton = document.getElementById('plus-button');
const captureButton = document.getElementById('capture');
const statusMessage = document.getElementById('status-message');
const imagesContainer = document.getElementById('images');
const pictureCountElement = document.getElementById('picture-count');
const closeModalButton = document.getElementById('close-modal');
const descriptionInput = document.createElement('textarea');

// Select the info button and info box
const infoButton = document.getElementById('info-button');
const infoBox = document.getElementById('info-box');

// Show the info box when the '?' button is clicked
infoButton.addEventListener('click', function(event) {
    event.stopPropagation(); // Prevent click from closing the box immediately
    infoBox.classList.toggle('visible'); // Toggle the visibility of the info box
});

// Hide the info box if clicking outside the button or the info box
document.addEventListener('click', function(event) {
    if (!infoButton.contains(event.target) && !infoBox.contains(event.target)) {
        infoBox.classList.remove('visible'); // Hide the info box if clicked outside
    }
});

// Prevent closing the info box if clicked inside it
infoBox.addEventListener('click', function(event) {
    event.stopPropagation(); // Prevent event bubbling
});


let pictureCount = 0;

// Add a description input to the modal
descriptionInput.placeholder = 'Enter a description...';
descriptionInput.style.marginTop = '10px';
descriptionInput.style.marginBottom = '20px';
descriptionInput.style.width = '90%';
descriptionInput.style.height = '50px';
document.getElementById('modal-content').appendChild(descriptionInput);

// Show modal when clicking on the + button
plusButton.addEventListener('click', () => {
  modal.classList.add('show');
  modal.classList.remove('hidden');
});

// Request access to the user's camera
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => console.error('Error accessing camera:', err));

// Capture and upload the image
captureButton.addEventListener('click', () => {
  const description = descriptionInput.value.trim();
  if (!description) {
    alert('Please enter a description before uploading.');
    return;
  }

  const context = canvas.getContext('2d');
  canvas.width = 40;
  canvas.height = 40;

  // Draw the video frame on the canvas
  context.drawImage(video, 0, 0, 40, 40);

  // Convert the canvas content to a Blob
  canvas.toBlob((blob) => {
    if (!blob) {
      console.error('Blob generation failed.');
      statusMessage.textContent = 'Failed to capture the image.';
      return;
    }

    const formData = new FormData();
    formData.append('image', blob, 'snapshot.png');
    formData.append('description', description);

    // Show uploading message
    statusMessage.textContent = 'Uploading...';

    fetch('https://pixelpeople-online.onrender.com/', {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          console.log('Description uploaded:', description); // Debug the uploaded description
          return response.json();
        } else {
          throw new Error('Upload failed');
        }
      })
      .then((data) => {
        console.log('Upload response data:', data); // Debug server response
        if (data.success) {
          statusMessage.textContent = 'Upload Successful!';
          loadGallery(); // Refresh the gallery
          descriptionInput.value = ''; // Clear description
          setTimeout(closeModal, 1500);
        } else {
          statusMessage.textContent = 'Upload Failed!';
        }
      })
      .catch((error) => {
        console.error('Upload error:', error);
        statusMessage.textContent = 'An error occurred.';
      });
  });
});

// Close the modal
function closeModal() {
  modal.classList.remove('show');
  modal.classList.add('hidden');
  statusMessage.textContent = '';
}

// Load gallery from the server
function loadGallery() {
  fetch('https://pixelpeople-online.onrender.com/')
    .then((response) => response.json())
    .then((images) => {
      console.log('Fetched images:', images);
      imagesContainer.innerHTML = ''; // Clear the gallery

      const containerWidth = imagesContainer.offsetWidth;
      const containerHeight = imagesContainer.offsetHeight;

      images.forEach(({ url, description }) => {
        console.log('Image description:', description); // Debug the loaded description
        const imgWrapper = document.createElement('div');
        imgWrapper.classList.add('image-wrapper');

        const img = document.createElement('img');
        img.src = url;
        img.classList.add('gallery-image');
        imgWrapper.appendChild(img);

 imgWrapper.addEventListener('click', () => {
  imgWrapper.classList.toggle('expanded');

  const existingDesc = imgWrapper.querySelector('.description');

  if (!imgWrapper.classList.contains('expanded')) {
    // Reset styles when collapsing
    imgWrapper.classList.remove('centered');
    if (existingDesc) existingDesc.remove();
  } else {
    imgWrapper.classList.add('centered');

    // Create or reuse the description box
    const desc = existingDesc || document.createElement('div');
    if (!existingDesc) {
      desc.className = 'description';
      desc.textContent = description || 'No description available'; // Fallback for missing descriptions
      imgWrapper.appendChild(desc);
    }

    // Style the description box for proper wrapping
    desc.style.transform = 'scale(1)'; // Prevent scaling
    desc.style.width = 'auto'; // Keep natural width
    desc.style.maxWidth = '250px'; // Limit width to approximately 25 characters
    desc.style.padding = '5px 10px'; // Maintain small padding
    desc.style.wordWrap = 'break-word'; // Ensure long words break
    desc.style.whiteSpace = 'normal'; // Allow normal text wrapping

    // Calculate the position of the description box
    const wrapperRect = imgWrapper.getBoundingClientRect();
    const containerRect = imagesContainer.getBoundingClientRect();

    if (wrapperRect.bottom + 200 > containerRect.bottom) {
      // Position the description above the image
      desc.style.top = 'auto'; // Reset any existing bottom positioning
      desc.style.bottom = '110%'; // Position above
    } else {
      // Position the description below the image
      desc.style.bottom = 'auto'; // Reset any existing top positioning
      desc.style.top = '110%'; // Position below
    }

    // Center description horizontally with respect to the image
    desc.style.left = '50%';
    desc.style.transform = 'translateX(-50%)'; // Center horizontally
  }
});


        // Randomize position
        const randomLeft = Math.random() * (containerWidth - 40);
        const randomTop = Math.random() * (containerHeight - 40);

        imgWrapper.style.left = `${randomLeft}px`;
        imgWrapper.style.top = `${randomTop}px`;

        imagesContainer.appendChild(imgWrapper);
      });

      // Update picture count
      pictureCount = images.length;
      pictureCountElement.textContent = `Pictures Taken: ${pictureCount}`;
    })
    .catch((err) => console.error('Error loading gallery:', err));
}

// Close modal on close button click
closeModalButton.addEventListener('click', closeModal);

// Initialize the gallery and picture count
loadGallery();
