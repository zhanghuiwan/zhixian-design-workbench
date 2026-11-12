# 应用到实际 App 的交接清单

本仓库是设计稿与维护工具。App 仓库是 `zhanghuiwan/zhixian`；此处“已发布”只代表设计网站发布，不代表 App 已更新。

| 设计项 | 画框 / 组件 | App 位置 | 状态 | 验收要点 / App 提交 |
| --- | --- | --- | --- | --- |
| 悬浮玻璃底栏 | 2:80、2:93、2:106、23:191 等 | `apps/mobile/src/app/(tabs)/_layout.tsx` | 待应用 | Figma 332×52、圆角12；对照现有通栏64+安全区底栏，检查安全区、键盘、主题、图标和触控区域；无 App 提交 |
| 导航材质与配色 | nav / nav_2 / highlight 及深色变量 | `apps/mobile/src/constants/theme.ts`、导航组件 | 待应用 | 保留透明度与高光边界；CSS 模糊不等同于原生玻璃折射；无 App 提交 |
| 学习悬浮任务卡 | 3:35、3:547 内任务卡；2:56 | `apps/mobile/src/app/(tabs)/study.tsx` | 待核对 / 应用 | 对照最新 Figma 与当前 App，检查新学/复习数字、内容遮挡、短屏；无 App 提交 |
| 话题填入入口线索 | 11:84、11:121、11:161、11:277 | `apps/mobile/src/components/home-companion.tsx`、`apps/mobile/src/app/(tabs)/index.tsx` | 待确认提案 | 点击只填草稿，发送独立；核对聚焦、键盘和完整角色；无 App 提交 |

其他页面按 `design.json → workbench.routes` 找 App 路由，按 `workbench.frames` 找画框。应用前同时读取 `workbench.edits`，不要遗漏网页中保存的覆盖值。

每次新增设计变更，在本表追加具体条目。应用完成后记录设计提交号、App 提交号、实际验收结果和日期；不要仅因为已有相似页面就标记完成。
