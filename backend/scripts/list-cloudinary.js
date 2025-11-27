require('dotenv').config({path:'.env'});
const cloudinary = require('../config/cloudinary');

cloudinary.api.resources({ resource_type: 'image', type: 'upload', max_results: 10 }, (err, res) => {
  if (err) {
    console.error('Cloudinary error:', err);
    process.exit(1);
  }
  console.log('Found', res.resources.length, 'cloudinary images');
  res.resources.forEach(r => {
    console.log(' -', r.public_id, r.secure_url);
  });
  process.exit(0);
});