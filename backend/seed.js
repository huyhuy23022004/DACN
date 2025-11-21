const mongoose = require('mongoose');
const News = require('./models/News');
const User = require('./models/User');
const Category = require('./models/Category');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Tạo category mẫu
    const category = await Category.findOneAndUpdate(
      { name: 'Du lịch' },
      { name: 'Du lịch', description: 'Tin tức về du lịch' },
      { upsert: true, new: true }
    );

    // Tạo user mẫu (editor)
    const user = await User.findOneAndUpdate(
      { email: 'editor@example.com' },
      {
        username: 'editor',
        email: 'editor@example.com',
        password: '$2a$10$examplehashedpassword', // Mật khẩu: password123 (đã hash)
        role: 'editor'
      },
      { upsert: true, new: true }
    );

    // Tạo admin user
    const admin = await User.findOneAndUpdate(
      { email: 'admin@example.com' },
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123', // Plain password, will be hashed by pre-save hook
        role: 'admin',
        isVerified: true
      },
      { upsert: true, new: true }
    );

    // Tạo news mẫu
    const newsData = [
      {
        title: 'Khám phá Sapa - Nóc nhà Đông Dương',
        summary: 'Sapa là điểm đến lý tưởng cho những ai yêu thích thiên nhiên và văn hóa.',
        content: 'Sapa nằm ở vùng núi Tây Bắc Việt Nam, nổi tiếng với những cánh đồng lúa bậc thang tuyệt đẹp và văn hóa đa dạng của các dân tộc thiểu số. Khí hậu mát mẻ quanh năm khiến Sapa trở thành điểm đến hấp dẫn cho du khách.',
        author: user._id,
        category: category._id,
        published: true,
        tags: ['Sapa', 'Du lịch', 'Việt Nam'],
        location: { lat: 22.3364, lng: 103.8438 }
      },
      {
        title: 'Hà Nội - Thủ đô nghìn năm văn hiến',
        summary: 'Khám phá những điểm đến nổi tiếng ở Hà Nội.',
        content: 'Hà Nội, thủ đô của Việt Nam, là nơi giao thoa giữa quá khứ và hiện đại. Từ Hồ Hoàn Kiếm, đền Ngọc Sơn đến những khu phố cổ kính, Hà Nội mang đến cho du khách nhiều trải nghiệm độc đáo.',
        author: user._id,
        category: category._id,
        published: true,
        tags: ['Hà Nội', 'Thủ đô', 'Văn hóa'],
        location: { lat: 21.0285, lng: 105.8542 }
      },
      {
        title: 'Đà Nẵng - Thành phố đáng sống',
        summary: 'Đà Nẵng với bãi biển đẹp và nhiều điểm tham quan.',
        content: 'Đà Nẵng được biết đến với bãi biển Mỹ Khê tuyệt đẹp, cầu Rồng huyền ảo và núi Ngũ Hành Sơn. Thành phố này đang phát triển nhanh chóng và trở thành điểm đến hấp dẫn cho cả du lịch và đầu tư.',
        author: user._id,
        category: category._id,
        published: true,
        tags: ['Đà Nẵng', 'Biển', 'Du lịch'],
        location: { lat: 16.0544, lng: 108.2022 }
      },
      {
        title: 'Phú Quốc - Đảo ngọc Việt Nam',
        summary: 'Khám phá vẻ đẹp hoang sơ của Phú Quốc.',
        content: 'Phú Quốc là hòn đảo lớn nhất Việt Nam, nổi tiếng với những bãi biển cát trắng, rừng nguyên sinh và hải sản tươi ngon. Đảo này còn có nhiều khu nghỉ dưỡng cao cấp và các hoạt động giải trí đa dạng.',
        author: user._id,
        category: category._id,
        published: true,
        tags: ['Phú Quốc', 'Đảo', 'Du lịch'],
        location: { lat: 10.2899, lng: 103.9840 }
      },
      {
        title: 'Hội An - Di sản văn hóa thế giới',
        summary: 'Tham quan phố cổ Hội An với kiến trúc cổ kính.',
        content: 'Hội An là một thị trấn cổ ở Quảng Nam, được UNESCO công nhận là di sản văn hóa thế giới. Những ngôi nhà gỗ, phố đèn lồng và các lễ hội truyền thống tạo nên nét đẹp độc đáo của Hội An.',
        author: user._id,
        category: category._id,
        published: true,
        tags: ['Hội An', 'Di sản', 'Văn hóa'],
        location: { lat: 15.8801, lng: 108.3380 }
      },
      {
        title: 'Nha Trang - Thiên đường biển đảo',
        summary: 'Trải nghiệm du lịch biển tại Nha Trang.',
        content: 'Nha Trang nổi tiếng với những bãi biển đẹp, các hòn đảo như Hòn Mun, Hòn Tằm và các khu vui chơi giải trí. Thành phố này còn có nhiều nhà hàng hải sản và các hoạt động thể thao dưới nước.',
        author: user._id,
        category: category._id,
        published: true,
        tags: ['Nha Trang', 'Biển', 'Du lịch'],
        location: { lat: 12.2388, lng: 109.1967 }
      },
      {
        title: 'Đà Nẵng và Hội An - Kỳ quan miền Trung',
        summary: 'Khám phá Đà Nẵng và Hội An.',
        content: 'Đà Nẵng và Hội An là hai điểm đến hấp dẫn ở miền Trung Việt Nam.',
        author: user._id,
        category: category._id,
        published: true,
        tags: ['Đà Nẵng', 'Hội An', 'Du lịch'],
        location: { lat: 16.0544, lng: 108.2022 }
      },
    ];

    for (const data of newsData) {
      await News.findOneAndUpdate(
        { title: data.title },
        data,
        { upsert: true, new: true }
      );
    }

    console.log('Dữ liệu mẫu đã được tạo thành công!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu mẫu:', error);
    process.exit(1);
  }
};

seedData();