# xxy 的作品 · total_repository

个人作品总入口，纯 HTML / CSS / JS，无构建步骤。Three.js 使用本地文件，离线也能打开。

> 本仓库不设置 `index.html`。GitHub Pages 根地址不会自动进入作品页，请直接打开下面的 `作品总览.html`。

## 在线入口

- 新版总览：<https://wocao123103.github.io/total_repository/作品总览.html>
- 旧版目录：<https://wocao123103.github.io/total_repository/前端html学习网页/作品目录.html>
- 3D 作品架：<https://wocao123103.github.io/total_repository/三维作品架/作品数据立方.html>
- GitHub 仓库：<https://github.com/wocao123103/total_repository>

## 作品入口

| 编号 | 作品 | 入口 |
| --- | --- | --- |
| 01 | 智能日程助手 · 简介网页 | <https://wocao123103.github.io/smart_schedule/python%E8%AF%BE%E5%8A%A0%E8%BD%BD%E7%BD%91%E9%A1%B5.html> |
| 02 | 墨识 · 文字识别 | <https://wocao123103.github.io/ink_recognition-moshi-/index.html> |
| 03 | 作品数据立方 · Three.js | <https://wocao123103.github.io/total_repository/三维作品架/作品数据立方.html> |

## 文件结构

```text
total_repository/
├─ 作品总览.html                      # 新版单页总览
├─ README.md
├─ 素材/
│  ├─ 日程助手图标.png
│  └─ 墨识图标.png
├─ 三维作品架/
│  ├─ 作品数据立方.html               # 3D 作品页
│  ├─ 作品数据.js                     # 唯一数据源
│  ├─ 场景脚本.js                     # DOM + Three.js 场景
│  ├─ 三维引擎.min.js                 # Three.js r155
│  ├─ 样式.css
│  └─ 素材/
│     ├─ 日程助手图标.png
│     └─ 墨识图标.png
└─ 前端html学习网页/
   ├─ 作品目录.html                   # 旧版目录
   └─ 样式.css
```

## 路径对应关系

```text
作品总览.html
  ├─ 素材/日程助手图标.png
  ├─ 素材/墨识图标.png
  ├─ 前端html学习网页/作品目录.html
  └─ 三维作品架/作品数据立方.html

三维作品架/作品数据立方.html
  ├─ 三维作品架/样式.css
  ├─ 三维作品架/三维引擎.min.js
  ├─ 三维作品架/作品数据.js
  ├─ 三维作品架/场景脚本.js
  └─ 三维作品架/素材/*.png

前端html学习网页/作品目录.html
  └─ 前端html学习网页/样式.css
```

## 部署

1. 上传本目录全部文件到 `total_repository` 仓库根目录；
2. 删除旧版遗留的根目录 `work.html`、根目录 `style.css`、根目录 `作品目录.html`（如果还在）；
3. 打开 **Settings → Pages**；
4. Source 选择 **Deploy from a branch**；
5. Branch 选择 `main`，目录选择 **`/ (root)`**；
6. 直接访问：

```text
https://wocao123103.github.io/total_repository/作品总览.html
```

> 根地址 `https://wocao123103.github.io/total_repository/` 没有 `index.html`，不会自动进入作品页，这是有意为之。

## 本地预览

在项目目录启动本地服务：

```powershell
python -m http.server 8080
```

然后访问：

```text
http://127.0.0.1:8080/total_repository/作品总览.html
```

## 不放入仓库

```text
index.html                                  # 不设置根入口
前端html学习网页/python课加载网页.html      # 总览没有链接
前端html学习网页/python课加载网页-备份.html # 备份
前端html学习网页/预览.png                  # 未被引用
前端html学习网页.zip                       # 压缩备份
新质生产力城市模型（备用·直接打开）.html    # 不是本仓库作品
墨识介绍页-本地副本.html                    # 墨识线上已有正式介绍页
.workbuddy/                                # 本地工作记录
```
