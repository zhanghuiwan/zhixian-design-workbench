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

## 2026-11-13 · 独立视觉探索，待评审

| 提案 | 评审入口 / 组件 | App 路由 | 状态 | 验收要点 |
| --- | --- | --- | --- | --- |
| A 墨白编辑式 | `explorations/?direction=editorial`；独立排版、主题与导航 | `/`、`/study`、`/profile` | 待评审，未应用 | 确认编辑式字阶、朱红状态、平面列表；无 App 提交 |
| B 晴空专注式 | `explorations/?direction=sky`；任务卡、圆角分组与导航 | 同上 | 待评审，未应用 | 确认任务入口、圆角和蓝色分量；无 App 提交 |
| C 暮色陪伴式 | `explorations/?direction=dusk`；进度数字、资源网格与导航 | 同上 | 待评审，未应用 | 确认深色阅读、杏色对比和沉浸角色；无 App 提交 |

三组只是独立 HTML 评审提案，不覆盖现有 `design.json`。选定后再将需要采用的部分正式写入设计事实源并实施 App。浏览器交互为本地演示、无真实模型或账号服务；手机系统安全区、键盘与动效待实际 App 验收。

## 2026-11-13 · 原配色圆角菜单审查版

本轮以原设计为主，只采用 B 的圆角矩形菜单形态，不采用蓝色主题。新学/复习与原导航保持原组件。

| 设计项 | 新审查画框 / 组件 | 来源 / App 路由 | 状态 | 验收要点 |
| --- | --- | --- | --- | --- |
| 闲闲原样复用 | `review:light:home` / `review:dark:home` | 3:4 / 3:516；`/` | 待评审，未应用 | 角色、输入、建议话题、玻璃导航保持原值 |
| 学习菜单与操作 | `review:light:study` / `review:dark:study` | 3:35 / 3:547；`/study` | 待评审，未应用 | 四项圆角入口；无开始学习按钮；原新学/复习卡与导航；底部不裁切 |
| 我的圆角设置 | `review:light:profile` / `review:dark:profile` | 3:120 / 3:632；`/profile` | 待评审，未应用 | 主题和原开关保留；圆角设置与菜单；可滚动到账号和退出 |
| 单/双行菜单 | `review:menu:{light,dark}:{single,detail}` | 原列表组件2:49及各实际条目 | 待评审，未应用 | 圆角20；312×52/60；原图标、14/12字阶、已有surfaceMuted绑定 |
| 设置菜单组 | `review:appearance:{light,dark}` | 3:151 / 3:663 | 待评审，未应用 | 原主题控件、原开关；各设置为独立圆角矩形 |

审查版已进入 `design.json → pages` 与 `workbench.frames(category=review)`；原pages/变量不变。采用前只选定最终版本再同步App，不根据网页发布标记App完成。实际App提交：无。
