import { Component, type ErrorInfo, type ReactNode } from 'react'
import { siteConfig } from '@/config/site'
import { ErrorPanel } from '@/components/ui/ErrorPanel'
import { ButtonAnchor } from '@/components/ui/Button'

interface State {
  hasError: boolean
  error: unknown
}

/**
 * Last-resort boundary around the providers, the router and the toast viewport.
 * Route errors are handled by the router's own errorElements; this catches
 * everything outside them (React 19 otherwise unmounts the whole tree, leaving
 * a blank page). It is the one class component in the codebase because React
 * still has no hook equivalent of getDerivedStateFromError.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, error: undefined }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    document.title = `حدث خطأ — ${siteConfig.name}`
    console.error('[شغف] uncaught render error', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-ivory px-4" dir="rtl">
        <ErrorPanel
          error={this.state.error}
          homeAction={
            <ButtonAnchor href="/" variant="outline">
              العودة إلى الرئيسية
            </ButtonAnchor>
          }
        />
      </div>
    )
  }
}
