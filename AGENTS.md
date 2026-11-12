# 知闲界面设计协作规则

1. 开始前读 `README.md`、`CHANGELOG.md`、`APP_SYNC.md`，再读 `design.json` 的 `workbench`。先 `git pull --ff-only`，保留工作区已有改动。
2. `design.json` 是设计事实源；修改保留图层 ID、组件引用和素材出处。`design-data.js` 由 `python3 scripts/sync_bundle.py` 生成，不单独修改；原始 `source/` 快照保持不变。
3. **每次改变必须在 `CHANGELOG.md` 追加记录**：日期、改了哪些页面/组件/图层、修改前后、原因、适用主题/平台、确认状态和实际验证。相同任务的一组修改合并记录，不能只写“优化界面”。
4. 同时更新 `APP_SYNC.md`：列出待应用的设计、App 路由/组件、验收要点。只有实际 App 代码已修改并验证后，才填写 App 提交号并标为“已应用”；提案、网页实现、App 实现分开标记。
5. 图标和图片复用 `assets/` 的真实资源，保留角色身份与透明背景。页面使用主题变量；不以 emoji、字符或整页截图替代可编辑图层。
6. 提交前运行 `node scripts/check.cjs`、`node --check app.js`、`node --check renderer.js`；修改保存服务时再运行 `python3 scripts/test_server.py`。视觉修改检查相关页面、浅深主题和窄屏，记录实际结果。
7. 保存到本地项目、补齐上述记录后，再按用户任务提交推送。`main` 推送通过检查后自动发布 GitHub Pages。线上浏览器草稿不能代替已提交代码；不得提交凭证、真实账号数据、缓存和 `.history/`。
