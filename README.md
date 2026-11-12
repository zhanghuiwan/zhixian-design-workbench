# 知闲 App 设计工作台

- 网站：https://zhanghuiwan.github.io/zhixian-design-workbench/
- 仓库：https://github.com/zhanghuiwan/zhixian-design-workbench
- 协作规则：[AGENTS.md](AGENTS.md)；每次改动记入 [CHANGELOG.md](CHANGELOG.md)，App 待应用项记入 [APP_SYNC.md](APP_SYNC.md)。

## 换电脑继续设计

```bash
git clone git@github.com:zhanghuiwan/zhixian-design-workbench.git
cd zhixian-design-workbench
python3 serve.py --open
```

之后每次开始先 `git pull --ff-only`。不需要 npm 安装，Python 使用标准库；检查使用 Node.js 24。Windows/Linux 也可运行上面的 Python 命令，macOS 可双击启动器。

线上网站用于查看和编辑浏览器草稿，**不会自动写入 GitHub**。如在线上改了设计，点击“导出修改文件”，在本地工作台“导入 JSON”后“保存到项目”。本地改好后按以下流程提交；浏览器中的未导出草稿不跨电脑同步。

```bash
python3 scripts/sync_bundle.py
node scripts/check.cjs
# 更新 CHANGELOG.md 和 APP_SYNC.md，并检查 git diff
git add .
git commit -m "design: 描述这次具体界面修改"
git push
```

推送 `main` 后 GitHub Actions 先检查再发布，网站与提交版本一致。其他分支通过 PR 检查，合并 main 后发布。网站不会运行本地 Python 保存服务，也不会包含任何 GitHub 凭证。

## 将设计应用到 App

在 App 开发电脑拉取本设计仓库的最新 main，先读 AGENTS.md、CHANGELOG.md、APP_SYNC.md，再读 design.json 及 workbench.edits。按 workbench.routes 映射实现对应 App 页面；在实际 App 验证后回到 APP_SYNC.md 填写设计与 App 提交号。仅拉取本仓库不会自动改写 App。

离线整页文件是生成产物，不放入 Git 历史。需要时运行 `python3 scripts/build_standalone.py`，即可得到包含图像与字体的 `zhixian-workbench.html`。


2026-11-12（Asia/Shanghai）。用户指定以最新 Figma 为主，将页面、组件、配色与素材迁移到可持续维护的 HTML/CSS 网页。独立于业务 App，不需要 Figma MCP；网页项目独立于 App 仓库，公开发布至 GitHub Pages；本轮没有修改实际 App。

## 打开

双击本目录的 **启动设计工作台.command**，浏览器打开 <http://127.0.0.1:4178>。保持启动窗口运行。“保存到项目”依赖这个只监听本机的服务，不访问生产 API。

也可以运行 `python3 serve.py --open`。端口占用时用 `python3 serve.py --port 4179 --open`，不要停止不明进程。

`index.html` 可直接打开用于查看和浏览器草稿；`zhixian-workbench.html` 是包含全部设计、字体和素材的独立离线副本，可复制到另一台电脑。离线副本修改后需再次导出 JSON 或 HTML，不能直接覆盖仓库文件。

## 覆盖与来源

- 3 个 Figma 设计页；31 个原有页面/状态 + 4 个提案画框；12 个主组件、72 个实例、2007 个原稿图层；27 个颜色变量、2 个集合。
- 13 个 Android 路由全部映射；字阶、文字混排分段、布局坐标、约束、效果、组件引用与变量绑定保留在数据中。深色有原稿现存的 3 个页面，不虚构其余页面已有深色定稿。
- Figma 原始图像、可导出的 SVG 均已落地。原导出 51 个失败矢量属于 29 个图标容器，使用 App 同源 SVG 补齐。页面不会出现用 emoji 或字母代替的功能图标。
- 素材库包括 70 个 App 同源 SVG、7 个闲闲透明姿态、桌面图标、输入叶片与底栏叶片。原图身份和颜色保持。
- `source/figma-export-2026-11-12.json` 原样归档，SHA-256 记录在 `design.json → workbench.originalSha256`。插件原始 fileKey 为 null；规范化数据的文件 key 来自本地 Figma 窗口 URL，注明了补充来源。
- Figma 文件：<https://www.figma.com/design/WqjKYuFL5iIkLeA0Upez0m>。App 源码来源和 SHA-256 位于 `workbench.routes`。字体为 Google Fonts 的 Noto Sans SC 可变字体，源 `google/fonts/ofl/notosanssc/NotoSansSC[wght].ttf`，通过 jsDelivr 下载，OFL 原文随字体保留。

## 日常修改

1. 左侧选择页面或组件，点击画布中的图层；右侧“图层”也可选择深层及被覆盖的节点。
2. 在“设计”中改文字、位置、尺寸、字重、行高、填充、透明度与圆角。输入后点击“应用属性修改”；单项失焦也可提交。素材从素材库选择替换。支持撤销/重做。
3. 在“颜色与排版”修改 HEX 或透明度，点击对应“应用”；绑定该变量的页面会联动。浅色与深色变量独立保存。
4. 显式修改主组件的属性可传播到实例；主组件文字通过 Figma 子层 ID 传播，保留原有 Figma 实例覆盖，实例单独修改优先。不是完整 Figma 自动布局/组件变体引擎。
5. 修改自动保存为本浏览器草稿。完成后点击 **保存到项目**，更新 `design.json`、`design-data.js`、`changes.json`。旧文件备份到忽略的 `.history/`。
6. “导出”提供设计 JSON、包含所有素材的独立 HTML、颜色 CSS、开发说明 Markdown。多文件版的 JSON 含相对素材路径，单独交接 JSON 时应同时提供本目录 assets，或者交接独立 HTML。

## 下一次 AI / App 开发先读

1. 本文与本目录 `AGENTS.md`。
2. `design.json`：项目设计事实源。将 `workbench.edits.nodes[id]` 合并到同 ID 图层，`workbench.edits.variables[id]` 覆盖变量值；参考 `renderer.js` 的主组件传播与颜色解析。
3. `changes.json`：最近一次明确保存的修改。浏览器未保存草稿不等同于仓库最新设计。
4. `workbench.frames` 找画框和状态，`workbench.routes` 找 Android 实现路径；`workbench.differences` 区分 Figma 与 App 现状。
5. 查看网页及相关画框。页面视觉以 Figma / 工作台为主；业务行为、接口和已有用户内容不从设计示例推断。

`design-data.js` 是供直接打开网页的生成副本，不应独立维护。手工改 `design.json` 后运行 `python3 scripts/sync_bundle.py`；需要重新交接离线 HTML 时运行 `python3 scripts/build_standalone.py`。

## 可见差异和边界

最新 Figma 的 332×52 悬浮玻璃导航、任务卡和约80%透明浅绿白变量已保留。当前 App 仍为通栏64+安全区实色底栏；本轮只迁移设计，没有回写 App。4 个话题填入画框属于待确认提案，保留其状态。

Figma GLASS 的折射和色散没有 CSS 等价物；采用透明、模糊、高光描边、阴影近似，原效果参数和 SVG 参考仍在。原稿坐标完整保留；改文字/尺寸后需调整相邻图层，不自动实现完整布局引擎。原稿超出视口的内容保留在图层树，不删除，不声称所有长页面都已做成业务滚动原型。

字体随目录提供；浏览器与 Android 的栅格化、系统安全区、软键盘、动效仍需在 App 验收。现有深色画框数量不代表所有页面已覆盖深色。此工具用于设计维护与交接，不是完整 Figma 替代品或运行中的学习 App。

## 验证

见 `verification.json`。数据完整性和组件/变量传播：`node scripts/check.cjs`；临时目录保存验证：`python3 scripts/test_server.py`。两者不修改业务数据。仅设计工具有改动，不需要运行 App/后端构建。
