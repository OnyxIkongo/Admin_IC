import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { RequireAdmin } from './RequireAdmin'

import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminEventsPage } from '@/pages/admin/AdminEventsPage'
import { AdminProgramsPage } from '@/pages/admin/AdminProgramsPage'
import { AdminSpacesPage } from '@/pages/admin/AdminSpacesPage'
import { AdminParticipantsPage } from '@/pages/admin/AdminParticipantsPage'
import { AdminReservationsPage } from '@/pages/admin/AdminReservationsPage'

/** HashRouter : /#/login fonctionne sur Render sans règle Rewrite (fichiers statiques). */
const router = createHashRouter([
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
          { path: 'programs', element: <AdminProgramsPage /> },
          { path: 'spaces', element: <AdminSpacesPage /> },
          { path: 'participants', element: <AdminParticipantsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
