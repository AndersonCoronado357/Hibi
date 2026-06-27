// Patrón CRUD reutilizable (estado de servidor con TanStack Query + updates
// optimistas). Cada módulo lo envuelve con sus tipos. Endpoints REST:
//   GET    /api/<name>        · lista del usuario
//   POST   /api/<name>        · crear
//   PATCH  /api/<name>/:id    · actualizar
//   DELETE /api/<name>/:id    · borrar
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

export interface HasId { id: string }

export interface ResourceOptions<T> {
  // Completa la fila optimista con los defaults del módulo (estado, orden…).
  optimistic?: (input: Record<string, any>) => Partial<T>
  // Coloca la fila nueva al principio (por defecto) o al final de la lista.
  prepend?: boolean
}

export function useResource<T extends HasId>(name: string, opts: ResourceOptions<T> = {}) {
  const qc = useQueryClient()
  const key = [name]
  const base = `/api/${name}`
  const rfetch = useRequestFetch() // reenvía cookies en SSR

  const query = useQuery({ queryKey: key, queryFn: () => rfetch<T[]>(base) })
  const items = computed<T[]>(() => query.data.value ?? [])

  const snapshot = () => qc.getQueryData<T[]>(key) ?? []
  const write = (next: T[]) => qc.setQueryData<T[]>(key, next)
  const tmpId = () => `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  const createM = useMutation({
    mutationFn: (input: Record<string, any>) => rfetch<T>(base, { method: 'POST', body: input }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = snapshot()
      const now = new Date().toISOString()
      const row = { id: tmpId(), createdAt: now, updatedAt: now, ...(opts.optimistic?.(input) ?? input) } as unknown as T
      write(opts.prepend === false ? [...prev, row] : [row, ...prev])
      return { prev }
    },
    onError: (_e, _v, ctx: any) => ctx?.prev && write(ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const updateM = useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Record<string, any>) =>
      rfetch<T>(`${base}/${id}`, { method: 'PATCH', body: patch }),
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = snapshot()
      write(prev.map((it) => (it.id === id ? ({ ...it, ...patch } as T) : it)))
      return { prev }
    },
    onError: (_e, _v, ctx: any) => ctx?.prev && write(ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  const removeM = useMutation({
    mutationFn: (id: string) => rfetch(`${base}/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = snapshot()
      write(prev.filter((it) => it.id !== id))
      return { prev }
    },
    onError: (_e, _v, ctx: any) => ctx?.prev && write(ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })

  return {
    items,
    query,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    create: (input: Record<string, any>) => createM.mutateAsync(input),
    update: (id: string, patch: Record<string, any>) => updateM.mutateAsync({ id, ...patch }),
    remove: (id: string) => removeM.mutateAsync(id),
    invalidate: () => qc.invalidateQueries({ queryKey: key }),
    qc,
    key,
  }
}
