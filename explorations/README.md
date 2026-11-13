# 主页面视觉探索 · 2026-11-13

独立待评审提案。入口 `explorations/index.html`，不覆盖原画框、图层或主题变量。原工作台 `index.html`、`app.js`、`renderer.js`、`workbench.css`、`design.json` 与原始快照保持原样。

三个方向各含闲闲、学习、我的，共 9 个组合；直接入口为 `screen.html?direction=editorial|sky|dusk&page=home|study|profile`。评审页支持按方向浏览、同页对比、80%/100% 缩放及独立打开页面。HTML/CSS/JS 为可维护源，图片只是视觉参考，不作为整屏实现。

| 方向 | 结构与材质 | 主色 | 字体 |
| --- | --- | --- | --- |
| editorial / 墨白编辑式 | 平面编辑排版、细分隔、矩形主按钮、下划线导航 | 白 / 墨黑 / 朱红 | Noto Sans SC + Noto Serif CJK SC 标题子集 |
| sky / 晴空专注式 | 大圆角任务卡、成组资源、蓝色选中导航 | 雾蓝 / 钴蓝 / 海军蓝 | Noto Sans SC |
| dusk / 暮色陪伴式 | 大比例进度、任务摘要、双列资源网格、深色导航 | 深紫灰 / 杏色 | Noto Sans SC + Noto Serif CJK SC 标题子集 |

内容基线：四级词汇、已学 120/800、新学 0/10、复习 0/9、生词 24。日期固定为 2026-11-13，最近七天为 11 月 7—13 日。数据均为演示。支持导航、推荐话题填入与独立发送、预设对话回复、词书切换、练习揭示/评分、主题和开关、设置弹层。无服务端调用，不写入原设计数据；刷新重置。

复用 `../assets/app` 角色透明图片以及 `../assets/icons` 同源 SVG；图标通过 CSS mask 使用原始资源。角色身份与颜色未改。字体子集来自系统安装的 Noto Serif CJK SC Bold（上游 https://github.com/notofonts/noto-cjk），授权随 `fonts/LICENSE.txt`。`references/` 为本轮生成的三张学习页视觉基准；代码适度收敛字体大小以保证可读性与适配。

原 App 未修改，Figma 未修改。网页主题切换仅用于本提案；实际系统安全区、键盘与动效需在未来 App 实现中验收。
