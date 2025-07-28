require('dotenv').config();
console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
const express = require('express');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const path = require('path');

const app = express();
const PORT = 3000;

// Enable file uploads and parse URL-encoded bodies
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Serve static files
app.use(express.static('public'));

// Endpoint to upload files
app.post('/upload', (req, res) => {
  if (!req.files || !req.files.image || !req.body.description) {
    return res.status(400).json({ success: false, message: 'No file or description provided.' });
  }

  const image = req.files.image;
  const description = req.body.description;
  console.log(description);

  // Upload the file to Cloudinary with metadata
  cloudinary.uploader.upload_stream(
    { resource_type: 'image', context: `description=${description}` },
    (error, result) => {
      if (error) {
        console.error('Error uploading to Cloudinary:', error);
        return res.status(500).json({ success: false, message: 'Error uploading file.' });
      }

      // Send back the URL and metadata
      res.json({
        success: true,
        message: 'Upload successful',
        imageUrl: result.secure_url,
        context: "title=placeholder",
      });
    }
  ).end(image.data);
});

// Fetch images with metadata
app.get('/images', async (req, res) => {
  try {
    let allImages = [];
    let nextCursor = null;

    do {
      const result = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'image',
        max_results: 100,
        next_cursor: nextCursor,
        context: true, // Fetch metadata
      });

      allImages = allImages.concat(
        result.resources.map((resource) => ({
          url: resource.secure_url,
          description: resource.context?.custom?.description || '',
        }))
      );

      nextCursor = result.next_cursor;
    } while (nextCursor);

    res.json(allImages);
  } catch (error) {
    console.error('Error fetching images from Cloudinary:', error);
    res.status(500).json({ error: 'Error fetching images.' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
