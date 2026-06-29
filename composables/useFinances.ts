// Finanzas del usuario (persistidas): categorías + gastos + suscripciones.
// Envuelve el patrón CRUD genérico en tres recursos. Los montos son enteros
// COP tal cual (los gastos se guardan en negativo, como los representa la página).
export interface FinanceCategory {
  id: string
  name: string
  icon: string // nombre lucide
  color: string // hex
  position: number
}
export interface Expense {
  id: string
  categoryId: string | null
  title: string
  amount: number // COP entero (negativo para gasto)
  spentDate: string // yyyy-MM-dd
  createdAt: string
}
export interface Subscription {
  id: string
  categoryId: string | null
  title: string
  amount: number // COP/mes entero
  nextCharge: string | null // yyyy-MM-dd | null
  createdAt: string
}

export function useFinances() {
  const categoriesR = useResource<FinanceCategory>('finance-categories', {
    prepend: false,
    optimistic: (i) => ({ icon: 'ShoppingBag', color: '#5aa6d2', position: 0, ...i }),
  })
  const expensesR = useResource<Expense>('expenses', {
    optimistic: (i) => ({ categoryId: null, title: '', amount: 0, spentDate: '', ...i }),
  })
  const subscriptionsR = useResource<Subscription>('subscriptions', {
    optimistic: (i) => ({ categoryId: null, title: '', amount: 0, nextCharge: null, ...i }),
  })

  return {
    categories: categoriesR.items,
    expenses: expensesR.items,
    subscriptions: subscriptionsR.items,
    categoriesLoading: categoriesR.isLoading,
    expensesLoading: expensesR.isLoading,
    subscriptionsLoading: subscriptionsR.isLoading,

    createCategory: (input: { name: string; icon?: string; color?: string }) => categoriesR.create(input),
    updateCategory: (id: string, patch: Partial<Pick<FinanceCategory, 'name' | 'icon' | 'color' | 'position'>>) => categoriesR.update(id, patch),
    removeCategory: (id: string) => categoriesR.remove(id),

    createExpense: (input: { title: string; amount: number; spentDate: string; categoryId?: string | null }) => expensesR.create(input),
    updateExpense: (id: string, patch: Partial<Pick<Expense, 'title' | 'amount' | 'spentDate' | 'categoryId'>>) => expensesR.update(id, patch),
    removeExpense: (id: string) => expensesR.remove(id),

    createSubscription: (input: { title: string; amount: number; nextCharge?: string | null; categoryId?: string | null }) => subscriptionsR.create(input),
    updateSubscription: (id: string, patch: Partial<Pick<Subscription, 'title' | 'amount' | 'nextCharge' | 'categoryId'>>) => subscriptionsR.update(id, patch),
    removeSubscription: (id: string) => subscriptionsR.remove(id),
  }
}
