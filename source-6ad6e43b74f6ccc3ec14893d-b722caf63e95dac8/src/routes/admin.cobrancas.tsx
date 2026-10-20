import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '@/components/checkout/app-shell'
import { ChargesTable } from '@/components/checkout/charges-table'
import { usePreview } from '@/lib/preview-store'

export const Route = createFileRoute('/admin/cobrancas')({
  component: AdminCharges,
})

function AdminCharges() {
  const charges = usePreview((s) => s.charges)
  const collaborators = usePreview((s) => s.collaborators)
  return (
    <>
      <PageHeader
        title="Cobranças"
        description="Histórico completo de todos os geradores, com filtros por colaborador, data e status."
      />
      <ChargesTable charges={charges} collaborators={collaborators} showCollaboratorFilter />
    </>
  )
}
