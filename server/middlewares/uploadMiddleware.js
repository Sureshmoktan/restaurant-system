const multer = require('multer')
const path   = require('path')

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/
  const extname  = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)
  if (extname && mimetype) {
    cb(null, true)
  } else {
    cb(new Error('Images only — jpeg, jpg, png, webp'))
  }
}

const upload = multer({
  storage,
  limits:     { fileSize: 2 * 1024 * 1024 },
  fileFilter
})

module.exports = upload