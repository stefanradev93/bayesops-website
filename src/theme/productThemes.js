// Scoped palette variables let product pages carry their own identity while
// keeping shared MUI components, theme switching, and interaction styles.
// Blue surfaces echo BayesFlow's diagnostic palette. The light accent is the
// default diagnostics plot blue; the dark accent is viridis yellow, with
// green reserved for secondary data.
const bayesflowLight = {
  '--mui-palette-primary-main': '#132A70',
  '--mui-palette-primary-light': '#3A4F91',
  '--mui-palette-primary-dark': '#0C1C4F',
  '--mui-palette-primary-contrastText': '#FFFFFF',
  '--mui-palette-primary-mainChannel': '19 42 112',
  '--mui-palette-secondary-main': '#6B631A',
  '--mui-palette-secondary-light': '#91852E',
  '--mui-palette-secondary-dark': '#514B12',
  '--mui-palette-secondary-contrastText': '#FFFFFF',
  '--mui-palette-secondary-mainChannel': '107 99 26',
  '--mui-palette-background-default': '#EEF3FA',
  '--mui-palette-background-paper': '#F7FAFF',
  '--mui-palette-surface-canvas': '#EEF3FA',
  '--mui-palette-surface-raised': '#E0E8F5',
  '--mui-palette-text-primary': '#203250',
  '--mui-palette-text-secondary': '#50647D',
  '--mui-palette-divider': 'rgba(59, 82, 139, 0.20)',
  '--product-heading-gradient': 'linear-gradient(105deg, #132A70 0%, #2D4A8C 60%, #1F7A86 100%)',
}

const bayesflowDark = {
  '--mui-palette-primary-main': '#FDE725',
  '--mui-palette-primary-light': '#FFF178',
  '--mui-palette-primary-dark': '#CDBB21',
  '--mui-palette-primary-contrastText': '#293118',
  '--mui-palette-primary-mainChannel': '253 231 37',
  '--mui-palette-secondary-main': '#5DC963',
  '--mui-palette-secondary-light': '#80D683',
  '--mui-palette-secondary-dark': '#3AA95F',
  '--mui-palette-secondary-contrastText': '#122C35',
  '--mui-palette-secondary-mainChannel': '93 201 99',
  '--mui-palette-background-default': '#14213B',
  '--mui-palette-background-paper': '#1A2B47',
  '--mui-palette-surface-canvas': '#14213B',
  '--mui-palette-surface-raised': '#1E3152',
  '--mui-palette-text-primary': '#EDF5FA',
  '--mui-palette-text-secondary': '#B7C9E2',
  '--mui-palette-divider': 'rgba(192, 213, 239, 0.22)',
  '--product-heading-gradient': 'linear-gradient(105deg, #B5DE2B 0%, #E4E419 50%, #FDE725 100%)',
}

const superstatsLight = {
  '--mui-palette-primary-main': '#366673', // Original wordmark ink.
  '--mui-palette-primary-light': '#5C8994',
  '--mui-palette-primary-dark': '#264E59',
  '--mui-palette-primary-contrastText': '#FFFFFF',
  '--mui-palette-primary-mainChannel': '54 102 115',
  '--mui-palette-secondary-main': '#2F7367',
  '--mui-palette-secondary-light': '#60998D',
  '--mui-palette-secondary-dark': '#21574E',
  '--mui-palette-secondary-contrastText': '#FFFFFF',
  '--mui-palette-secondary-mainChannel': '47 115 103',
  '--mui-palette-background-default': '#F6F7F3',
  '--mui-palette-background-paper': '#FBFCF9',
  '--mui-palette-surface-canvas': '#F6F7F3',
  '--mui-palette-surface-raised': '#E7EEEA',
  '--mui-palette-text-primary': '#223536',
  '--mui-palette-text-secondary': '#54696A',
  '--mui-palette-divider': 'rgba(54, 102, 115, 0.18)',
}

const superstatsDark = {
  '--mui-palette-primary-main': '#8CCAC8',
  '--mui-palette-primary-light': '#B3DEDA',
  '--mui-palette-primary-dark': '#69ABA9',
  '--mui-palette-primary-contrastText': '#112C31',
  '--mui-palette-primary-mainChannel': '140 202 200',
  '--mui-palette-secondary-main': '#A7D3B5',
  '--mui-palette-secondary-light': '#C8E6D1',
  '--mui-palette-secondary-dark': '#7FB995',
  '--mui-palette-secondary-contrastText': '#152E22',
  '--mui-palette-secondary-mainChannel': '167 211 181',
  '--mui-palette-background-default': '#142024',
  '--mui-palette-background-paper': '#192A2E',
  '--mui-palette-surface-canvas': '#142024',
  '--mui-palette-surface-raised': '#203439',
  '--mui-palette-text-primary': '#EDF4EE',
  '--mui-palette-text-secondary': '#ABC1C0',
  '--mui-palette-divider': 'rgba(140, 202, 200, 0.20)',
}

// Bayesify's aubergine mark, with plum accents and softly tinted surfaces.
const bayesifyLight = {
  '--mui-palette-primary-main': '#30104E',
  '--mui-palette-primary-light': '#6B447D',
  '--mui-palette-primary-dark': '#220B38',
  '--mui-palette-primary-contrastText': '#FFFFFF',
  '--mui-palette-primary-mainChannel': '48 16 78',
  '--mui-palette-secondary-main': '#874D73',
  '--mui-palette-secondary-light': '#AD7899',
  '--mui-palette-secondary-dark': '#653653',
  '--mui-palette-secondary-contrastText': '#FFFFFF',
  '--mui-palette-secondary-mainChannel': '135 77 115',
  '--mui-palette-background-default': '#F9F5F8',
  '--mui-palette-background-paper': '#FDFBFD',
  '--mui-palette-surface-canvas': '#F9F5F8',
  '--mui-palette-surface-raised': '#EEE5ED',
  '--mui-palette-text-primary': '#302337',
  '--mui-palette-text-secondary': '#6F5D78',
  '--mui-palette-divider': 'rgba(48, 16, 78, 0.16)',
}

const bayesifyDark = {
  '--mui-palette-primary-main': '#D4B0EC',
  '--mui-palette-primary-light': '#E8D4F3',
  '--mui-palette-primary-dark': '#AE86CB',
  '--mui-palette-primary-contrastText': '#281234',
  '--mui-palette-primary-mainChannel': '212 176 236',
  '--mui-palette-secondary-main': '#E5B3CD',
  '--mui-palette-secondary-light': '#F2D2E1',
  '--mui-palette-secondary-dark': '#C78EAC',
  '--mui-palette-secondary-contrastText': '#341B2A',
  '--mui-palette-secondary-mainChannel': '229 179 205',
  '--mui-palette-background-default': '#211529',
  '--mui-palette-background-paper': '#2A1D33',
  '--mui-palette-surface-canvas': '#211529',
  '--mui-palette-surface-raised': '#35223E',
  '--mui-palette-text-primary': '#F7EEF8',
  '--mui-palette-text-secondary': '#C4B1CA',
  '--mui-palette-divider': 'rgba(212, 176, 236, 0.20)',
}

// CogFormer's faceted mark spans cyan, blue, and violet. Darker shades keep
// the same spectrum readable on light surfaces.
const cogformerLight = {
  '--mui-palette-primary-main': '#365AC2',
  '--mui-palette-primary-light': '#6C87DA',
  '--mui-palette-primary-dark': '#274397',
  '--mui-palette-primary-contrastText': '#FFFFFF',
  '--mui-palette-primary-mainChannel': '54 90 194',
  '--mui-palette-secondary-main': '#137784',
  '--mui-palette-secondary-light': '#4D9CA5',
  '--mui-palette-secondary-dark': '#0D5862',
  '--mui-palette-secondary-contrastText': '#FFFFFF',
  '--mui-palette-secondary-mainChannel': '19 119 132',
  '--mui-palette-background-default': '#F3F7FC',
  '--mui-palette-background-paper': '#FAFCFF',
  '--mui-palette-surface-canvas': '#F3F7FC',
  '--mui-palette-surface-raised': '#E5EDF8',
  '--mui-palette-text-primary': '#202E4A',
  '--mui-palette-text-secondary': '#52617D',
  '--mui-palette-divider': 'rgba(54, 90, 194, 0.18)',
  '--product-heading-gradient': 'linear-gradient(105deg, #137784 0%, #365AC2 45%, #7040B5 95%)',
}

const cogformerDark = {
  '--mui-palette-primary-main': '#9EB8FF',
  '--mui-palette-primary-light': '#C6D5FF',
  '--mui-palette-primary-dark': '#7796E0',
  '--mui-palette-primary-contrastText': '#152443',
  '--mui-palette-primary-mainChannel': '158 184 255',
  '--mui-palette-secondary-main': '#70D1D5',
  '--mui-palette-secondary-light': '#AAE5E6',
  '--mui-palette-secondary-dark': '#4AA7AD',
  '--mui-palette-secondary-contrastText': '#102D34',
  '--mui-palette-secondary-mainChannel': '112 209 213',
  '--mui-palette-background-default': '#141D31',
  '--mui-palette-background-paper': '#19263D',
  '--mui-palette-surface-canvas': '#141D31',
  '--mui-palette-surface-raised': '#202F4A',
  '--mui-palette-text-primary': '#EDF3FF',
  '--mui-palette-text-secondary': '#ADBDD8',
  '--mui-palette-divider': 'rgba(158, 184, 255, 0.20)',
  '--product-heading-gradient': 'linear-gradient(105deg, #70D1D5 0%, #A7B7FF 45%, #C6A6FF 95%)',
}

export const productThemeSx = {
  bayesflow: {
    ...bayesflowLight,
    bgcolor: 'background.default',
    color: 'text.primary',
    '.dark &': bayesflowDark,
  },
  superstats: {
    ...superstatsLight,
    bgcolor: 'background.default',
    color: 'text.primary',
    '.dark &': superstatsDark,
  },
  bayesify: {
    ...bayesifyLight,
    bgcolor: 'background.default',
    color: 'text.primary',
    '.dark &': bayesifyDark,
  },
  cogformer: {
    ...cogformerLight,
    bgcolor: 'background.default',
    color: 'text.primary',
    '.dark &': cogformerDark,
  },
}
