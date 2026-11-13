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
     * Display metadata: every bundled skill gets a Chinese label, a section
     * and a short explanation of what it is for. Unknown skills fall back to
     * their catalog description so a newly installed skill still appears.
     *
     * Keys are catalog ids, so a DSH release that renames or merges a shipped
     * skill only needs the entries below updated; anything not listed here is
     * still listed from live catalog data.
     * ------------------------------------------------------------------ */
    const SKILL_INFO = {
      'dsh-doc': {
        zh: 'DSH 使用手册',
        group: '平台扩展',
        emoji: '📖',
        desc: '查 DSH 自身的功能、设置、插件、预设、工具与 Cordis API，也用于升级插件或 profile。',
      },
      'hindsight-coding-agent': {
        zh: 'Hindsight 记忆',
        group: '平台扩展',
        emoji: '🧠',
        desc: '读写跨会话的编码记忆，按仓库配置知识库，排查记忆相关问题。',
      },
      'dev-expert': {
        zh: '编程专家',
        group: '开发编程',
        emoji: '👨‍💻',
        desc: '全栈编程助手：接口设计、代码生成与审查、重构、测试、性能与任务拆解。',
      },
      'dev-expert-pro': {
        zh: '编程专家 Pro',
        group: '开发编程',
        emoji: '🚀',
        desc: '在编程专家之上补充鸿蒙 ArkTS/ArkUI、微信小程序与工程专题资料。',
      },
      'dev-god': {
        zh: '编程大神',
        group: '开发编程',
        emoji: '🧙',
        desc: '接手陌生代码库，拆解需求、补齐实现、追根因、重构并推进到可运行可验收。',
      },
      'game-designer': {
        zh: '游戏系统设计师',
        group: '游戏开发',
        emoji: '🎮',
        desc: '设计玩法机制与核心循环、经济系统与数值配平，撰写 GDD 并规划试玩。',
      },
      'godot-game-script-engineer': {
        zh: 'Godot 脚本工程师',
        group: '游戏开发',
        emoji: '🕹️',
        desc: '编写与调试 GDScript/C#，设计场景节点树、信号解耦与资源格式。',
      },
      'multi-search-engine': {
        zh: '多引擎搜索',
        group: '搜索研究',
        emoji: '🔎',
        desc: '跨 16 个搜索引擎检索、去重并交叉验证，输出带来源与可信度的结果。',
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
        desc: '读取、创建、编辑 .xlsx 工作簿、数据与公式。',
      },
      'office-pptx': {
        zh: 'PPT 演示文稿',
        group: '办公文档',
        emoji: '📽️',
        desc: '创建、读取、编辑并校验 .pptx 演示文稿。',
      },
      'office-export-pdf': {
        zh: '导出 PDF',
        group: '办公文档',
        emoji: '📤',
        desc: '用 LibreOffice Kit 把 Office 文档转换成 PDF。',
      },
      'office-recalculate': {
        zh: '表格公式重算',
        group: '办公文档',
        emoji: '🧮',
        desc: '刷新表格公式缓存，并用 LibreOffice Kit 核对计算结果。',
      },
      'office-render': {
        zh: '文档渲染预览',
        group: '办公文档',
        emoji: '🖼️',
        desc: '把文档渲染成图片，检查排版与视觉效果。',
      },
      'diagnose-windows-sandbox-acl': {
        zh: 'Windows 沙箱权限诊断',
        group: '系统环境',
        emoji: '🛡️',
        desc: '排查 Windows 上意外的沙箱拒绝访问，检查并修复相关目录 ACL。',
      },
      /* DSH 0.2.2-rc.1 merged four Creator-mode skills into `dsh-doc`, and
         `office-export-pdf` / `office-recalculate` / `office-render` are now
         tools behind `office` rather than catalog entries. Their entries stay
         so a profile still on an older release keeps readable names; a current
         catalog simply never returns these ids, and they cost one lookup each. */
    }

    const GROUPS = ['开发编程', '游戏开发', '办公文档', '搜索研究', '平台扩展', '系统环境', '其他']
    const GROUP_EMOJI = {
      开发编程: '🛠️',
      游戏开发: '🎮',
      办公文档: '📄',
      搜索研究: '🔎',
      平台扩展: '🧩',
      系统环境: '🛡️',
      其他: '📦',
    }

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

    function groupOf(skill) {
      const known = SKILL_INFO[skill.name]
      return known && GROUPS.includes(known.group) ? known.group : '其他'
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

    /** Everything one row can be found by: display name, id, description, group. */
    function haystackOf(skill) {
      return [
        nameOf(skill),
        skill.name,
        descOf(skill),
        skill.description,
        skill.whenToUse,
        groupOf(skill),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
    }

    /**
     * Every whitespace-separated term must appear somewhere in the row, so
     * "office xlsx" and "表格 公式" both narrow instead of widening.
     */
    function matchesQuery(skill, terms) {
      if (terms.length === 0) return true
      const hay = haystackOf(skill)
      return terms.every((term) => hay.includes(term))
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

      const groups = React.useMemo(() => {
        const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
        const matched = skills.filter((skill) => skill && skill.name && matchesQuery(skill, terms))
        const buckets = new Map()
        for (const skill of matched) {
          const group = groupOf(skill)
          if (!buckets.has(group)) buckets.set(group, [])
          buckets.get(group).push(skill)
        }
        return sortGroups([...buckets.keys()]).map((group) => ({
          group,
          items: buckets.get(group).sort((a, b) => {
            const byRank = rankOf(a, terms) - rankOf(b, terms)
            if (byRank !== 0) return byRank
            return nameOf(a).localeCompare(nameOf(b), 'zh-Hans-CN')
          }),
        }))
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
