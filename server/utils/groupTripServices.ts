// Group trip services configuration
// These are static and don't change, so they're hardcoded

export interface GroupTripServiceConfig {
  id: string
  type: 'SHORT' | 'MEDIUM' | 'FISHING'
  duration: number // in minutes
  price: number // in RUB
  title: string
  description: string
  image?: string
  isActive: boolean
}

export const GROUP_TRIP_SERVICES: GroupTripServiceConfig[] = [
  {
    id: 'service-short',
    type: 'SHORT',
    duration: 45,
    price: 2200,
    title: 'Прогулка 45 минут',
    description: 'Небольшая обзорная прогулка по морю. Идеально для первого знакомства с морскими просторами. Насладитесь свежим морским воздухом и живописными видами побережья Сочи.',
    isActive: true
  },
  {
    id: 'service-medium',
    type: 'MEDIUM',
    duration: 90,
    price: 2500,
    title: 'Прогулка 1.5 часа',
    description: 'Прогулка под парусами на 1.5 часа. Насладитесь ветром, тишиной и красотой Черного моря. Идеально для романтических моментов и спокойного отдыха.',
    isActive: true
  },
  {
    id: 'service-fishing',
    type: 'FISHING',
    duration: 180,
    price: 3000,
    title: 'Рыбалка 3 часа',
    description: 'Рыбалка в Черном море на 3 часа. Профессиональное снаряжение и опытный капитан обеспечат отличный улов. Все необходимое оборудование предоставляется.',
    isActive: true
  }
]

// Get active services
export function getActiveGroupTripServices(): GroupTripServiceConfig[] {
  return GROUP_TRIP_SERVICES.filter(service => service.isActive)
}

// Get service by type
export function getGroupTripServiceByType(type: 'SHORT' | 'MEDIUM' | 'FISHING'): GroupTripServiceConfig | null {
  return GROUP_TRIP_SERVICES.find(service => service.type === type && service.isActive) || null
}
