import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'

import { PageHeader, Protected } from '@/components/checkout/app-shell'
import { ChargesTable } from '@/components/checkout/charges-table'
import { PixGenerator } from '@/components/checkout/pix-generator'
import { NotFoundPage } from '@/components/error-pages'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePreview } from '@/lib/preview-store'

export const Route = createFileRoute('/$slug')({
  component: CollaboratorCheckout,
})

function CollaboratorCheckout() {
  const { slug } = Route.useParams()
  const collaborators = usePreview((s) => s.collaborators)
  const charges = usePreview((s) => s.charges)
  const collaborator = collaborators.find((c) => c.slug === slug)
  const own = useMemo(() => charges.filter((c) => c.collaboratorSlug === slug), [charges, slug])

  if (!collaborator) return <NotFoundPage />

  return (
    <Protected
      allow={(s) => s.role === 'admin' || (s.role === 'collaborator' && s.slug === slug)}
    >
      {(session) => (
        <>
          <PageHeader
            title={collaborator.title}
            description={
              session.role === 'admin'
                ? `Gerando em nome de ${collaborator.name} — o split deste colaborador é aplicado automaticamente.`
                : 'Gere cobranças PIX e envie o link de pagamento ao seu cliente.'
            }
          />
          <Tabs defaultValue="gerar">
            <TabsList className="mb-6">
              <TabsTrigger value="gerar">Gerar PIX</TabsTrigger>
              <TabsTrigger value="historico">
                {session.role === 'admin' ? 'Cobranças deste gerador' : 'Minhas cobranças'}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="gerar">
              <PixGenerator collaborator={collaborator} />
            </TabsContent>
            <TabsContent value="historico">
              <ChargesTable
                charges={own}
                collaborators={collaborators}
                showCollaboratorFilter={false}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </Protected>
  )
}
