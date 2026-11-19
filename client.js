/**
 * Skill picker — a composer control that lists every installed skill as a
 * clickable row with a Chinese display name and a one-line explanation.
 *
 * The catalog comes from the shipped `ctx.remote.skills` Remote (the same one
 * the `/` menu uses), so the picker never offers a skill the Host would refuse.
 * Picking a row types the matching `/name` command into the draft; the Host
 * still loads the skill from the sent text, so nothing here can bypass the
 * normal invocation path.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-skill-picker',
  factory(require) {
    const React = require('react')
    const ReactDOM = require('react-dom')
    const h = React.createElement
    const NS = 'skill-picker'

    /* ------------------------------------------------------------------ *
     * Display metadata. Keys are catalog ids: one entry per skill gives it a
     * Chinese label, a section and one line about what it is for. A skill the
     * table does not know is still listed, labelled from the catalog and
     * placed by GROUP_RULES, so a new install never disappears or lands in
     * 「其他」 just because nobody typed a name for it. Keys for skills a newer
     * release retired stay here so an older profile keeps readable names.
     * ------------------------------------------------------------------ */
    const SKILL_INFO = {
      'dev-expert': {
        zh: '编程专家',
        group: '开发编程',
        emoji: '👨‍💻',
        desc: '全栈编程助手：API 设计、Bug 诊断、代码生成与审查、重构、测试、性能与任务拆解。',
      },
      'dev-expert-pro': {
        zh: '编程专家 Pro',
        group: '开发编程',
        emoji: '🚀',
        desc: '在编程专家之上补充鸿蒙 ArkTS/ArkUI、微信小程序与小游戏资料，按专题读包内知识。',
      },
      'dev-god': {
        zh: '编程大神',
        group: '开发编程',
        emoji: '🧙',
        desc: '接手陌生代码库：拆需求、补实现、追根因、做重构、联调前后端，推进到能运行能验收。',
      },
      'game-design': {
        zh: '游戏概念与设计',
        group: '游戏设计',
        emoji: '📐',
        desc: '把小说或产品需求变成可玩的游戏概念，写世界观规则、关卡与分支叙事、美术音频方向。',
      },
      'game-designer': {
        zh: '游戏系统设计师',
        group: '游戏设计',
        emoji: '🎮',
        desc: '设计玩法机制与核心循环、经济系统与通胀模型、进阶曲线与数值配平，撰写 GDD 并规划试玩。',
      },
      'game-development-pro': {
        zh: '全引擎游戏开发',
        group: '游戏设计',
        emoji: '🕹️',
        desc: '覆盖设计到实现的游戏全流程：关卡、叙事、技术美术、音频，以及 Blender/Godot/Roblox/Unity/Unreal。',
      },
      'game-build': {
        zh: '游戏构建实现',
        group: '游戏设计',
        emoji: '🏗️',
        desc: '把已确认的设计做成能跑的灰盒再到成品，含规则回归、一条端到端验证命令和构建简报。',
      },
      'game-qa': {
        zh: '游戏盲玩验收',
        group: '游戏设计',
        emoji: '🔍',
        desc: '不读源码，以新玩家身份在目标环境从头盲玩，查上手引导、操作流与节奏问题，产出验收记录。',
      },
      'novel-to-game': {
        zh: '小说改编游戏',
        group: '游戏设计',
        emoji: '📖',
        desc: '端到端把小说改成可玩游戏：需求、改编分析、概念、世界与视觉设计、构建、盲玩验收。',
      },
      'novel-game-analyze': {
        zh: '小说拆解分析',
        group: '游戏设计',
        emoji: '🔬',
        desc: '拆小说为改编素材：主线弧光、冲突场景、人物关系与动机、秘密与信息差、世界规则、改编边界。',
      },
      router: {
        zh: '游戏开发路由',
        group: '游戏设计',
        emoji: '🧭',
        desc: '判断需求属于哪个引擎与哪类任务（Godot/Unity/Unreal/Godot/Bevy/Phaser 等），再指向正确的技能。',
      },
      'card-game': {
        zh: '卡牌与构筑',
        group: '游戏类型',
        emoji: '🃏',
        desc: '设计卡牌与 deckbuilder：卡牌即数据加一个效果解释器、牌区、触发栈与可复现洗牌。',
      },
      'dialogue-systems': {
        zh: '分支对话系统',
        group: '游戏类型',
        emoji: '💬',
        desc: '用 Ink / Yarn Spinner / JSON 图做分支对话：台词、选项、条件、变量与本地化 ID。',
      },
      'fps-shooter': {
        zh: '第一人称射击',
        group: '游戏类型',
        emoji: '🔫',
        desc: '设计射击战斗：命中扫描与抛射物、击杀耗时、伤害衰减、后坐力、开镜灵敏度与延迟补偿。',
      },
      platformer: {
        zh: '平台跳跃',
        group: '游戏类型',
        emoji: '🎯',
        desc: '设计 2D 平台跳跃：土狼时间、跳跃缓冲、可变跳跃高度、下落重力、墙角修正、墙跳与检查点。',
      },
      puzzle: {
        zh: '解谜玩法',
        group: '游戏类型',
        emoji: '🧩',
        desc: '设计网格与逻辑解谜：三消连锁、推箱子、唯一解谜题（数织/数独）、精确撤销与求解器验关。',
      },
      roguelike: {
        zh: 'Roguelike 循环',
        group: '游戏类型',
        emoji: '☠️',
        desc: '设计单局制 Roguelike：局内结构、永久死亡、局外成长、种子与每日挑战、回合顺序与对称视野。',
      },
      rpg: {
        zh: 'RPG 数值',
        group: '游戏类型',
        emoji: '⚔️',
        desc: '设计 RPG 进阶与战斗数值：带修正器栈的属性、经验曲线、伤害公式、装备词缀与任务。',
      },
      'survival-crafting': {
        zh: '生存与制作',
        group: '游戏类型',
        emoji: '🪓',
        desc: '设计生存制作循环：采集、配方与科技树、负重、腐坏、饥饿与温度、基地建造。',
      },
      'tower-defense': {
        zh: '塔防设计',
        group: '游戏类型',
        emoji: '🏰',
        desc: '设计塔防：路线与迷宫寻路、波次节奏、索敌优先级、护甲与飞行克星、金币经济。',
      },
      'visual-novel': {
        zh: '视觉小说',
        group: '游戏类型',
        emoji: '📺',
        desc: '用 Ren\'Py 或任意引擎做视觉小说：路线与结局、随时存档、回顾、仅跳过已读与打字机文本。',
      },
      'game-ai': {
        zh: '游戏 AI 设计',
        group: '玩法机制',
        emoji: '🤖',
        desc: '设计敌人与 NPC AI：选 FSM / 行为树 / 效用 / GOAP，并做感知、转向与 A* 寻路。',
      },
      'ai-behavior-trees-utility-ai': {
        zh: '行为树与效用 AI',
        group: '玩法机制',
        emoji: '🌳',
        desc: '与引擎无关的行为树与效用 AI 代码：黑板、响应式复合节点、装饰器与响应曲线打分。',
      },
      'input-systems': {
        zh: '输入系统',
        group: '玩法机制',
        emoji: '🎛️',
        desc: '设计输入架构：具名动作、摇杆死区、按键缓冲、带冲突检测的改键，含 Godot InputMap 代码。',
      },
      'save-systems': {
        zh: '存档系统',
        group: '玩法机制',
        emoji: '💾',
        desc: '与引擎无关的存档读档：序列化什么、槽位与自动存档、原子写入与版本迁移。',
      },
      'level-design': {
        zh: '关卡设计',
        group: '玩法机制',
        emoji: '🗺️',
        desc: '与引擎无关的关卡设计：按真实控制器取玩家度量、钥匙与能力门禁与死锁检查、节奏铺陈。',
      },
      'procedural-gen': {
        zh: '程序化生成',
        group: '玩法机制',
        emoji: '🌀',
        desc: '用 Python 做程序化生成：可复现随机、地牢布局、波函数坍缩、噪声地形与战利品表。',
      },
      'game-feel': {
        zh: '手感与打击感',
        group: '体验与表现',
        emoji: '💥',
        desc: '给可用机制加手感：基于创伤值的震屏、命中停顿、缓动补间、挤压拉伸与击退。',
      },
      'audio-design': {
        zh: '游戏音频设计',
        group: '体验与表现',
        emoji: '🎵',
        desc: '与引擎无关的音频技术：总线布局、分贝音量滑杆、响度、对白压低音乐、自适应音乐与音效变化。',
      },
      'camera-systems': {
        zh: '摄像机系统',
        group: '体验与表现',
        emoji: '🎥',
        desc: '做游戏摄像机：2D 跟随死区与前瞻、第三人称环绕、第一人称视角与分屏。',
      },
      'performance-optimization': {
        zh: '性能优化',
        group: '体验与表现',
        emoji: '⚡',
        desc: '靠测量定位掉帧：CPU 还是 GPU 瓶颈，再取最大收益的修法（合批、对象池、GC 抖动）。',
      },
      'physics-tuning': {
        zh: '物理调校',
        group: '体验与表现',
        emoji: '🧲',
        desc: '与引擎无关的物理调校：固定步长与插值、穿模用 CCD、阻尼、求解迭代与碰撞层矩阵。',
      },
      'shader-programming': {
        zh: '着色器原理',
        group: '体验与表现',
        emoji: '✨',
        desc: '与引擎无关的着色器技术（GLSL，含 HLSL 对照）：消融、描边、菲涅尔边缘与后处理。',
      },
      'create-game-assets': {
        zh: '游戏美术资产',
        group: '体验与表现',
        emoji: '🎨',
        desc: '规划、生成或选材并校验一致的游戏美术：风格指南、精灵、像素画、图集、图标与贴图。',
      },
      'game-ui-ux': {
        zh: '游戏 UI 规则',
        group: '游戏 UI',
        emoji: '🖼️',
        desc: '与引擎无关的 HUD 与菜单规则：锚点与容器、缩放、安全区、手柄焦点、事件驱动 HUD 与无障碍底线。',
      },
      'game-ui-product-design': {
        zh: '游戏 UI 策划',
        group: '游戏 UI',
        emoji: '📋',
        desc: '出图前先做策划：写 GDD、PRD 与 UI 交互逻辑、交互流程与状态机。',
      },
      'game-ui-specification': {
        zh: '游戏 UI 规范',
        group: '游戏 UI',
        emoji: '📏',
        desc: '建立游戏 UI 规范与共享视觉契约：色彩、字体、布局、几何、组件、交互态、适配与生图约束。',
      },
      'game-ui-extension': {
        zh: '游戏 UI 扩屏',
        group: '游戏 UI',
        emoji: '🧱',
        desc: '把已有游戏 UI 扩成完整屏幕体系：玩家旅程、功能流程、优先级清单、状态、边界与实现契约。',
      },
      'game-ui-page-generator': {
        zh: '游戏 UI 出图',
        group: '游戏 UI',
        emoji: '🖌️',
        desc: '按已确认风格与屏幕契约，一次生成一整张游戏 UI 页面，附页面简报、可复现提示词与负向约束。',
      },
      'game-ui-component-breakdown': {
        zh: '游戏 UI 拆组件',
        group: '游戏 UI',
        emoji: '🧩',
        desc: '把已确认的游戏 UI 页面或风格拆成可单独生成的组件资产：命名、状态、尺寸、提示词与可追溯清单。',
      },
      'game-ui-sprite-sheet-splitter': {
        zh: 'UI 拼图拆分',
        group: '游戏 UI',
        emoji: '✂️',
        desc: '把整张游戏 UI 拼图或组件板拆成独立透明 PNG，写出裁剪元数据、校验尺寸与 alpha、打包 ZIP。',
      },
      'game-ui-asset-pipeline': {
        zh: 'UI 图集交付',
        group: '游戏 UI',
        emoji: '📦',
        desc: '把语义化命名的透明 UI PNG 打成图集，保留组件状态与九宫格元数据，导出确定性 JSON 交付清单。',
      },
      'game-ui-workflow': {
        zh: '游戏 UI 全流程',
        group: '游戏 UI',
        emoji: '🔗',
        desc: '串起端到端游戏 UI 流水线：策划、规范、扩屏、出图、拆组件、拆分、打包、打图集、交付与校验。',
      },
      'godot-game-script-engineer': {
        zh: 'Godot 脚本工程',
        group: '引擎专精',
        emoji: '🕹️',
        desc: 'Godot 4.x 玩法脚本专家：GDScript 2.0 类型安全、节点拆分、signal 解耦、Resource 建模与性能下沉。',
      },
      'godot-gdscript': {
        zh: 'GDScript 语言',
        group: '引擎专精',
        emoji: '📜',
        desc: 'Godot 4.7 GDScript 2.0：静态类型、@export 与 @onready、await 协程，以及 3.x 代码迁移。',
      },
      'godot-2d-movement': {
        zh: 'Godot 2D 移动',
        group: '引擎专精',
        emoji: '🏃',
        desc: 'Godot 4.7 CharacterBody2D 移动：平台跳跃、俯视八向、斜坡与单向平台，附无头落地测试。',
      },
      'godot-3d-essentials': {
        zh: 'Godot 3D 基础',
        group: '引擎专精',
        emoji: '🧊',
        desc: 'Godot 4.7 3D 场景搭建：Camera3D、光照、WorldEnvironment、材质、GridMap 与局部全局变换。',
      },
      'godot-animation': {
        zh: 'Godot 动画',
        group: '引擎专精',
        emoji: '🎞️',
        desc: 'Godot 4.7 动画 API：AnimationPlayer、AnimationTree 状态机、AnimatedSprite2D 与 create_tween()。',
      },
      'godot-audio': {
        zh: 'Godot 音频',
        group: '引擎专精',
        emoji: '🔊',
        desc: 'Godot 4.7 音频 API：AudioStreamPlayer 2D/3D、总线布局、音量与静音、复音、循环导入与播放位置。',
      },
      'godot-csharp': {
        zh: 'Godot C#',
        group: '引擎专精',
        emoji: '©️',
        desc: 'Godot 4.7 里的 C# 与 .NET：partial 节点类、PascalCase 生命周期、[Export] 与 [Signal] 及 csproj。',
      },
      'godot-export': {
        zh: 'Godot 导出',
        group: '引擎专精',
        emoji: '📤',
        desc: '导出 Godot 4.7 项目：模板、桌面/Web/Android 的 export_presets.cfg、命令行导出与 Web COOP/COEP 头。',
      },
      'godot-gdscript-headless-testing': {
        zh: 'Godot 无头测试',
        group: '引擎专精',
        emoji: '✅',
        desc: '用 godot --headless 跑 GDScript 测试与 SceneTree runner，失败返回非零，让 CI 能卡住合并。',
      },
      'godot-multiplayer': {
        zh: 'Godot 联机',
        group: '引擎专精',
        emoji: '🌐',
        desc: 'Godot 4.7 高层联机：ENet 建立与加入、@rpc 与 rpc_id()、MultiplayerSpawner 与 Synchronizer。',
      },
      'godot-nodes-scenes': {
        zh: 'Godot 场景树',
        group: '引擎专精',
        emoji: '🌲',
        desc: 'Godot 4.7 场景树结构：可复用 .tscn、instantiate()、autoload，以及断链 res:// 与 uid 检查。',
      },
      'godot-physics': {
        zh: 'Godot 物理',
        group: '引擎专精',
        emoji: '⚙️',
        desc: 'Godot 4.7 物理 API：刚体与 Area 类型、碰撞层与掩码、受击盒信号、RayCast 与空间查询、Jolt。',
      },
      'godot-resources': {
        zh: 'Godot 资源',
        group: '引擎专精',
        emoji: '🗃️',
        desc: 'Godot 4.7 数据驱动：自定义 Resource、class_name 与 @export、.tres、共享引用与 duplicate_deep()。',
      },
      'godot-shaders': {
        zh: 'Godot 着色器',
        group: '引擎专精',
        emoji: '💠',
        desc: 'Godot 4.7 着色语言：canvas_item、spatial 与粒子着色器、内置量、ShaderMaterial 接线与编译检查。',
      },
      'godot-signals-groups': {
        zh: 'Godot 信号分组',
        group: '引擎专精',
        emoji: '📡',
        desc: 'Godot 4.7 信号与节点组：类型化信号、Callable 连接、一次性与延迟连接、事件总线与 call_group。',
      },
      'godot-tilemap': {
        zh: 'Godot 瓦片地图',
        group: '引擎专精',
        emoji: '🧱',
        desc: 'Godot 4.7 TileMapLayer 与 TileSet：图集源、数据层、地形自动拼接与运行时 set_cell / local_to_map。',
      },
      'godot-ui-control': {
        zh: 'Godot UI 控件',
        group: '引擎专精',
        emoji: '🪟',
        desc: 'Godot 4.7 Control 节点：锚点、容器、Theme 与 StyleBox、焦点邻居与拉伸设置，附无头布局检查。',
      },
      'dreamina-canvas-cli': {
        zh: '即梦画布创作',
        group: '多媒体创作',
        emoji: '🎨',
        desc: '通过即梦画布做图、视频与音频创作：文生图、图生图、文生视频、参考视频、首尾帧、配音与音乐。',
      },
      'jimeng-drama': {
        zh: '短剧漫剧创作',
        group: '多媒体创作',
        emoji: '🎬',
        desc: '竖屏多集短剧/漫剧全流程：故事设定、分集大纲、剧本、角色与场景图、分镜、片段视频与合成。',
      },
      'xyq-skill': {
        zh: '小云雀媒体创作',
        group: '多媒体创作',
        emoji: '🐦',
        desc: '用小云雀 CLI 上传素材或生图、生成视频、超分与擦字幕，并可操作画布、节点、3D 导演台与多轨草稿。',
      },
      'xyq-short-drama-skill': {
        zh: '小云雀短剧',
        group: '多媒体创作',
        emoji: '🎭',
        desc: '调用小云雀短剧 Agent：原创或续写剧本、分集创作、角色场景图、故事版、片段视频与合成成片。',
      },
      'xyq-marketing-skill': {
        zh: '小云雀营销成片',
        group: '多媒体创作',
        emoji: '📣',
        desc: '用小云雀公开营销 API，按商品图文生成剧情广告、品牌大片或达人带货视频，并查询进度与积分。',
      },
      office: {
        zh: 'Office 文档套件',
        group: '办公文档',
        emoji: '📚',
        desc: '办公任务总入口；加载后才启用渲染、转换与重算工具，再转到 Word/Excel/PPT 分技能。',
      },
      'office-docx': {
        zh: 'Word 文档',
        group: '办公文档',
        emoji: '📄',
        desc: '创建、读取、编辑并校验 .docx 文档。',
      },
      'office-xlsx': {
        zh: 'Excel 表格',
        group: '办公文档',
        emoji: '📊',
        desc: '读取、创建、编辑并校验 .xlsx 工作簿、数据与公式。',
      },
      'office-pptx': {
        zh: 'PPT 演示文稿',
        group: '办公文档',
        emoji: '📽️',
        desc: '创建、读取、编辑并校验 .pptx 演示文稿。',
      },
      'multi-search-engine': {
        zh: '多引擎搜索',
        group: '搜索研究',
        emoji: '🔎',
        desc: '跨 16 个搜索引擎检索、去重并交叉验证，输出带来源链接与可信度标注的结构化结果。',
      },
      'dsh-doc': {
        zh: 'DSH 使用手册',
        group: '平台扩展',
        emoji: '📖',
        desc: '查 DSH 自身的功能、设置、插件、预设、工具与 Cordis API，也用于升级插件或 profile。',
      },
      'skill-creator': {
        zh: '技能编写指南',
        group: '平台扩展',
        emoji: '✍️',
        desc: '教你写好一个技能：结构、触发描述、知识组织与可复用工作流，用于新建或改进技能。',
      },
      'hindsight-coding-agent': {
        zh: 'Hindsight 记忆',
        group: '平台扩展',
        emoji: '🧠',
        desc: '读写跨会话的编码记忆，按仓库配置知识库，排查记忆相关问题。',
      },
      'taptap-maker': {
        zh: 'TapTap Maker',
        group: '平台扩展',
        emoji: '🛠️',
        desc: 'TapTap Maker / WorkBuddy 本地游戏开发：创建同步 Maker 项目、开发 UrhoX 游戏、提交构建与查反馈。',
      },
      'diagnose-windows-sandbox-acl': {
        zh: 'Windows 沙箱权限诊断',
        group: '系统环境',
        emoji: '🛡️',
        desc: '排查 Windows 上意外的沙箱拒绝访问，检查并修复相关目录 ACL。',
      },
    }

    const GROUPS = ['开发编程', '游戏设计', '游戏类型', '玩法机制', '体验与表现', '游戏 UI', '引擎专精', '多媒体创作', '办公文档', '搜索研究', '平台扩展', '系统环境', '其他']

    const GROUP_EMOJI = {
      '开发编程': '🛠️',
      '游戏设计': '📐',
      '游戏类型': '🎲',
      '玩法机制': '⚙️',
      '体验与表现': '💥',
      '游戏 UI': '🖼️',
      '引擎专精': '🧊',
      '多媒体创作': '🎬',
      '办公文档': '📄',
      '搜索研究': '🔎',
      '平台扩展': '🧩',
      '系统环境': '🛡️',
      '其他': '📦',
    }

    /** Prefix rules that place a skill the table above does not list. */
    const GROUP_RULES = [
      ['godot-', '引擎专精'],
      ['unity-', '引擎专精'],
      ['unreal-', '引擎专精'],
      ['roblox-', '引擎专精'],
      ['phaser-', '引擎专精'],
      ['pixijs-', '引擎专精'],
      ['threejs-', '引擎专精'],
      ['bevy-', '引擎专精'],
      ['game-ui-', '游戏 UI'],
      ['godot-ui', '引擎专精'],
      ['office-', '办公文档'],
      ['xyq-', '多媒体创作'],
      ['jimeng-', '多媒体创作'],
      ['dreamina-', '多媒体创作'],
    ]

    const zh = {
      'button.label': '技能',
      'button.title': '浏览并选择技能',
      'panel.title': '选择技能',
      'panel.search': '搜索技能名称或用途',
      'panel.empty': '没有匹配的技能',
      'panel.emptyHint': '换个关键词，或清空搜索框查看全部技能。',
      'panel.loading': '正在读取技能列表…',
      'panel.error': '技能列表读取失败',
      'panel.retry': '重试',
      'panel.hint': '点击后会自动填入 /技能名，再补充具体需求即可发送。',
      'panel.count': '{0} 个技能',
      'panel.noSession': '请先在会话中选择一个工作区，再挑选技能。',
      'panel.refresh': '刷新',
      'panel.refreshTitle': '重新读取技能目录（新装的技能会立刻出现）',
      'panel.unknown': '未收录',
      'panel.unknownTitle': '这个技能还没有中文名，先按目录原名显示；点选后会插入 /原名。',
      'panel.manualOnly': '仅手动调用',
      'panel.manualOnlyTitle': '该技能已关闭模型自动调用，只能从这里或 / 菜单主动选用。',
      'panel.descMatch': '名称里没有匹配项，以下是用途里提到「{0}」的技能',
      'panel.descMatchShort': '按用途匹配',
    }
    const en = {
      'button.label': 'Skills',
      'button.title': 'Browse and pick a skill',
      'panel.title': 'Pick a skill',
      'panel.search': 'Search by name or purpose',
      'panel.empty': 'No matching skill',
      'panel.emptyHint': 'Try another keyword, or clear the search to see every skill.',
      'panel.loading': 'Loading skills…',
      'panel.error': 'Could not read the skill catalog',
      'panel.retry': 'Retry',
      'panel.hint': 'Picking a row fills /skill-name into the draft; add your request, then send.',
      'panel.count': '{0} skills',
      'panel.noSession': 'Open a session in a workspace first, then pick a skill.',
      'panel.refresh': 'Refresh',
      'panel.refreshTitle': 'Re-read the skill catalog (newly added skills appear immediately)',
      'panel.unknown': 'no title',
      'panel.unknownTitle': 'This skill has no display name yet, so it shows its catalog name; picking it inserts /name.',
      'panel.manualOnly': 'manual only',
      'panel.manualOnlyTitle': 'Model invocation is disabled for this skill; pick it here or from the / menu.',
      'panel.descMatch': 'Nothing matched by name; these skills mention "{0}" in their purpose',
      'panel.descMatchShort': 'matched by purpose',
    }

    const CSS = `
.skp-root { display: inline-flex; align-items: center; }
.skp-button {
  display: inline-flex; align-items: center; gap: 6px;
  height: 28px; padding: 0 8px; border-radius: 8px;
  border: 1px solid transparent; background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit; font-size: 12.5px; cursor: pointer; white-space: nowrap;
}
.skp-button:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.skp-button[aria-expanded="true"] {
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary);
  border-color: var(--dsw-alias-border-l1);
}
.skp-button:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.skp-panel {
  position: fixed; z-index: 2400; box-sizing: border-box;
  display: flex; flex-direction: column; overflow: hidden;
  background: var(--dsw-alias-bg-overlay);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 14px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, .22);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
}
.skp-head { display: flex; flex-direction: column; gap: 8px; padding: 12px 12px 8px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.skp-head-row { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.skp-title { font-size: 13.5px; font-weight: 600; }
.skp-count { font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.skp-desc-match {
  padding: 1px 5px; border-radius: 5px; font-size: 10px; white-space: nowrap;
  color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-2);
}
.skp-search {
  width: 100%; box-sizing: border-box; height: 32px; padding: 0 10px;
  border-radius: 9px; border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary);
  font: inherit; font-size: 13px; outline: none;
}
.skp-search::placeholder { color: var(--dsw-alias-state-idle-primary); }
.skp-search:focus { border-color: var(--dsw-alias-brand-primary); }
.skp-body { overflow-y: auto; padding: 6px 6px 8px; overscroll-behavior: contain; }
.skp-group { padding: 6px 10px 4px; font-size: 11.5px; font-weight: 600; letter-spacing: .02em; color: var(--dsw-alias-label-secondary); }
.skp-row {
  display: flex; gap: 10px; width: 100%; box-sizing: border-box; text-align: left;
  align-items: flex-start; padding: 8px 10px; border: 0; border-radius: 10px;
  background: transparent; color: inherit; font: inherit; cursor: pointer;
}
.skp-row:hover, .skp-row:focus-visible { background: var(--dsw-alias-bg-layer-2); outline: none; }
.skp-emoji {
  flex: none; width: 28px; height: 28px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  background: var(--dsw-alias-bg-layer-2); font-size: 15px; line-height: 1;
}
.skp-text { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.skp-name { font-size: 13px; font-weight: 600; line-height: 1.35; }
.skp-name small { margin-left: 6px; font-weight: 400; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.skp-badge-inline { margin-left: 0; margin-right: 6px; }
.skp-badge {
  margin-left: 6px; padding: 1px 5px; border-radius: 5px; font-size: 10px; font-weight: 500;
  color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-2);
  vertical-align: 1px;
}
.skp-head-side { display: inline-flex; align-items: center; gap: 6px; }
.skp-refresh {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; padding: 0; border-radius: 6px; cursor: pointer;
  border: 1px solid transparent; background: transparent;
  color: var(--dsw-alias-label-secondary);
}
.skp-refresh:hover:not(:disabled) {
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary);
  border-color: var(--dsw-alias-border-l1);
}
.skp-refresh:disabled { opacity: .45; cursor: default; }
.skp-refresh:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.skp-desc {
  font-size: 12px; line-height: 1.45; color: var(--dsw-alias-label-secondary);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.skp-note { padding: 8px 12px; font-size: 11.5px; color: var(--dsw-alias-label-secondary); border-top: 1px solid var(--dsw-alias-border-l1); }
.skp-state { padding: 18px 14px; text-align: center; color: var(--dsw-alias-label-secondary); font-size: 12.5px; line-height: 1.6; }
.skp-error { color: var(--dsw-alias-state-error-primary); }
.skp-retry {
  margin-top: 8px; height: 26px; padding: 0 10px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px;
}
`

    /** Catalog-only fallback label for a skill the dictionary does not know. */
    function fallbackName(name) {
      return String(name || '')
        .split(/[-_]/)
        .filter(Boolean)
        .map((part) => (part.length > 1 ? part[0].toUpperCase() + part.slice(1) : part.toUpperCase()))
        .join(' ')
    }

    function nameOf(skill) {
      const known = SKILL_INFO[skill.name]
      return (known && known.zh) || fallbackName(skill.name)
    }

    /**
     * Section for a skill: an explicit table entry wins, otherwise the first
     * matching prefix rule, otherwise 「其他」. The rule fallback is what keeps a
     * newly installed engine or UI skill out of 「其他」 even before anyone
     * gives it a Chinese label.
     */
    function groupOf(skill) {
      const known = SKILL_INFO[skill.name]
      if (known && GROUPS.includes(known.group)) return known.group
      const id = String(skill.name || '').toLowerCase()
      for (const [prefix, group] of GROUP_RULES) {
        if (id.startsWith(prefix)) return group
      }
      return '其他'
    }

    function emojiOf(skill) {
      const known = SKILL_INFO[skill.name]
      return (known && known.emoji) || GROUP_EMOJI[groupOf(skill)] || '📦'
    }

    function descOf(skill) {
      const known = SKILL_INFO[skill.name]
      const text = (known && known.desc) || skill.description || skill.whenToUse || ''
      return String(text).replace(/\s+/g, ' ').trim()
    }

    function sortGroups(names) {
      return [...names].sort((a, b) => {
        const ai = GROUPS.indexOf(a)
        const bi = GROUPS.indexOf(b)
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
      })
    }

    /**
     * Skills flagged `disable-model-invocation` never reach the model's own
     * catalog; this picker and the `/` menu are their only entry points, so the
     * row says so. (`SkillEntry` carries no `source` field, so provenance is
     * not claimed here.)
     */
    function manualOnly(skill) {
      return skill.modelInvocable === false
    }

    /**
     * What a search term is matched against, strongest first. A skill's own
     * name and id say what it IS; its description mostly names other skills it
     * pairs with ("…not for Godot UI"), so treating description text as an equal
     * match made `godot` return unrelated rows that merely mention Godot.
     */
    function nameHaystack(skill) {
      return [nameOf(skill), skill.name, groupOf(skill)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
    }

    function descHaystack(skill) {
      return [descOf(skill), skill.description, skill.whenToUse]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
    }

    /**
     * Every whitespace-separated term must be satisfied by the same field, so
     * "office xlsx" and "表格 公式" narrow instead of widening.
     *
     * Name/id/group hits are the primary set. Description hits are only
     * consulted when the query matches nothing by name, so a search for a name
     * never drags in rows that merely mention that word in prose.
     */
    function matchSkills(skills, terms) {
      if (terms.length === 0) return { rows: skills, byDescription: false }
      const byName = skills.filter((skill) => {
        if (!skill || !skill.name) return false
        const hay = nameHaystack(skill)
        return terms.every((term) => hay.includes(term))
      })
      if (byName.length > 0) return { rows: byName, byDescription: false }
      const byDesc = skills.filter((skill) => {
        if (!skill || !skill.name) return false
        const hay = descHaystack(skill)
        return terms.every((term) => hay.includes(term))
      })
      return { rows: byDesc, byDescription: byDesc.length > 0 }
    }

    /** Prefix hits on the id or the display name float to the top of their group. */
    function rankOf(skill, terms) {
      if (terms.length === 0) return 0
      const id = String(skill.name || '').toLowerCase()
      const display = nameOf(skill).toLowerCase()
      const first = terms[0]
      if (id.startsWith(first) || display.startsWith(first)) return 0
      if (id.includes(first) || display.includes(first)) return 1
      return 2
    }

    /** Fixed overlay geometry: above the control, clamped into the viewport. */
    function panelGeometry(anchor) {
      const rect = anchor.getBoundingClientRect()
      const width = Math.max(260, Math.min(400, window.innerWidth - 24))
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - 12 - width))
      const bottom = Math.max(12, window.innerHeight - rect.top + 8)
      const maxHeight = Math.max(220, Math.min(460, rect.top - 16))
      return { left, bottom, width, maxHeight }
    }

    /** Whether the text ends with whitespace (a new token can follow directly). */
    function isSpaceTail(text) {
      if (text === '') return true
      const last = text.charCodeAt(text.length - 1)
      return last === 32 || last === 10 || last === 9 || last === 13 || last === 0x3000
    }

    /** Fallback translator for a window whose locale service is unavailable. */
    function localTranslator() {
      const isEn = typeof document !== 'undefined'
        && String(document.documentElement.lang || '').toLowerCase().startsWith('en')
      const dict = isEn ? en : zh
      return (key, params) => {
        const template = dict[key] || key
        if (!params) return template
        return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))
      }
    }

    /** Locale-bound translator that re-renders on a language switch. */
    function useTranslator(localeService) {
      const usable = localeService
        && typeof localeService.bind === 'function'
        && typeof localeService.subscribe === 'function'
        && typeof localeService.getSnapshot === 'function'
      React.useSyncExternalStore(
        (listener) => (usable ? localeService.subscribe(listener) : () => {}),
        () => (usable ? localeService.getSnapshot() : null),
        () => (usable ? localeService.getSnapshot() : null),
      )
      return React.useMemo(
        () => (usable ? localeService.bind(NS) : localTranslator()),
        [usable, localeService],
      )
    }

    /** Stable selector: the plain draft text, or '' when the input is not bound. */
    function selectDraft(state) {
      return state && typeof state.draft === 'string' ? state.draft : ''
    }

    /** Fallback input hook for a slot without the standard `useInput` prop. */
    function useNoInput() {
      return ''
    }

    function SkillPicker(props) {
      const { sessionId, inputActions, useInput, getCatalog } = props
      const t = useTranslator(props.localeService)
      const inputHook = typeof useInput === 'function' ? useInput : useNoInput
      const draft = inputHook(selectDraft) || ''

      const [open, setOpen] = React.useState(false)
      const [query, setQuery] = React.useState('')
      const [status, setStatus] = React.useState('idle')
      const [skills, setSkills] = React.useState([])
      const [error, setError] = React.useState('')
      const [geo, setGeo] = React.useState(null)
      const anchorRef = React.useRef(null)
      const panelRef = React.useRef(null)
      const searchRef = React.useRef(null)
      const runRef = React.useRef(0)
      const loadRef = React.useRef(null)

      const load = React.useCallback(() => {
        const run = ++runRef.current
        const settle = (next) => {
          if (runRef.current === run) next()
        }
        setStatus('loading')
        setError('')
        let promise
        try {
          promise = getCatalog(sessionId)
        } catch (failure) {
          settle(() => {
            setStatus('error')
            setError(failure instanceof Error ? failure.message : String(failure))
          })
          return
        }
        Promise.resolve(promise).then(
          (list) => settle(() => {
            setSkills(Array.isArray(list) ? list : [])
            setStatus('ready')
          }),
          (failure) => settle(() => {
            setError(failure instanceof Error ? failure.message : String(failure))
            setStatus('error')
          }),
        )
      }, [getCatalog, sessionId])
      loadRef.current = load

      React.useEffect(() => {
        if (!open) return undefined
        load()
        const compute = () => {
          if (anchorRef.current) setGeo(panelGeometry(anchorRef.current))
        }
        compute()
        const onPointer = (event) => {
          const target = event.target
          if (!(target instanceof Node)) return
          if (panelRef.current && panelRef.current.contains(target)) return
          if (anchorRef.current && anchorRef.current.contains(target)) return
          setOpen(false)
        }
        const onKey = (event) => {
          if (event.key !== 'Escape') return
          event.preventDefault()
          event.stopPropagation()
          setOpen(false)
          const button = anchorRef.current && anchorRef.current.querySelector('button')
          if (button) button.focus()
        }
        window.addEventListener('resize', compute)
        window.addEventListener('scroll', compute, true)
        document.addEventListener('pointerdown', onPointer, true)
        document.addEventListener('keydown', onKey, true)
        return () => {
          runRef.current += 1
          window.removeEventListener('resize', compute)
          window.removeEventListener('scroll', compute, true)
          document.removeEventListener('pointerdown', onPointer, true)
          document.removeEventListener('keydown', onKey, true)
        }
      }, [open, load])

      React.useEffect(() => {
        if (!open) return undefined
        const timer = setTimeout(() => {
          if (searchRef.current) searchRef.current.focus()
        }, 0)
        return () => clearTimeout(timer)
      }, [open])

      /** Type the slash command for one skill at the current caret. */
      const pick = React.useCallback(
        (skill) => {
          setOpen(false)
          const token = '/' + skill.name + ' '
          try {
            const actions = inputActions
            const canInsert =
              actions &&
              typeof actions.captureInsertion === 'function' &&
              typeof actions.insertText === 'function'
            if (canInsert) {
              const span = actions.captureInsertion()
              const start = span && typeof span.start === 'number' ? span.start : 0
              const before = draft.slice(0, start)
              const lead = before === '' || isSpaceTail(before) ? '' : ' '
              if (actions.insertText(lead + token, span)) return
            }
            // The composer refused the edit (read-only phase): only replace an
            // empty draft, never throw away text the user already typed.
            if (draft.trim() === '' && actions && typeof actions.setDraft === 'function') {
              actions.setDraft(token)
            }
          } catch (failure) {
            console.error('[skill-picker] insert failed:', failure)
          }
        },
        [inputActions, draft],
      )

      const { groups, matchedByDescription } = React.useMemo(() => {
        const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
        const found = matchSkills(skills, terms)
        const buckets = new Map()
        for (const skill of found.rows) {
          const group = groupOf(skill)
          if (!buckets.has(group)) buckets.set(group, [])
          buckets.get(group).push(skill)
        }
        const built = sortGroups([...buckets.keys()]).map((group) => ({
          group,
          items: buckets.get(group).sort((a, b) => {
            const byRank = rankOf(a, terms) - rankOf(b, terms)
            if (byRank !== 0) return byRank
            return nameOf(a).localeCompare(nameOf(b), 'zh-Hans-CN')
          }),
        }))
        return { groups: built, matchedByDescription: found.byDescription }
      }, [skills, query])

      const visibleCount = React.useMemo(
        () => groups.reduce((total, bucket) => total + bucket.items.length, 0),
        [groups],
      )

      const panel = open
        ? ReactDOM.createPortal(
            h(
              'div',
              {
                ref: panelRef,
                className: 'skp-panel',
                role: 'dialog',
                'aria-modal': 'false',
                'aria-label': t('panel.title'),
                style: geo
                  ? { left: `${geo.left}px`, bottom: `${geo.bottom}px`, width: `${geo.width}px`, maxHeight: `${geo.maxHeight}px` }
                  : { visibility: 'hidden', left: '12px', bottom: '12px', width: '340px', maxHeight: '360px' },
              },
              h(
                'div',
                { className: 'skp-head' },
                h(
                  'div',
                  { className: 'skp-head-row' },
                  h('span', { className: 'skp-title' }, t('panel.title')),
                  h(
                    'span',
                    { className: 'skp-head-side' },
                    h(
                      'span',
                      { className: 'skp-count' },
                      query.trim() === ''
                        ? t('panel.count', { 0: skills.length })
                        : t('panel.count', { 0: visibleCount }) + ' / ' + skills.length,
                    ),
                    matchedByDescription
                      ? h(
                          'span',
                          { className: 'skp-desc-match', title: t('panel.descMatch', { 0: query.trim() }) },
                          t('panel.descMatchShort'),
                        )
                      : null,
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'skp-refresh',
                        title: t('panel.refreshTitle'),
                        'aria-label': t('panel.refresh'),
                        disabled: status === 'loading',
                        onClick: () => loadRef.current && loadRef.current(),
                      },
                      h(
                        'svg',
                        { viewBox: '0 0 16 16', width: 13, height: 13, fill: 'none', 'aria-hidden': 'true' },
                        h('path', {
                          d: 'M13.5 8a5.5 5.5 0 1 1-1.7-3.97M13.5 2.5V5.5h-3',
                          stroke: 'currentColor',
                          strokeWidth: 1.5,
                          strokeLinecap: 'round',
                          strokeLinejoin: 'round',
                        }),
                      ),
                    ),
                  ),
                ),
                h('input', {
                  ref: searchRef,
                  className: 'skp-search',
                  type: 'text',
                  value: query,
                  autoComplete: 'off',
                  spellCheck: false,
                  placeholder: t('panel.search'),
                  'aria-label': t('panel.search'),
                  onChange: (event) => setQuery(event.currentTarget.value),
                }),
              ),
              h(
                'div',
                { className: 'skp-body' },
                status === 'loading' && skills.length === 0
                  ? h('div', { className: 'skp-state', role: 'status' }, t('panel.loading'))
                  : null,
                status === 'error'
                  ? h(
                      'div',
                      { className: 'skp-state skp-error', role: 'alert' },
                      h('div', null, t('panel.error')),
                      h('div', null, String(error || '')),
                      h(
                        'button',
                        { type: 'button', className: 'skp-retry', onClick: () => loadRef.current && loadRef.current() },
                        t('panel.retry'),
                      ),
                    )
                  : null,
                status !== 'error' && status !== 'loading' && groups.length === 0
                  ? h(
                      'div',
                      { className: 'skp-state' },
                      h('div', null, t('panel.empty')),
                      h('div', null, t('panel.emptyHint')),
                    )
                  : null,
                groups.map((bucket) =>
                  h(
                    'div',
                    { key: bucket.group },
                    h('div', { className: 'skp-group' }, bucket.group),
                    bucket.items.map((skill) =>
                      h(
                        'button',
                        { key: skill.name, type: 'button', className: 'skp-row', onClick: () => pick(skill) },
                        h('span', { className: 'skp-emoji', 'aria-hidden': 'true' }, emojiOf(skill)),
                        h(
                          'span',
                          { className: 'skp-text' },
                          h(
                            'span',
                            { className: 'skp-name' },
                            nameOf(skill),
                            h('small', null, '/' + skill.name),
                            SKILL_INFO[skill.name]
                              ? null
                              : h(
                                  'span',
                                  { className: 'skp-badge', title: t('panel.unknownTitle') },
                                  t('panel.unknown'),
                                ),
                          ),
                          h(
                            'span',
                            { className: 'skp-desc' },
                            manualOnly(skill)
                              ? h('span', { className: 'skp-badge skp-badge-inline' }, t('panel.manualOnly'))
                              : null,
                            descOf(skill),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              h('div', { className: 'skp-note' }, t('panel.hint')),
            ),
            document.body,
          )
        : null

      return h(
        'div',
        { className: 'skp-root', ref: anchorRef },
        h(
          'button',
          {
            type: 'button',
            className: 'skp-button',
            title: t('button.title'),
            'aria-label': t('button.title'),
            'aria-haspopup': 'dialog',
            'aria-expanded': open,
            onClick: () => setOpen((value) => !value),
          },
          h(
            'svg',
            { viewBox: '0 0 16 16', width: 14, height: 14, fill: 'none', 'aria-hidden': 'true' },
            h('path', {
              d: 'M3 4.5h10M3 8h6M3 11.5h4',
              stroke: 'currentColor',
              strokeWidth: 1.6,
              strokeLinecap: 'round',
            }),
          ),
          h('span', null, t('button.label')),
        ),
        panel,
      )
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'skill-picker: dictionaries')
      ctx.effect(() => {
        const style = document.createElement('style')
        style.dataset.plugin = 'skill-picker'
        style.textContent = CSS
        document.head.appendChild(style)
        return () => style.remove()
      }, 'skill-picker: styles')

      const localeService = ctx.get('locale')

      /** Optional service lookup: an absent service answers undefined, never throws. */
      const lookup = (name) => {
        try {
          const found = ctx.get(name, false)
          if (found !== undefined && found !== null) return found
        } catch (_error) {
          /* fall through to the strict form */
        }
        try {
          return ctx.get(name)
        } catch (_error) {
          return undefined
        }
      }

      /** Read the same catalog the '/' menu uses, for one Session. */
      const getCatalog = async (sessionId) => {
        const skills = lookup('remote.skills')
        const sessions = lookup('sessions')
        if (!skills) throw new Error('Skill catalog is unavailable in this window.')
        if (!sessions) throw new Error('Session service is unavailable in this window.')
        if (!sessionId) throw new Error('No Session is selected.')
        return sessions.using(sessionId, { source: 'controllerOperation' }, async (reference) => {
          const snapshot = reference && reference.binding && reference.binding.session
            ? reference.binding.session.getSnapshot()
            : undefined
          if (snapshot && snapshot.openState !== 'open') {
            throw new Error(snapshot.openError ? String(snapshot.openError) : 'The Session is not open yet.')
          }
          const result = await skills.list({ sessionId })
          if (!result || result.ok !== true) {
            const detail = result && result.error ? result.error.message || result.error.code : 'skills/list failed'
            throw new Error(String(detail))
          }
          const value = result.value && result.value.skills
          return Array.isArray(value) ? value : []
        })
      }

      ctx.slots.inject('conversation.input.left', () =>
        ctx.slots.register(
          { name: 'conversation.input.left', id: 'skill-picker', order: 5, locale: NS },
          (props) => h(SkillPicker, { ...props, localeService, getCatalog }),
        ),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply,
    }
  },
})
