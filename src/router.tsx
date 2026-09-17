/* eslint-disable react-refresh/only-export-components -- route table, not a component module */
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RequireAuth } from '@/components/admin/RequireAuth'
import HomePage from '@/pages/Home'
// Static import: the error page must already be in the entry chunk when a lazy chunk fails.
import RouteErrorPage from '@/pages/RouteError'

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

/** DEV-only: lets browser checks exercise the error page. Tree-shaken from production by the literal below. */
function DevThrow(): never {
  throw new Error('dev: intentional render error (/__dev/throw)')
}
const devRoutes = import.meta.env.DEV ? [{ path: '/__dev/throw', element: <DevThrow /> }] : []

const adminHome = { homeTo: '/admin', homeLabel: 'العودة إلى لوحة التحكم' }

/*
 * Error handling is two-tiered per shell: the layout route's errorElement is a
 * standalone screen (used only if the layout itself crashed), and a pathless
 * child group carries the in-shell error page so a page crash keeps the
 * header/footer or the admin navigation.
 */
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorPage shell="screen" />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/products', element: withSuspense(<ProductsPage />) },
          { path: '/products/:id', element: withSuspense(<ProductDetailsPage />) },
          { path: '/about', element: withSuspense(<AboutPage />) },
          { path: '/cart', element: withSuspense(<CartPage />) },
          ...devRoutes,
          { path: '*', element: withSuspense(<NotFoundPage />) },
        ],
      },
    ],
  },
  {
    path: '/admin/login',
    element: withSuspense(<AdminLoginPage />),
    errorElement: <RouteErrorPage shell="screen" homeTo="/admin/login" homeLabel="العودة إلى تسجيل الدخول" />,
  },
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage shell="screen" {...adminHome} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            errorElement: <RouteErrorPage {...adminHome} />,
            children: [
              { path: '/admin', element: withSuspense(<AdminDashboardPage />) },
              { path: '/admin/products', element: withSuspense(<AdminProductsPage />) },
              { path: '/admin/products/new', element: withSuspense(<ProductFormPage mode="new" />) },
              { path: '/admin/products/:id/edit', element: withSuspense(<ProductFormPage mode="edit" />) },
            ],
          },
        ],
      },
    ],
  },
])
