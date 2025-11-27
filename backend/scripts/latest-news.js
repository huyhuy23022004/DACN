require('dotenv').config({path:'.env'});
const mongoose = require('mongoose');

async function run(){
  try{
    await mongoose.connect(process.env.MONGO_URI);
    const News = require('../models/News');
    const docs = await News.find().sort({createdAt:-1}).limit(20).lean();
    docs.forEach(d => console.log(d.createdAt, '-', d.title,'->', d.images));
    process.exit(0);
  }catch(e){
    console.error('Error:', e);
    process.exit(1);
  }
}
run();