const express = require('express')
const FileController = require('../controllers/FileController')
const { auth } = require('../middleware/auth')
const { uploadResource, handleUploadError } = require('../middleware/upload')

const router = express.Router()

// 文件上传
router.post('/upload', auth, uploadResource, handleUploadError, FileController.uploadFile)

module.exports = router