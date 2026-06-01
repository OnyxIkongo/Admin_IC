import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AppErrorScreen } from '@/components/ui/AppErrorScreen'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return <AppErrorScreen error={this.state.error} />
    }
    return this.props.children
  }
}
