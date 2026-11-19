# Antigravity 中文界面支持状态监测

公开记录 Google Antigravity App 的最新版本、官方简体中文界面支持情况与核实时间。

## 数据原则

- App 版本以 [Google 官方更新日志](https://antigravity.google/docs/changelog) 的 **Antigravity App** 分栏为准。
- 中文支持仅指 App 官方中文界面，不包括中文对话、Antigravity IDE 的语言包或第三方汉化。
- 新版本出现但缺少官方语言证据时显示“待核实”，避免错误断言。
- 页面展示最近一次成功检查时间；来源获取失败时保留旧记录。

## 定时更新

GitHub Actions 每天在北京时间 00:00（UTC 前一日 16:00）检查官方更新日志及设置文档，更新 `site/status.json` 并发布 GitHub Pages。也可在 Actions 中手动运行。

GitHub Actions 的定时任务可能因平台负载稍有延迟。

网站属于独立第三方监测项目，与 Google 无关联。
