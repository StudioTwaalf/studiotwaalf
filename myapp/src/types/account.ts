// ─── Project ──────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | 'concept'
  | 'in_opbouw'
  | 'offerte_aangevraagd'
  | 'wacht_op_akkoord'
  | 'in_productie'
  | 'afgeleverd'

export interface Project {
  id:          string
  designId:    string
  templateId:  string
  name:        string
  category:    string | null
  status:      ProjectStatus
  thumbnail:   string | null
  updatedAt:   string   // ISO — serialisable across server/client boundary
  gadgetCount: number
}

// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'offerte'
  | 'bevestigd'
  | 'in_productie'
  | 'verzonden'
  | 'geleverd'

export interface Order {
  id:          string
  reference:   string
  projectId:   string | null
  projectName: string
  status:      OrderStatus
  createdAt:   string
  updatedAt:   string
  totalCents:  number | null
  itemCount:   number
}

// ─── AccountUser ──────────────────────────────────────────────────────────────

export interface AccountAddress {
  street:  string | null
  city:    string | null
  zip:     string | null
  country: string | null
}

export interface AccountBilling {
  sameAsShipping: boolean
  vatNumber:      string | null
  companyName:    string | null
}

export interface AccountPreferences {
  newsletter: boolean
  language:   'nl' | 'fr' | 'en'
}

export interface AccountUser {
  id:          string
  name:        string | null
  email:       string
  phone:       string | null
  company:     string | null
  address:     AccountAddress
  billing:     AccountBilling
  preferences: AccountPreferences
  createdAt:   string
}
