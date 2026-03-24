const cloudinary = require('cloudinary').v2
require('dotenv').config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadToCloudinary = async (fileBuffer, folder = 'himalaya-kitchen/menu') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    ).end(fileBuffer)
  })
}

const deleteFromCloudinary = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId)
}

module.exports = { uploadToCloudinary, deleteFromCloudinary }