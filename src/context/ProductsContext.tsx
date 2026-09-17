import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Product, ProductInput } from '@/types/product'
import { productRepository } from '@/services/products'
import { ProductsContext, type LoadStatus, type ProductsContextValue } from '@/hooks/useProducts'

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const list = await productRepository.list()
      setProducts(list)
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل المنتجات')
      setStatus('error')
    }
  }, [])

  // Initial load: state only changes inside promise callbacks, never synchronously.
  useEffect(() => {
    let active = true
    productRepository
      .list()
      .then((list) => {
        if (!active) return
        setProducts(list)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'تعذّر تحميل المنتجات')
        setStatus('error')
      })
    return () => {
      active = false
    }
  }, [])

  const createProduct = useCallback(async (input: ProductInput) => {
    const created = await productRepository.create(input)
    // Setting a category cover clears the previous cover, so refresh the whole list from the store.
    if (created.isCategoryCover) setProducts(await productRepository.list())
    else setProducts((list) => [created, ...list])
    return created
  }, [])

  const updateProduct = useCallback(async (id: string, input: Partial<ProductInput>) => {
    const updated = await productRepository.update(id, input)
    if (updated.isCategoryCover) setProducts(await productRepository.list())
    else setProducts((list) => list.map((p) => (p.id === id ? updated : p)))
    return updated
  }, [])

  const deleteProduct = useCallback(async (id: string) => {
    await productRepository.remove(id)
    setProducts((list) => list.filter((p) => p.id !== id))
  }, [])

  const replaceAll = useCallback(
    async (next: Product[]) => {
      await productRepository.replaceAll(next)
      await reload()
    },
    [reload],
  )

  const value = useMemo<ProductsContextValue>(
    () => ({
      products,
      status,
      error,
      reload,
      getById: (id) => products.find((p) => p.id === id),
      createProduct,
      updateProduct,
      deleteProduct,
      replaceAll,
    }),
    [products, status, error, reload, createProduct, updateProduct, deleteProduct, replaceAll],
  )

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
}
