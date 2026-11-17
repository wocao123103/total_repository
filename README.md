# GitHub 上传清单 · 按当前改名整理

整理时间：2026-11-17  
依据：`https://github.com/wocao123103/total_repository/tree/main` 当前文件，以及本机 2026-11-16 改名后的目录。

当前远程仓库只有：

```text
README.md
style.css
作品总览.html
作品目录.html
```

其中 `作品总览.html` 已经改成引用这些新名字：

```text
素材/日程助手图标.png
素材/墨识图标.png
前端html学习网页/作品目录.html
三维作品架/作品数据立方.html
三维作品架/作品数据.js
```

但这些文件目前还没有上传，所以远程页面会缺图、3D 和旧版目录打不开。下面按改名后的结构重新整理。

---

## 一、total_repository 最终要上传的目录

```text
total_repository/
├─ index.html                         # 新增：跳转到 作品总览.html
├─ 作品总览.html                      # 保留：新版总览
├─ README.md                          # 重写：不再写 work.html
├─ 素材/
│  ├─ 日程助手图标.png
│  └─ 墨识图标.png
├─ 三维作品架/
│  ├─ 作品数据立方.html
│  ├─ 作品数据.js
│  ├─ 场景脚本.js
│  ├─ 三维引擎.min.js
│  ├─ 样式.css
│  └─ 素材/
│     ├─ 日程助手图标.png
│     └─ 墨识图标.png
└─ 前端html学习网页/
   ├─ 作品目录.html
   └─ 样式.css
```

### 与旧名字的对应

| 旧名字 | 现在的名字 |
| --- | --- |
| `index.html` 作为根入口 | 保留为跳转页，跳到 `作品总览.html` |
| `work.html` | 不再使用；旧版目录现在是 `前端html学习网页/作品目录.html` |
| `Thress.js/` | `三维作品架/` |
| `Thress.js/index.html` | `三维作品架/作品数据立方.html` |
| `Thress.js/data.js` | `三维作品架/作品数据.js` |
| `Thress.js/app.js` | `三维作品架/场景脚本.js` |
| `Thress.js/three.min.js` | `三维作品架/三维引擎.min.js` |
| `Thress.js/style.css` | `三维作品架/样式.css` |
| `assets/` | `素材/` |
| `前端html学习网页/works.html` | `前端html学习网页/作品目录.html` |
| `前端html学习网页/style.css` | `前端html学习网页/样式.css` |

### 远程需要删除的旧文件

如果仓库里还有下面这些，上传新目录后删掉，避免旧入口混淆：

```text
work.html
style.css              # 根目录旧目录页样式，新页面不需要
作品目录.html          # 根目录旧目录页，新目录在 前端html学习网页/ 下
```

> 远程根目录的 `作品目录.html` 和 `style.css` 不再被新总览引用，保留只会让仓库看起来有两套目录。

---

## 二、README 已重写

新的 `README.md` 已改成：

- 根地址跳到 `作品总览.html`；
- 旧版目录指向 `前端html学习网页/作品目录.html`；
- 3D 指向 `三维作品架/作品数据立方.html`；
- 文件结构与路径对应关系按新名字写；
- 明确列出不放入仓库的备份文件。

文件：

[total_repository/README.md](total_repository/README.md)

---

## 三、ink_recognition-moshi- 不需要改名

墨识仓库仍是旧名字和旧目录：

```text
index.html
tiyanban.html
assets/
tiyanban_assets/
docs/screenshots/
README.md
机制说明.md
AI接入说明.md
优化说明-第一优先级.md
运行环境说明.txt
.nojekyll
```

当前版本 **v1.01**，样本数字 **1,778**，不需要跟着 `total_repository` 改名。

安装包仍然不要放 GitHub：

```text
release/墨识安装助手.exe              # 约 92 MB
release/墨识手写识别-1.01-本地部署包.zip
```

---

## 四、时间顺序

| 日期 | 变化 |
| --- | --- |
| 2026-11-06 | 墨识基础页面、安装助手 |
| 2026-11-08 | 5200 类模型、网页体验版 ONNX |
| 2026-11-09 | Three.js 作品数据立方 |
| 2026-11-10 | 作品总览合并页 |
| 2026-11-11 | 墨识 v1.01：手写补样本、自动推荐字、站内确认弹窗 |
| 2026-11-16 | 本地统一改名：`素材/`、`三维作品架/`、`作品目录.html`、中文文件名 |
| 2026-11-17 | 按改名后的结构重做上传包与 README |

---

## 五、上传顺序

1. 打开 `github_upload/total_repository/`；
2. 把里面的 `index.html`、`作品总览.html`、`README.md`、`素材/`、`三维作品架/`、`前端html学习网页/` 全部上传；
3. 删除远程旧的 `work.html`、`style.css`、根目录 `作品目录.html`；
4. Settings → Pages → `main` / `/ (root)`；
5. 打开：

```text
https://wocao123103.github.io/total_repository/
```

应跳到：

```text
https://wocao123103.github.io/total_repository/作品总览.html
```

6. 检查：

- 两张作品图标正常显示；
- 旧版目录能打开 `前端html学习网页/作品目录.html`；
- 3D 作品架能打开 `三维作品架/作品数据立方.html`；
- 墨识卡片能打开线上墨识。

## 六、本地验证结果

已用本地 HTTP 服务验证改名后的目录：

```text
/                          → /作品总览.html
作品图标                    → 200
/三维作品架/作品数据立方.html → canvas 正常
/前端html学习网页/作品目录.html → 正常
所有本地资源                 → 无 404
```
