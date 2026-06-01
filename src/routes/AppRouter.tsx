import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { RouterErrorScreen } from '@/components/ui/RouterErrorScreen'
import { RequireAdmin } from './RequireAdmin'

import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminEventsPage } from '@/pages/admin/AdminEventsPage'
import { AdminSpacesPage } from '@/pages/admin/AdminSpacesPage'
import { AdminReservationsPage } from '@/pages/admin/AdminReservationsPage'

/** HashRouter : /#/login fonctionne sur Render sans règle Rewrite (fichiers statiques). */
const router = createHashRouter([
  {
    id: 'root',
    errorElement: <RouterErrorScreen />,
    children: [
      { path: '/login', element: <AdminLoginPage /> },
      {
        element: <RequireAdmin />,
        children: [
          {
            path: '/',
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="/dashboard" replace /> },
              { path: 'dashboard', element: <AdminDashboardPage /> },
              { path: 'reservations', element: <AdminReservationsPage /> },
              { path: 'events', element: <AdminEventsPage /> },
              { path: 'spaces', element: <AdminSpacesPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
