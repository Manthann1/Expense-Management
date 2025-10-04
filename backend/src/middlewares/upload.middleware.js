const multer = require('multer');
// simple memory storage (extend if you want disk/S3)
const upload = multer({ storage: multer.memoryStorage() });
module.exports = { upload };
