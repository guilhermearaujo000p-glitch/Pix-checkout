import { Outlet, createFileRoute } from '@tanstack/react-router'

import { Protected } from '@/components/checkout/app-shell'

export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [{ title: 'Painel administrativo · Checkout PIX' }] }),
  component: AdminLayout,
})

function AdminLayout() {
  return <Protected allow={(s) => s.role === 'admin'}>{() => <Outlet />}</Protected>
}
