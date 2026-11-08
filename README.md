# xxy 的作品 · total_repository

这是我的作品总入口，用来放在线作品、简介页和可体验的网页版本。

## 在线入口

GitHub Pages 根地址会自动进入作品页：

```text
https://wocao123103.github.io/total_repository/
        ↓
https://wocao123103.github.io/total_repository/work.html
```

- 作品总展示：<https://wocao123103.github.io/total_repository/work.html>
- GitHub 仓库：<https://github.com/wocao123103/total_repository>

根目录的 `index.html` 只做一件事：把访问者送到 `work.html`。  
`work.html` 才是真正的作品目录页。

## 作品入口

| 编号 | 作品 | 入口 |
| --- | --- | --- |
| 01 | 智能日程助手 · 简介网页 | <https://wocao123103.github.io/smart_schedule/python%E8%AF%BE%E5%8A%A0%E8%BD%BD%E7%BD%91%E9%A1%B5.html> |
| 02 | 墨识 · 文字识别 | <https://wocao123103.github.io/ink_recognition-moshi-/index.html> |
| 03 | 墨识 · 网页体验版 | <https://wocao123103.github.io/ink_recognition-moshi-/tiyanban.html> |

## 文件结构

```text
total_repository/
  ├─ index.html      # 根入口：自动跳转到 work.html
  ├─ work.html       # 作品总展示页
  ├─ style.css       # 作品页样式
  └─ README.md       # 本说明
```

## 部署

1. 把 `index.html`、`work.html`、`style.css` 上传到 `total_repository` 仓库根目录；
2. 打开仓库 **Settings → Pages**；
3. Source 选择 **Deploy from a branch**；
4. Branch 选择 `main`，目录选择 **`/ (root)`**；
5. 保存后等待 Pages 构建；
6. 访问：

```text
https://wocao123103.github.io/total_repository/
```

会自动跳到：

```text
https://wocao123103.github.io/total_repository/work.html
```

## 本地预览

不要直接双击 `index.html`。在项目目录中启动一个本地 HTTP 服务：

```powershell
python -m http.server 8080
```

然后访问：

```text
http://127.0.0.1:8080/total_repository/
```

## 说明

- `index.html` 只是入口，不承载具体内容；
- 新增作品时，在 `work.html` 的目录列表里加一条即可；
- 页面不依赖外部前端框架，只有 `style.css` 一个本地样式文件；
- 外链统一使用 `target="_blank"` 和 `rel="noopener noreferrer"`。
