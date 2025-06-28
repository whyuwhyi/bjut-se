
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
		allowNull: false,
	},
	created_at: {
		type: DataTypes.DATE,
		defaultValue: DataTypes.NOW,
	},
	expires_at: {
		type: DataTypes.DATE,
		allowNull: false,
	},
	status: {
		type: DataTypes.ENUM('valid', 'used', 'expired'),
		defaultValue: 'valid',
	},
}, {
	sequelize,
	modelName: 'VerificationCode',
	timestamps: false, // 如果不需要自动生成时间戳
});

module.exports = VerificationCode;