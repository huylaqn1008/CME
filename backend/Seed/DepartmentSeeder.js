const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Department = require('../models/DepartmentModel');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const departments = [
      { name: 'Khoa Nội' },
      { name: 'Khoa Ngoại' },
      { name: 'Khoa Nhi' },
      { name: 'Khoa Sản' },
      { name: 'Khoa Hồi sức cấp cứu' },
      { name: 'Khoa Xét nghiệm' },
      { name: 'Khoa Dược' },
      { name: 'Khoa Chẩn đoán hình ảnh' }
    ];

    for (const dep of departments) {
      const exists = await Department.findOne({ name: dep.name });
      if (!exists) {
        await Department.create(dep);
        console.log(`✅ Đã thêm: ${dep.name}`);
      } else {
        console.log(`⚠️ Đã tồn tại: ${dep.name}`);
      }
    }

    mongoose.disconnect();
  })
  .catch((err) => {
    console.error('❌ Lỗi khi seed department:', err.message);
  });
