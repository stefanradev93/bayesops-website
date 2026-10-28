import { SvgIcon } from '@mui/material'
import EmailOutlined from '@mui/icons-material/EmailOutlined'
import GitHub from '@mui/icons-material/GitHub'

export function GoogleScholarIcon(props) {
  return (
    <SvgIcon viewBox="0 0 24 24" {...props}>
      <path d="M5.242 13.769 0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5s-5.548 1.749-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" />
    </SvgIcon>
  )
}

export function BlueskyIcon(props) {
  return (
    <SvgIcon viewBox="0 0 24 24" {...props}>
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364q.204-.03.415-.056-.207.033-.415.056c-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a9 9 0 0 1-.415-.056q.21.026.415.056c2.67.297 5.568-.628 6.383-3.364C23.622 9.418 24 4.458 24 3.768c0-.69-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C16.046 4.747 13.087 8.686 12 10.8" />
    </SvgIcon>
  )
}

const icons = {
  email: EmailOutlined,
  github: GitHub,
  'google-scholar': GoogleScholarIcon,
  bluesky: BlueskyIcon,
}

export const socialIcon = (type) => icons[type] || EmailOutlined
