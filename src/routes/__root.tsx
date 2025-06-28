import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import {
  AppShell,
  Title,
  Container,
  Group,
  Badge,
  Button
} from '@mantine/core'
import { useAuth } from '../hooks/useAuth'

export const Route = createRootRoute({
  component: () => <RootComponent />,
})

function RootComponent() {
  const { isAuthenticated, logout } = useAuth()

  return (
    <>
      <AppShell header={{ height: 60 }}>
        <AppShell.Header>
          <Container>
            <Group h="100%" px="md" justify="space-between">
              <Group>
                <Link to="/" style={{ textDecoration: 'none' }}>
                  <Title order={2} c="blue">IntIsrael</Title>
                </Link>
                <Badge color="green" variant="light">Financial Advisor</Badge>
              </Group>
              
              {isAuthenticated && (
                <Group>
                  <Link to="/dashboard">
                    <Button variant="subtle" size="sm">Dashboard</Button>
                  </Link>
                  <Button variant="subtle" size="sm" onClick={() => logout()}>
                    Logout
                  </Button>
                </Group>
              )}
            </Group>
          </Container>
        </AppShell.Header>

        <AppShell.Main>
          <Container size="md" py="xl">
            <Outlet />
          </Container>
        </AppShell.Main>
      </AppShell>
      
      {/* DevTools only in development */}
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  )
} 