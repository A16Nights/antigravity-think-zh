export const THINK_ZH_ONBOARDING_GUIDE = {
  version: "1",
  icon: "💭",
  title: "欢迎使用思语中文——外接模型中文思考切换",
  subtitle: "1 分钟了解外接推理模型中文/英文思考切换与防漂移机制（随时点顶栏「? 指南」重看）",
  steps: [
    {
      icon: "🌐",
      navTitle: "中英思考切换",
      title: "一键切换外接推理模型的思考语言",
      desc: "让 DeepSeek、Claude、GPT 等外接自定义推理模型的思考过程稳定输出简体中文，或随时切回默认英文。",
      spotlight: {
        selector: "#btnLangZh",
        buttonText: "定位语言切换",
        hint: "点击「简体中文」或「English」立即热切换，无需重启客户端"
      },
      items: [
        {
          icon: "🎯",
          title: "精准只作用于外接自定义模型",
          text: "自动识别并跳过 Antigravity 原生 Gemini 模型（原生模型内部思考由官方服务端决定），不产生多余提示词噪音。"
        },
        {
          icon: "⚡",
          title: "零重启即时生效",
          text: "切换后下一轮对话立刻按新语言思考，顶部状态徽标会实时反馈当前档位。"
        }
      ],
      tip: "如果你正在使用原生 Gemini 模型并看到英文思考，属于官方底层设定，并非插件失效。"
    },
    {
      icon: "🛡️",
      navTitle: "双通道防漂移",
      title: "每轮提示 + 开场注入，长对话不回退英文",
      desc: "很多外接模型聊久了思考语言会慢慢漂回英文，开启双通道守卫能稳稳锁住中文推理。",
      spotlight: {
        selector: "#chkPerTurn",
        buttonText: "定位每轮守卫",
        hint: "推荐保持「每轮提示（默认）」与「开场注入」开启；可按需选择每轮用户消息或每次模型调用生效"
      },
      items: [
        {
          icon: "🔁",
          title: "每轮 PreInvocation 动态提示",
          text: "在每轮外接模型调用前轻量附加语言指令，比静态规则更抗长上下文遗忘。"
        },
        {
          icon: "📌",
          title: "可选静态规则兜底",
          text: "极少数不支持钩子的兼容场景，也可以按需勾选静态规则兜底选项。"
        }
      ],
      tip: "保持默认推荐组合即可兼顾最低 Token 消耗与最高中文锁定率。"
    },
    {
      icon: "✏️",
      navTitle: "自定义与预览",
      title: "自定义思考指令，实时预览最终注入文案",
      desc: "想给思考过程加上额外要求（例如先列结论再展开、用简洁术语）？直接自定义并实时预览。",
      spotlight: {
        selector: "#customTextInput",
        buttonText: "定位自定义区",
        hint: "填好自定义指令点保存即可生效，下方预览框会实时展示实际注入字符数与原文"
      },
      items: [
        {
          icon: "👁️",
          title: "真实注入内容透明可见",
          text: "切换上方「每轮提示 / 开场注入 / 静态兜底」预览页签，逐字核对实际下发给模型的文本。"
        },
        {
          icon: "↩️",
          title: "随时一键恢复默认",
          text: "调乱了点底部的重置按钮即可立刻还原回出厂推荐配置。"
        }
      ],
      tip: "随时可点顶栏「? 指南」重看本教程；支持键盘 ← / → 翻页与 Esc 关闭。"
    }
  ]
};
