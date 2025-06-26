const { sequelize } = require('../config/database')

// 导入所有模型
const User = require('./User')
const Resource = require('./Resource')
const ResourceType = require('./ResourceType')
const Category = require('./Category')
const Activity = require('./Activity')
const File = require('./File')
const Collection = require('./Collection')
const Comment = require('./Comment')
const Rating = require('./Rating')
const Post = require('./Post')
const PostTag = require('./PostTag')
const PostTagRelation = require('./PostTagRelation')

// 设置模型关系
// 用户 - 资源关系
User.hasMany(Resource, {
  foreignKey: 'publisher_phone',
  sourceKey: 'phone_number',
  as: 'publishedResources'
})
Resource.belongsTo(User, {
  foreignKey: 'publisher_phone',
  targetKey: 'phone_number',
  as: 'publisher'
})

// 用户 - 活动关系
User.hasMany(Activity, {
  foreignKey: 'publisher_phone',
  sourceKey: 'phone_number',
  as: 'publishedActivities'
})
Activity.belongsTo(User, {
  foreignKey: 'publisher_phone',
  targetKey: 'phone_number',
  as: 'publisher'
})

// 资源 - 文件关系
Resource.hasMany(File, {
  foreignKey: 'resource_id',
  as: 'files'
})
File.belongsTo(Resource, {
  foreignKey: 'resource_id',
  as: 'resource'
})

// 用户 - 收藏关系
User.hasMany(Collection, {
  foreignKey: 'user_phone',
  sourceKey: 'phone_number',
  as: 'collections'
})
Collection.belongsTo(User, {
  foreignKey: 'user_phone',
  targetKey: 'phone_number',
  as: 'user'
})

// 用户 - 评论关系
User.hasMany(Comment, {
  foreignKey: 'author_phone',
  sourceKey: 'phone_number',
  as: 'comments'
})
Comment.belongsTo(User, {
  foreignKey: 'author_phone',
  targetKey: 'phone_number',
  as: 'author'
})

// 资源 - 评论关系
Resource.hasMany(Comment, {
  foreignKey: 'resource_id',
  as: 'comments'
})
Comment.belongsTo(Resource, {
  foreignKey: 'resource_id',
  as: 'resource'
})

// 评论 - 回复关系（自关联）
Comment.hasMany(Comment, {
  foreignKey: 'parent_comment_id',
  as: 'replies'
})
Comment.belongsTo(Comment, {
  foreignKey: 'parent_comment_id',
  as: 'parent'
})

// 用户 - 评分关系
User.hasMany(Rating, {
  foreignKey: 'user_phone',
  sourceKey: 'phone_number',
  as: 'ratings'
})
Rating.belongsTo(User, {
  foreignKey: 'user_phone',
  targetKey: 'phone_number',
  as: 'user'
})

// 资源 - 评分关系
Resource.hasMany(Rating, {
  foreignKey: 'resource_id',
  as: 'ratings'
})
Rating.belongsTo(Resource, {
  foreignKey: 'resource_id',
  as: 'resource'
})

// 审核者关系
Resource.belongsTo(User, {
  foreignKey: 'reviewer_phone',
  targetKey: 'phone_number',
  as: 'reviewer'
})

// 资源 - 分类关系
Resource.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
})
Category.hasMany(Resource, {
  foreignKey: 'category_id',
  as: 'resources'
})

// 用户 - 帖子关系
User.hasMany(Post, {
  foreignKey: 'author_phone',
  sourceKey: 'phone_number',
  as: 'posts'
})
Post.belongsTo(User, {
  foreignKey: 'author_phone',
  targetKey: 'phone_number',
  as: 'author'
})

// 帖子 - 评论关系
Post.hasMany(Comment, {
  foreignKey: 'post_id',
  as: 'postComments'
})
Comment.belongsTo(Post, {
  foreignKey: 'post_id',
  as: 'post'
})

// 帖子 - 标签关系（多对多）
Post.belongsToMany(PostTag, {
  through: PostTagRelation,
  foreignKey: 'post_id',
  otherKey: 'tag_id',
  as: 'tags'
})
PostTag.belongsToMany(Post, {
  through: PostTagRelation,
  foreignKey: 'tag_id',
  otherKey: 'post_id',
  as: 'posts'
})


const models = {
  User,
  Resource,
  ResourceType,
  Category,
  Activity,
  File,
  Collection,
  Comment,
  Rating,
  Post,
  PostTag,
  PostTagRelation,
  sequelize
}

module.exports = models