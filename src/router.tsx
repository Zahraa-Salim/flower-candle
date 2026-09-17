/* eslint-disable react-refresh/only-export-components -- route table, not a component module */
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RequireAuth } from '@/components/admin/RequireAuth'
import HomePage from '@/pages/Home'

const ProductsPage = lazy(() => import('@/pages/Products'))
const ProductDetailsPage = lazy(() => import('@/pages/ProductDetails'))
const AboutPage = lazy(() => import('@/pages/About'))
const CartPage = lazy(() => import('@/pages/Cart'))
const NotFoundPage = lazy(() => import('@/pages/NotFound'))
const AdminLoginPage = lazy(() => import('@/pages/admin/Login'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/Dashboard'))
const AdminProductsPage = lazy(() => import('@/pages/admin/Products'))
const ProductFormPage = lazy(() => import('@/pages/admin/ProductFormPage'))

function PageFallback() {
  return (
    <div className="container-x py-20" aria-busy>
      <div className="shimmer mx-auto h-6 w-40 rounded-md" />
    </div>
  )
}

const withSuspense = (node: ReactNode) => <Suspense fallback={<PageFallback />}>{node}</Suspense>

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/products', element: withSuspense(<ProductsPage />) },
      { path: '/products/:id', element: withSuspense(<ProductDetailsPage />) },
      { path: '/about', element: withSuspense(<AboutPage />) },
      { path: '/cart', element: withSuspense(<CartPage />) },
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
  { path: '/admin/login', element: withSuspense(<AdminLoginPage />) },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: withSuspense(<AdminDashboardPage />) },
          { path: '/admin/products', element: withSuspense(<AdminProductsPage />) },
          { path: '/admin/products/new', element: withSuspense(<ProductFormPage mode="new" />) },
          { path: '/admin/products/:id/edit', element: withSuspense(<ProductFormPage mode="edit" />) },
        ],
      },
    ],
  },
])
