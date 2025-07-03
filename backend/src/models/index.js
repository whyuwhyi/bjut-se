const { sequelize } = require('../config/database')

// 导入所有模型
const User = require('./User')
const Resource = require('./Resource')
const Category = require('./Category')
const File = require('./File')
const Collection = require('./Collection')
const Comment = require('./Comment')
const Rating = require('./Rating')
const Post = require('./Post')
const PostTag = require('./PostTag')
const PostTagRelation = require('./PostTagRelation')
// 学习管理模块
const StudyPlan = require('./StudyPlan')
const StudyTask = require('./StudyTask')
const SubTask = require('./SubTask')
// 用户管理模块
const UserFollow = require('./UserFollow')
const VerificationCode = require('./VerificationCode')
// 通知模块
const Notification = require('./Notification')
const NotificationRead = require('./NotificationRead')
// 举报模块
const ResourceReport = require('./ResourceReport')
const PostReport = require('./PostReport')
// 反馈模块
const Feedback = require('./Feedback')

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

// 用户 - 学习计划关系
User.hasMany(StudyPlan, {
  foreignKey: 'user_phone',
  sourceKey: 'phone_number',
  as: 'studyPlans'
})
StudyPlan.belongsTo(User, {
  foreignKey: 'user_phone',
  targetKey: 'phone_number',
  as: 'user'
})

// 学习计划 - 学习任务关系
StudyPlan.hasMany(StudyTask, {
  foreignKey: 'plan_id',
  as: 'tasks'
})
StudyTask.belongsTo(StudyPlan, {
  foreignKey: 'plan_id',
  as: 'plan'
})

// 学习任务 - 子任务关系
StudyTask.hasMany(SubTask, {
  foreignKey: 'task_id',
  as: 'subtasks'
})
SubTask.belongsTo(StudyTask, {
  foreignKey: 'task_id',
  as: 'task'
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

// 用户关注关系（自关联）
User.hasMany(UserFollow, {
  foreignKey: 'follower_phone',
  sourceKey: 'phone_number',
  as: 'following'
})
User.hasMany(UserFollow, {
  foreignKey: 'following_phone',
  sourceKey: 'phone_number',
  as: 'followers'
})
UserFollow.belongsTo(User, {
  foreignKey: 'follower_phone',
  targetKey: 'phone_number',
  as: 'follower'
})
UserFollow.belongsTo(User, {
  foreignKey: 'following_phone',
  targetKey: 'phone_number',
  as: 'followingUser'
})


// 用户通知关系
User.hasMany(Notification, {
  foreignKey: 'receiver_phone',
  sourceKey: 'phone_number',
  as: 'receivedNotifications'
})
Notification.belongsTo(User, {
  foreignKey: 'receiver_phone',
  targetKey: 'phone_number',
  as: 'receiver'
})

// 用户通知已读状态关系
User.hasMany(NotificationRead, {
  foreignKey: 'user_phone',
  sourceKey: 'phone_number',
  as: 'notificationReads'
})
NotificationRead.belongsTo(User, {
  foreignKey: 'user_phone',
  targetKey: 'phone_number',
  as: 'user'
})

Notification.hasMany(NotificationRead, {
  foreignKey: 'notification_id',
  as: 'readByUsers'
})
NotificationRead.belongsTo(Notification, {
  foreignKey: 'notification_id',
  as: 'notification'
})

// 通知相关用户关系
Notification.belongsTo(User, {
  foreignKey: 'related_user_phone',
  targetKey: 'phone_number',
  as: 'relatedUser'
})

// 收藏-资源关系（基于content_id匹配）
Collection.belongsTo(Resource, {
  foreignKey: 'content_id',
  targetKey: 'resource_id',
  as: 'resource',
  constraints: false, // 由于content_id可能指向不同类型的内容，不设置外键约束
  scope: {
    collection_type: 'resource'
  }
})

// 收藏-帖子关系（基于content_id匹配）
Collection.belongsTo(Post, {
  foreignKey: 'content_id',
  targetKey: 'post_id',
  as: 'post',
  constraints: false,
  scope: {
    collection_type: 'post'
  }
})

// 资源举报关系
User.hasMany(ResourceReport, {
  foreignKey: 'reporter_phone',
  sourceKey: 'phone_number',
  as: 'resourceReports'
})
ResourceReport.belongsTo(User, {
  foreignKey: 'reporter_phone',
  targetKey: 'phone_number',
  as: 'reporter'
})

Resource.hasMany(ResourceReport, {
  foreignKey: 'resource_id',
  as: 'reports'
})
ResourceReport.belongsTo(Resource, {
  foreignKey: 'resource_id',
  as: 'resource'
})

// 资源举报处理者关系
ResourceReport.belongsTo(User, {
  foreignKey: 'processed_by',
  targetKey: 'phone_number',
  as: 'processor'
})

// 帖子举报关系
User.hasMany(PostReport, {
  foreignKey: 'reporter_phone',
  sourceKey: 'phone_number',
  as: 'postReports'
})
PostReport.belongsTo(User, {
  foreignKey: 'reporter_phone',
  targetKey: 'phone_number',
  as: 'reporter'
})

Post.hasMany(PostReport, {
  foreignKey: 'post_id',
  as: 'reports'
})
PostReport.belongsTo(Post, {
  foreignKey: 'post_id',
  as: 'post'
})

// 帖子举报处理者关系
PostReport.belongsTo(User, {
  foreignKey: 'processed_by',
  targetKey: 'phone_number',
  as: 'processor'
})

// 用户 - 反馈关系
User.hasMany(Feedback, {
  foreignKey: 'user_phone',
  sourceKey: 'phone_number',
  as: 'feedbacks'
})
Feedback.belongsTo(User, {
  foreignKey: 'user_phone',
  targetKey: 'phone_number',
  as: 'user'
})

// 管理员 - 反馈回复关系
User.hasMany(Feedback, {
  foreignKey: 'replied_by',
  sourceKey: 'phone_number',
  as: 'repliedFeedbacks'
})
Feedback.belongsTo(User, {
  foreignKey: 'replied_by',
  targetKey: 'phone_number',
  as: 'replier'
})

const models = {
  User,
  Resource,
  Category,
  File,
  Collection,
  Comment,
  Rating,
  Post,
  PostTag,
  PostTagRelation,
  // 学习管理模块
  StudyPlan,
  StudyTask,
  SubTask,
  // 用户管理模块
  UserFollow,
  VerificationCode,
  // 通知模块
  Notification,
  NotificationRead,
  // 举报模块
  ResourceReport,
  PostReport,
  // 反馈模块
  Feedback,
  sequelize
}

module.exports = models