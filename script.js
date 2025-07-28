const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const modal = document.getElementById('modal');
const plusButton = document.getElementById('plus-button');
const captureButton = document.getElementById('capture');
const statusMessage = document.getElementById('status-message');
const imagesContainer = document.getElementById('images');
const pictureCountElement = document.getElementById('picture-count');
const closeModalButton = document.getElementById('close-modal');
const BASE_URL = 'https://pixelpeople-online.onrender.com'; // ✅ no trailing slash

// Info box setup
const infoButton = document.getElementById('info-button');
const infoBox = document.getElementById('info-box');
infoButton.addEventListener('click', e => {
  e.stopPropagation();
  infoBox.classList.toggle('visible');
});
document.addEventListener('click', e => {
  if (!infoBox.contains(e.target) && !infoButton.contains(e.target)) {
    infoBox.classList.remove('visible');
  }
});
infoBox.addEventListener('click', e => e.stopPropagation());

let pictureCount = 0;

// Create and style description input
const descriptionInput = document.createElement('textarea');
descriptionInput.placeholder = 'Enter a description...';
descriptionInput.style.cssText = 'margin: 10px 0 20px; width: 90%; height: 50px;';
document.getElementById('modal-content').appendChild(descriptionInput);

// Open modal
plusButton.addEventListener('click', () => {
  modal.classList.add('show');
  modal.classList.remove('hidden');
});

// Access camera (can fail silently)
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream)
  .catch(err => console.warn('Camera not available:', err.message));

// Upload snapshot
captureButton.addEventListener('click', () => {
  const description = descriptionInput.value.trim();
  if (!description) return alert('Please enter a description before uploading.');

  const context = canvas.getContext('2d');
  canvas.width = 40;
  canvas.height = 40;
  context.drawImage(video, 0, 0, 40, 40);

  canvas.toBlob(blob => {
    if (!blob) return (statusMessage.textContent = 'Failed to capture the image.');

    const formData = new FormData();
    formData.append('image', blob, 'snapshot.png');
    formData.append('description', description);
    statusMessage.textContent = 'Uploading...';

    fetch(`${BASE_URL}/upload`, { method: 'POST', body: formData })
      .then(res => res.ok ? res.json() : Promise.reject('Upload failed'))
      .then(data => {
        if (data.success) {
          statusMessage.textContent = 'Upload Successful!';
          loadGallery();
          descriptionInput.value = '';
          setTimeout(closeModal, 1500);
        } else {
          statusMessage.textContent = 'Upload failed on server.';
        }
      })
      .catch(err => {
        console.error('Upload error:', err);
        statusMessage.textContent = 'Error during upload.';
      });
  });
});

// Close modal
function closeModal() {
  modal.classList.remove('show');
  modal.classList.add('hidden');
  statusMessage.textContent = '';
}

// Load and display gallery
function loadGallery() {
  const endpoint = `${BASE_URL}/images`; // ✅ no double slash
  console.log('Fetching from:', endpoint);

  fetch(endpoint)
    .then(res => res.json())
    .then(images => {
      imagesContainer.innerHTML = '';
      const containerWidth = imagesContainer.offsetWidth;
      const containerHeight = imagesContainer.offsetHeight;

      images.forEach(({ url, description }) => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('image-wrapper');

        const img = document.createElement('img');
        img.src = url;
        img.classList.add('gallery-image');
        wrapper.appendChild(img);

        wrapper.addEventListener('click', () => {
          const desc = wrapper.querySelector('.description') || document.createElement('div');
          if (!wrapper.classList.contains('expanded')) {
            wrapper.classList.add('expanded', 'centered');
            desc.className = 'description';
            desc.textContent = description || 'No description available';
            desc.style.cssText = `
              transform: scale(1);
              width: auto;
              max-width: 250px;
              padding: 5px 10px;
              word-wrap: break-word;
              white-space: normal;
              left: 50%;
              transform: translateX(-50%);
            `;
            const rect = wrapper.getBoundingClientRect();
            const containerRect = imagesContainer.getBoundingClientRect();
            desc.style.top = (rect.bottom + 200 > containerRect.bottom) ? 'auto' : '110%';
            desc.style.bottom = (rect.bottom + 200 > containerRect.bottom) ? '110%' : 'auto';
            wrapper.appendChild(desc);
          } else {
            wrapper.classList.remove('expanded', 'centered');
            if (desc) desc.remove();
          }
        });

        const x = Math.random() * (containerWidth - 40);
        const y = Math.random() * (containerHeight - 40);
        wrapper.style.left = `${x}px`;
        wrapper.style.top = `${y}px`;

        imagesContainer.appendChild(wrapper);
      });

      pictureCount = images.length;
      pictureCountElement.textContent = `Pictures Taken: ${pictureCount}`;
    })
    .catch(err => {
      console.error('Error loading gallery:', err);
    });
}

// Close modal button
closeModalButton.addEventListener('click', closeModal);

// Initial load
loadGallery();
