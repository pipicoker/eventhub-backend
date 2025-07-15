const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage(); // ✅ In-memory upload

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
    cb(null, true);
  },
});

module.exports = upload;
