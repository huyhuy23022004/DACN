require('dotenv').config({path:'.env'});
const mongoose = require('mongoose');

async function run(){
  try{
    await mongoose.connect(process.env.MONGO_URI);
    const News = require('../models/News');
    const docs = await News.find({ 'images.0': { $exists: true } }).limit(50).lean();
    console.log('Found', docs.length, 'news with images');
    docs.forEach(d => {
      console.log(' -', d.title, d._id, ' images:', (d.images||[]).slice(0,3));
    });
    process.exit(0);
  }catch(e){
    console.error('Error:', e);
    process.exit(1);
  }
}
run();