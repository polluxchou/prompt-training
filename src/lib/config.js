const KEY = 'luosi-prompt-config-v1'

export const DEFAULT_CONFIG = {
  model: 'deepseek-v4-flash',
  temperature: 0.7,
  max_tokens: 4096,
  systemPrompt:
    '你是一位资深的紧固件行业新媒体与展会营销助理。回答时严格遵循用户提示词中的格式与约束，不要寒暄、不要重复问题、不要使用"作为 AI"等开场白。',
}

const LEGACY_MODEL_MAP = {
  'deepseek-v4': 'deepseek-v4-flash',
  'deepseek-chat': 'deepseek-v4-flash',
  'deepseek-reasoner': 'deepseek-v4-pro',
}

export function loadConfig() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '{}')
    const merged = { ...DEFAULT_CONFIG, ...stored }
    if (LEGACY_MODEL_MAP[merged.model]) {
      merged.model = LEGACY_MODEL_MAP[merged.model]
      saveConfig(merged)
    }
    return merged
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(config) {
  localStorage.setItem(KEY, JSON.stringify(config))
}

export function resetConfig() {
  localStorage.removeItem(KEY)
}
