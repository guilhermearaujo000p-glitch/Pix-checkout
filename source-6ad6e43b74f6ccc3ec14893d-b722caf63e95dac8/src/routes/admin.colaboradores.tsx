import { Link, createFileRoute } from '@tanstack/react-router'
import { BadgeCheck, Lock, Plus, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/checkout/app-shell'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { addCollaborator, setCollaboratorActive, usePreview } from '@/lib/preview-store'

export const Route = createFileRoute('/admin/colaboradores')({
  component: AdminCollaborators,
})

function AdminCollaborators() {
  const collaborators = usePreview((s) => s.collaborators)

  return (
    <>
      <PageHeader
        title="Colaboradores"
        description="Acessos individuais, recebedores vinculados e status de cada gerador."
        actions={<NewCollaboratorDialog />}
      />
      <div className="grid gap-4">
        {collaborators.map((c) => (
          <article key={c.slug} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary">
                  <UserRound className="size-5 text-muted-foreground" aria-hidden />
                </div>
                <div>
                  <p className="font-display text-lg font-semibold">{c.title}</p>
                  <p className="text-sm text-muted-foreground">{c.name}</p>
                </div>
              </div>
              <label className="flex items-center gap-3 text-sm">
                <span className={c.active ? 'text-primary' : 'text-muted-foreground'}>
                  {c.active ? 'Ativo' : 'Desativado'}
                </span>
                <Switch
                  checked={c.active}
                  onCheckedChange={(v) => {
                    setCollaboratorActive(c.slug, v)
                    toast.success(v ? `${c.title} ativado` : `${c.title} desativado`)
                  }}
                  aria-label={`Ativar ou desativar ${c.title}`}
                />
              </label>
            </div>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">Login</dt>
                <dd className="font-mono">{c.login}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Checkout</dt>
                <dd>
                  <Link to="/$slug" params={{ slug: c.slug }} className="font-mono text-primary hover:underline">
                    /{c.slug}
                  </Link>
                </dd>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <dt className="text-xs text-muted-foreground">Recebedor Pagar.me</dt>
                <dd className="flex items-center gap-1.5 font-mono text-xs break-all">
                  {c.recipientId}
                  <BadgeCheck className="size-4 shrink-0 text-muted-foreground" aria-label="Validação pendente" />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Split</dt>
                <dd className="flex items-center gap-1.5">
                  <Lock className="size-3 text-muted-foreground" aria-hidden />
                  {c.splitPercent}% colaborador · {100 - c.splitPercent}% principal
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </>
  )
}

const RESERVED = new Set(['admin', 'pagar', 'api', 'login'])

function NewCollaboratorDialog() {
  const collaborators = usePreview((s) => s.collaborators)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const get = (k: string) => String(f.get(k) ?? '').trim()
    const name = get('name')
    const title = get('title')
    const slug = get('slug').toLowerCase()
    const login = get('login').toLowerCase()
    const password = get('password')
    const recipientId = get('recipientId')

    if (!name || !title) return setError('Preencha nome e título.')
    if (!/^[a-z0-9-]{3,30}$/.test(slug) || RESERVED.has(slug))
      return setError('URL inválida: use letras minúsculas, números e hífen.')
    if (collaborators.some((c) => c.slug === slug || c.login === login))
      return setError('Já existe um colaborador com essa URL ou login.')
    if (!/^[a-z0-9._-]{3,30}$/.test(login)) return setError('Login inválido.')
    if (password.length < 10) return setError('A senha precisa de pelo menos 10 caracteres.')
    if (!/^re_[a-z0-9]{20,}$/.test(recipientId))
      return setError('ID de recebedor inválido (formato re_...).')

    addCollaborator({ name, title, slug, login, recipientId })
    toast.success(`${title} criado`)
    setError('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Novo colaborador
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo colaborador</DialogTitle>
          <DialogDescription>
            Crie o acesso individual e vincule o recebedor da Pagar.me. O split padrão é 99% para o
            colaborador e 1% para o principal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="nc-name">Nome completo</Label>
            <Input id="nc-name" name="name" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="nc-title">Título do checkout</Label>
              <Input id="nc-title" name="title" placeholder="PIX Nome" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nc-slug">URL</Label>
              <Input id="nc-slug" name="slug" placeholder="nome" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="nc-login">Login</Label>
              <Input id="nc-login" name="login" autoComplete="off" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nc-pass">Senha inicial</Label>
              <Input id="nc-pass" name="password" type="password" autoComplete="new-password" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nc-rec">ID do recebedor Pagar.me</Label>
            <Input id="nc-rec" name="recipientId" placeholder="re_..." className="font-mono" />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit">Criar acesso</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
