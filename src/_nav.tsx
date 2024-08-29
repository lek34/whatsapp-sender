import React, { ElementType } from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilCalculator,
  cilCalendar,
  cilChartPie,
  cilCursor,
  cilDrop,
  cilEnvelopeOpen,
  cilFile,
  cilGrid,
  cilImage,
  cilLayers,
  cilMap,
  cilNotes,
  cilPencil,
  cilPuzzle,
  cilSpeedometer,
  cilSpreadsheet,
  cilStar,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react-pro'
import { Translation } from 'react-i18next'

export type Badge = {
  color: string
  text: string
}

export type NavItem = {
  badge?: Badge
  component: string | ElementType
  href?: string
  icon?: string | JSX.Element
  items?: NavItem[]
  name: string | JSX.Element
  to?: string
}

const _nav: NavItem[] = [
  {
    component:CNavTitle,
    name: <Translation>{(t) => t('Whatsapp')}</Translation>,
  },
  {
    component: CNavItem,
    name: <Translation>{(t) => t('Send Message')}</Translation>,
    to: '/whatsapp/message',
    icon: <CIcon icon={cilEnvelopeOpen} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: <Translation>{(t) => t('Send File')}</Translation>,
    to: '/whatsapp/file',
    icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: <Translation>{(t) => t('Send Image')}</Translation>,
    to: '/whatsapp/image',
    icon: <CIcon icon={cilImage} customClassName="nav-icon" />,
  }
]

export default _nav
