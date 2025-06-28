// models/VerificationCode.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // 你的数据库配置

class VerificationCode extends Model { }

VerificationCode.init({
	phone_number: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true // 确保同一手机号只能有一条记录
	},
	code: {
		type: DataTypes.STRING,
		allowNull: false
	},
}, {
	sequelize,
	modelName: 'VerificationCode',
	timestamps: true // 可选，记录创建时间
});

module.exports = VerificationCode;