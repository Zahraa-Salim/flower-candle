import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { CartProvider } from '@/context/CartContext'
import { ToastProvider } from '@/context/ToastContext'
import { ProductsProvider } from '@/context/ProductsContext'
import { SiteContentProvider } from '@/context/SiteContentContext'
import { AuthProvider } from '@/context/AuthContext'
import { AppErrorBoundary } from '@/components/layout/AppErrorBoundary'
import { ToastViewport } from '@/components/ui/ToastViewport'

export default function App() {
  return (
    <AppErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <SiteContentProvider>
            <ProductsProvider>
              <CartProvider>
                <RouterProvider router={router} />
                <ToastViewport />
              </CartProvider>
            </ProductsProvider>
          </SiteContentProvider>
        </AuthProvider>
      </ToastProvider>
    </AppErrorBoundary>
  )
}
