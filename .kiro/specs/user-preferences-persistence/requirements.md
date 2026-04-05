# 需求文档 - 用户偏好持久化

## 简介

当前系统使用 localStorage 存储用户偏好（收藏和排序），导致数据无法跨设备同步、浏览器清理后丢失、且游客用户无法保留偏好。本功能将用户偏好迁移到 D1 数据库，实现跨设备同步、持久化存储，并支持游客用户的偏好管理。

## 术语表

- **Preference_System**: 用户偏好管理系统，负责存储和检索用户的收藏、排序等偏好设置
- **User**: 已认证的用户，拥有有效的认证令牌
- **Guest_User**: 未认证的用户，通过设备标识符或会话 ID 识别
- **Favorite**: 用户标记为收藏的站点
- **User_Preferences_Table**: D1 数据库中存储用户通用偏好设置的表
- **User_Favorites_Table**: D1 数据库中存储用户收藏站点的表
- **Migration_Service**: 负责将 localStorage 数据迁移到数据库的服务
- **Device_Identifier**: 用于识别游客用户设备的唯一标识符
- **Preferences_API**: Worker 中处理偏好相关请求的 API 端点集合

## 需求

### 需求 1: 收藏站点持久化

**用户故事:** 作为用户，我希望我的收藏站点能够永久保存在数据库中，这样我可以在任何设备上访问我的收藏。

#### 验收标准

1. THE Preference_System SHALL 在 D1 数据库中创建 user_favorites 表，包含字段: id, user_id, site_id, created_at
2. WHEN 已认证用户添加收藏，THE Preference_System SHALL 将收藏记录插入 user_favorites 表
3. WHEN 已认证用户删除收藏，THE Preference_System SHALL 从 user_favorites 表中删除对应记录
4. WHEN 已认证用户请求收藏列表，THE Preference_System SHALL 从 user_favorites 表中查询并返回该用户的所有收藏站点
5. THE Preference_System SHALL 确保每个用户对同一站点只能有一条收藏记录（唯一约束: user_id + site_id）

### 需求 2: 游客用户偏好支持

**用户故事:** 作为游客用户，我希望能够保存我的偏好设置，并在登录后能够同步这些偏好。

#### 验收标准

1. WHEN 游客用户首次访问，THE Preference_System SHALL 生成唯一的 device_identifier 并存储在 localStorage
2. WHEN 游客用户添加收藏，THE Preference_System SHALL 使用 device_identifier 作为 user_id 将收藏保存到数据库
3. WHEN 游客用户登录成功，THE Preference_System SHALL 提供迁移接口，将 device_identifier 关联的偏好数据迁移到已认证用户账户
4. IF 迁移过程中发现重复的收藏记录，THEN THE Preference_System SHALL 保留最早创建的记录并删除重复项
5. THE Preference_System SHALL 在迁移完成后删除 device_identifier 关联的临时数据

### 需求 3: 用户通用偏好设置

**用户故事:** 作为用户，我希望我的界面偏好（如视图模式、主题等）能够跨设备同步。

#### 验收标准

1. THE Preference_System SHALL 在 D1 数据库中创建 user_preferences 表，包含字段: user_id (主键), view_mode, theme, custom_css, updated_at
2. WHEN 用户更改视图模式，THE Preference_System SHALL 更新 user_preferences 表中的 view_mode 字段
3. WHEN 用户更改主题设置，THE Preference_System SHALL 更新 user_preferences 表中的 theme 字段
4. WHEN 用户首次访问，THE Preference_System SHALL 从 user_preferences 表加载用户偏好并应用到界面
5. WHERE 用户未设置偏好，THE Preference_System SHALL 使用系统默认值

### 需求 4: Preferences API 端点

**用户故事:** 作为前端开发者，我需要 RESTful API 端点来管理用户偏好。

#### 验收标准

1. THE Preferences_API SHALL 提供 GET /api/preferences/favorites 端点，返回当前用户的收藏站点列表
2. THE Preferences_API SHALL 提供 POST /api/preferences/favorites/:siteId 端点，添加站点到收藏
3. THE Preferences_API SHALL 提供 DELETE /api/preferences/favorites/:siteId 端点，从收藏中移除站点
4. THE Preferences_API SHALL 提供 GET /api/preferences/settings 端点，返回用户的通用偏好设置
5. THE Preferences_API SHALL 提供 PUT /api/preferences/settings 端点，更新用户的通用偏好设置
6. THE Preferences_API SHALL 提供 POST /api/preferences/migrate 端点，将游客偏好迁移到已认证用户
7. WHEN API 请求包含有效认证令牌，THE Preferences_API SHALL 使用认证用户 ID 处理请求
8. WHEN API 请求不包含认证令牌，THE Preferences_API SHALL 使用 device_identifier 处理请求

### 需求 5: localStorage 数据迁移

**用户故事:** 作为现有用户，我希望我在 localStorage 中的收藏数据能够自动迁移到数据库。

#### 验收标准

1. WHEN 用户首次使用新版本，THE Migration_Service SHALL 检测 localStorage 中的 navihive.favoriteSiteIds 数据
2. IF localStorage 中存在收藏数据，THEN THE Migration_Service SHALL 将这些数据批量导入到 user_favorites 表
3. WHEN 迁移成功完成，THE Migration_Service SHALL 在 localStorage 中设置迁移完成标记
4. IF 迁移过程中发生错误，THEN THE Migration_Service SHALL 记录错误日志并保留 localStorage 数据不变
5. THE Migration_Service SHALL 提供用户界面提示，告知用户迁移状态和结果

### 需求 6: 排序偏好持久化

**用户故事:** 作为用户，我希望我自定义的分组和站点排序能够保存，这样每次访问时都能看到我习惯的顺序。

#### 验收标准

1. WHEN 用户拖拽调整分组顺序，THE Preference_System SHALL 更新 groups 表中的 order_num 字段
2. WHEN 用户拖拽调整站点顺序，THE Preference_System SHALL 更新 sites 表中的 order_num 字段
3. THE Preference_System SHALL 在用户完成拖拽操作后立即保存排序到数据库
4. WHEN 用户刷新页面，THE Preference_System SHALL 按照保存的 order_num 顺序显示分组和站点
5. IF 排序保存失败，THEN THE Preference_System SHALL 显示错误提示并恢复到上一次成功保存的顺序

### 需求 7: 最近访问站点追踪

**用户故事:** 作为用户，我希望系统能够记录我最近访问的站点，方便我快速访问常用网站。

#### 验收标准

1. THE Preference_System SHALL 在 D1 数据库中创建 user_recent_visits 表，包含字段: id, user_id, site_id, visited_at
2. WHEN 用户点击站点链接，THE Preference_System SHALL 记录访问时间到 user_recent_visits 表
3. THE Preference_System SHALL 为每个用户最多保留 20 条最近访问记录
4. WHEN 最近访问记录超过 20 条，THE Preference_System SHALL 自动删除最旧的记录
5. WHEN 用户请求最近访问列表，THE Preference_System SHALL 按访问时间倒序返回最近 20 条记录

### 需求 8: 数据一致性和错误处理

**用户故事:** 作为系统管理员，我需要确保偏好数据的一致性和可靠性。

#### 验收标准

1. WHEN 用户收藏的站点被删除，THE Preference_System SHALL 通过外键级联删除自动清理 user_favorites 表中的相关记录
2. IF 数据库操作失败，THEN THE Preference_System SHALL 返回明确的错误信息和 HTTP 状态码
3. THE Preference_System SHALL 在所有数据库写操作中使用事务，确保数据一致性
4. WHEN 并发请求修改同一用户的偏好，THE Preference_System SHALL 正确处理并发冲突
5. THE Preference_System SHALL 记录所有偏好相关操作的日志，包括成功和失败的操作

### 需求 9: 性能和缓存优化

**用户故事:** 作为用户，我希望偏好数据的加载和保存速度快，不影响页面性能。

#### 验收标准

1. WHEN 用户首次加载页面，THE Preference_System SHALL 在 500ms 内完成偏好数据的加载
2. THE Preference_System SHALL 在前端缓存用户偏好数据，避免重复的数据库查询
3. WHEN 偏好数据更新，THE Preference_System SHALL 同时更新前端缓存和数据库
4. THE Preference_System SHALL 使用批量操作处理多个偏好更新，减少数据库往返次数
5. WHEN 网络请求失败，THE Preference_System SHALL 使用本地缓存数据，并在网络恢复后同步

### 需求 10: 向后兼容性

**用户故事:** 作为开发者，我需要确保新系统能够平滑过渡，不破坏现有功能。

#### 验收标准

1. WHILE 迁移未完成，THE Preference_System SHALL 继续支持从 localStorage 读取偏好数据
2. THE Preference_System SHALL 提供功能开关，允许在数据库和 localStorage 之间切换
3. WHEN 数据库不可用，THE Preference_System SHALL 自动降级到 localStorage 模式
4. THE Preference_System SHALL 保持现有的前端 API 接口不变，仅修改底层实现
5. THE Preference_System SHALL 提供迁移状态检查接口，供前端查询迁移进度
