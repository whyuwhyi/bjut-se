
  # 进入项目目录
  cd /opt/wechat-education/current

  # 进入MySQL容器
  docker exec -it wechat-education-mysql mysql -u root -p

  # 在MySQL中执行：
  DROP DATABASE IF EXISTS wechat_education;
  CREATE DATABASE wechat_education CHARACTER SET utf8mb4 COLLATE
  utf8mb4_0900_ai_ci;
  USE wechat_education;
  SOURCE /docker-entrypoint-initdb.d/01-init-database.sql;
