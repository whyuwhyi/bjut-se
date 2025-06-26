const express = require('express')
const CategoryController = require('../controllers/CategoryController')

const router = express.Router()

// 获取所有分类
router.get('/', CategoryController.getAllCategories)

// 获取分类选项（用于下拉框）
router.get('/options', CategoryController.getCategoryOptions)

// 根据分类值获取分类信息
router.get('/:value', CategoryController.getCategoryByValue)

module.exports = router