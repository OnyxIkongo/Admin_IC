import { useRouteError } from 'react-router-dom'
import { AppErrorScreen } from '@/components/ui/AppErrorScreen'

export function RouterErrorScreen() {
  const error = useRouteError()
  return <AppErrorScreen title="Impossible d'ouvrir cette page" error={error} />
}
