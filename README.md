# dsh-skill-picker

一个 DSH Web 插件：在输入框工具栏里加一个 **「技能」** 按钮，把技能中心里已有的技能按列表列出来点选，不用记名字、不用手打 `/` 斜杠命令。

面板形态与专家选择器一致：顶部搜索框，下面是按类别分组、每行带中文名与用途说明的列表。

## 它解决了什么

DSH 本身已经能用 `/技能名` 调用技能，也能在输入 `/` 时弹出候选——但前提是**你得先知道那个技能叫什么**。技能多了以后：名字是英文 slug（`dev-expert-pro`、`godot-game-script-engineer`），含义要靠猜；`/` 菜单只按名字模糊排序，不展示「这个技能到底是干什么的」。

本插件把技能目录摊开成人类可读的列表：

| | |
| --- | --- |
| 中文名 | 每行主标题是中文，例如 `office-xlsx` → **Excel 表格** |
| 一眼看懂用途 | 副标题一句话说明它能做什么 |
| 分组 | 开发编程 / 游戏开发 / 办公文档 / 搜索研究 / 平台扩展 / 系统环境 / 其他 |
| 搜索 | 中英文名、slug、描述、分组都能命中，多个词按「与」收窄 |
| 点选即插入 | 点一下就把 `/技能名 ` 填进草稿光标处，接着写需求发送 |

## 新装的技能能检索到吗

**能。** 列表不是写死的，每次打开面板都向宿主实时拉一次技能目录（`skills/list`，与 `/` 菜单同一个数据源）。你在技能中心新装、或往 `~/.dsh/skills` 丢一个新技能，重新打开面板就能看到；面板头部还有 **刷新** 按钮，可以不关面板直接重取。

对没有中文对照条目的新技能，插件不会把它藏起来：

- 主标题回退成从 slug 逐词首字母大写的可读形态（`brand-new-skill` → `Brand New Skill`）；
- 副标题用 `SKILL.md` 里的 `description`；
- 名字后挂一个灰色的 **未收录** 角标，说明它还没有人工整理的中文名——点选依旧插入 `/原始名`，功能不受影响。

想给它补中文名，在 `client.js` 的 `SKILL_INFO` 表里加一条即可（见下文「加一个中文名」）。

另外，`disable-model-invocation` 的技能（模型目录里看不到、只能用 `/` 手动调的那种）会带 **仅手动调用** 角标——这类技能本来只有 `/` 菜单和本选择器两个入口。

## 安装

```bash
dsh plugin --profile <profile> add link:<本仓库路径>
```

或在本机 DSH 里用插件管理器安装本目录。安装后在 **设置 → 插件** 里能看到「技能选择器」。

## 使用

1. 打开任一会话，输入框工具栏里点 **技能**；
2. 搜索或直接翻分组，点中一行；
3. 草稿里出现 `/技能名 `，补充需求后正常发送。

技能的实际加载仍由宿主根据发送的文本完成——本插件只负责把字符串写进草稿，不绕过任何调用路径。

## 加一个中文名

编辑 `client.js` 顶部的 `SKILL_INFO`：

```js
'office-xlsx': {
  zh: 'Excel 表格',
  group: '办公文档',
  emoji: '📊',
  desc: '读取、创建、编辑 .xlsx 工作簿、数据与公式。',
},
```

`group` 必须是 `GROUPS` 数组里的值之一；`emoji` 只用于行首图标。改完重载插件即可生效（`client.js` 是纯 JS，无需构建）。

## 实现要点

- 纯客户端插件，宿主半边 `index.js` 为空（`export function apply() {}`）——不注册工具、不产生模型 token。
- 目录经 `ctx.remote.skills` 的 `skills/list` 读取，与 `/` 菜单同源；需要一个已打开的会话（宿主 RPC 以会话身份选目录视图）。
- 插入走 `inputActions.captureInsertion()` + `insertText()`，是一次可撤销的编辑；只有草稿为空且插入被拒（只读态）时才退回 `setDraft()`，不会覆盖你已写的内容。
- 浮层用 `createPortal` 挂到 `document.body`（输入框所在的 composer 会裁切 fixed 定位子元素），Esc 关闭、点外部关闭、`aria-expanded` / `aria-haspopup` 齐全。
- 样式只引用 `--dsw-alias-*` 主题变量，浅色/深色跟随宿主；不引入任何 Harness 客户端包。

## 兼容性

已在 DSH **0.2.2-rc.2** 上验证（`engines.dsh: >=0.2.2-rc.1 <0.3.0`）。依赖的都是稳定接口：`ctx.slots.inject/register`、`ctx.locale`、`ctx.remote.skills`、`inputActions`。

### 与 rc.2 相关的两处目录变化

rc.2 把 Creator 模式的四个技能（`agent-experience`、`cordis-plugin-development`、`editing-cordis-compositions`、`cordis-composition-reference`）合并成了单个 `dsh-doc`，另外 `office-export-pdf` / `office-recalculate` / `office-render` 不再是独立技能，而是 `office` 加载后才出现的工具。

本插件因此：

- 为 `dsh-doc` 提供了中文名「DSH 使用手册」；
- 保留旧名字典条目不报错——旧版本 profile 仍能显示可读名称，新目录只是永远不会返回这些 id；
- 未收录的技能一律走「目录原始描述 + 未收录角标」的回退路径，所以即使将来再合并技能，列表也不会缺条目或崩溃。

## License

MIT
