'use client'

import dynamic from 'next/dynamic'
import { FullPageLoader } from '@/components/box-loader'

const AffiliatePortal = dynamic(() => import('@/components/affiliate/AffiliatePortal'), {
  ssr: false,
  loading: () => <FullPageLoader />,
})

export default function PromotorPage() {
  return <AffiliatePortal />
}
