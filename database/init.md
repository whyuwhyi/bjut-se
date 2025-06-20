# 数据库初始化

在微信云开发控制台 -> 数据库中创建以下集合：

## 核心集合

### 1. users (用户集合)
```javascript
// 字段结构示例
{
  "_id": "user_id",
  "studentId": "学号/工号",
  "username": "用户名", 
  "realName": "真实姓名",
  "email": "邮箱",
  "phone": "手机号",
  "role": "student|teacher|admin",
  "college": "学院",
  "major": "专业",
  "grade": "年级",
  "avatar": "头像URL",
  "status": "active|inactive|banned",
  "createTime": "注册时间",
  "lastLogin": "最后登录时间",
  "loginCount": "登录次数"
}
```

### 2. resources (学习资源集合)
```javascript
{
  "_id": "resource_id",
  "title": "资源标题",
  "description": "资源描述", 
  "category": "courseware|note|exercise|reference",
  "courseId": "关联课程ID",
  "difficulty": "easy|medium|hard",
  "tags": ["标签1", "标签2"],
  "fileName": "原始文件名",
  "fileSize": "文件大小(字节)",
  "fileType": "文件类型",
  "fileUrl": "云存储文件URL",
  "uploaderId": "上传者ID",
  "uploaderName": "上传者姓名",
  "downloadCount": "下载次数",
  "viewCount": "浏览次数", 
  "rating": "平均评分",
  "ratingCount": "评分人数",
  "shareScope": "public|course|private",
  "status": "pending|approved|rejected",
  "uploadTime": "上传时间",
  "updateTime": "更新时间"
}
```

### 3. discussions (讨论集合)
```javascript
{
  "_id": "discussion_id",
  "parentId": "父级讨论ID(主帖为null)",
  "title": "讨论标题",
  "content": "讨论内容",
  "type": "discussion|question|share|reply",
  "category": "study|tech|course|project|life",
  "courseId": "关联课程ID",
  "resourceId": "关联资源ID",
  "tags": ["话题标签"],
  "images": ["图片URL数组"],
  "isQuestion": "是否为提问",
  "isResolved": "问题是否已解决",
  "authorId": "作者ID",
  "authorName": "作者姓名",
  "authorAvatar": "作者头像",
  "replyToId": "回复特定回复的ID",
  "likeCount": "点赞数",
  "replyCount": "回复数",
  "viewCount": "浏览数",
  "status": "normal|hidden|deleted",
  "createTime": "创建时间",
  "updateTime": "更新时间"
}
```

### 4. notifications (通知集合)
```javascript
{
  "_id": "notification_id",
  "title": "通知标题",
  "content": "通知内容",
  "type": "system|activity|discussion|resource",
  "priority": "high|medium|low",
  "targetUsers": ["目标用户ID数组"],
  "senderId": "发送者ID",
  "relatedId": "关联对象ID",
  "isRead": "是否已读",
  "createTime": "创建时间",
  "readTime": "阅读时间"
}
```

## 关系集合

### 5. favorites (收藏记录)
```javascript
{
  "_id": "favorite_id",
  "userId": "用户ID",
  "resourceId": "资源ID", 
  "createTime": "收藏时间"
}
```

### 6. likes (点赞记录)
```javascript
{
  "_id": "like_id",
  "userId": "用户ID",
  "targetId": "目标对象ID",
  "targetType": "discussion|reply|resource",
  "createTime": "点赞时间"
}
```

### 7. ratings (评分记录)
```javascript
{
  "_id": "rating_id",
  "userId": "用户ID",
  "resourceId": "资源ID",
  "rating": "评分(1-5)",
  "createTime": "评分时间",
  "updateTime": "更新时间"
}
```

### 8. download_history (下载历史)
```javascript
{
  "_id": "download_id",
  "userId": "用户ID",
  "resourceId": "资源ID",
  "downloadTime": "下载时间"
}
```

### 9. learning_records (学习记录)
```javascript
{
  "_id": "record_id",
  "userId": "用户ID",
  "resourceId": "资源ID",
  "discussionId": "讨论ID",
  "actionType": "view|download|upload|post|reply",
  "duration": "持续时间(分钟)",
  "createTime": "记录时间"
}
```

### 10. activities (活动集合)
```javascript
{
  "_id": "activity_id",
  "title": "活动标题",
  "description": "活动描述",
  "type": "academic|cultural|sports|social",
  "organizerId": "组织者ID",
  "organizerName": "组织者名称",
  "location": "活动地点",
  "startTime": "开始时间",
  "endTime": "结束时间",
  "maxParticipants": "最大参与人数",
  "currentParticipants": "当前参与人数",
  "registrationDeadline": "报名截止时间",
  "requirements": "参与要求",
  "status": "draft|published|ongoing|completed|cancelled",
  "images": ["活动图片"],
  "createTime": "创建时间",
  "updateTime": "更新时间"
}
```

### 11. activity_participants (活动参与记录)
```javascript
{
  "_id": "participant_id",
  "activityId": "活动ID",
  "userId": "用户ID",
  "status": "registered|attended|absent",
  "registrationTime": "报名时间",
  "checkInTime": "签到时间"
}
```

## 数据库索引建议

为提高查询性能，建议创建以下索引：

### users 集合
- studentId (唯一索引)
- email (唯一索引)
- role + status

### resources 集合  
- uploaderId + uploadTime
- category + status
- tags + status
- title (文本索引)

### discussions 集合
- parentId + createTime
- authorId + createTime  
- category + status
- title (文本索引)

### notifications 集合
- targetUsers + createTime
- type + createTime

### favorites 集合
- userId + createTime
- resourceId + createTime

### likes 集合
- userId + targetId + targetType (复合唯一索引)

## 数据库权限设置

在云开发控制台 -> 数据库 -> 安全规则中配置：

```javascript
// 示例安全规则
{
  "read": true,  // 暂时设置为公开读取，实际项目中应该根据业务需求设置
  "write": "auth.uid != null"  // 只有登录用户可以写入
}
```

注意：实际项目中应该根据具体业务需求设置更细粒度的权限控制。