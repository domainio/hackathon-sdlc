import { createRootRoute, Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
  AppShell,
  Title,
  Container,
  Group,
  Badge,
  Button,
  Burger,
  Box,
  Stack,
  NavLink
} from '@mantine/core'
import { useDisclosure, useViewportSize } from '@mantine/hooks'
import { IconHome, IconDashboard, IconLogout } from '@tabler/icons-react'
import { AuthLoader } from '../components/AuthLoader'
import type { AuthState } from '../types/auth.types'
import { useAuthContext } from '../contexts/AuthContext'
interface MyRouterContext {
  // The ReturnType of your useAuth hook or the value of your AuthContext
  auth: AuthState
}
// export const Route = createRootRoute({
//   component: () => <RootComponent />,
// })

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => <RootComponent />,
})

function RootComponent() {
  const { isAuthenticated, logout , isLoading} = useAuthContext()
  const [opened, { toggle, close }] = useDisclosure(false)
  const { width } = useViewportSize()
  const isMobile = width < 768

  if (isLoading) return <AuthLoader />

  return (
    <>
      <AppShell
        header={{ height: { base: 60, md: 70 } }}
        navbar={{
          width: 280,
          breakpoint: 'md',
          collapsed: { mobile: !opened, desktop: true }
        }}
        padding={{ base: 'xs', sm: 'md' }}
      >
        <AppShell.Header>
          <Container size="xl" h="100%">
            <Group h="100%" px={{ base: 'xs', sm: 'md' }} justify="space-between">
              {/* Mobile menu burger + brand */}
              <Group>
                {isMobile && isAuthenticated && (
                  <Burger
                    opened={opened}
                    onClick={toggle}
                    size="sm"
                    aria-label="Toggle navigation"
                  />
                )}
                
                <Link to="/" style={{ textDecoration: 'none' }} onClick={close}>
                  <Group gap="xs">
                    <Title 
                      order={2} 
                      c="blue" 
                      size="h2"
                      style={{ fontWeight: 700 }}
                    >
                      IntIsrael
                    </Title>
                    <Badge 
                      color="green" 
                      variant="light" 
                      size="md"
                      style={{ display: isMobile ? 'none' : 'block' }}
                    >
                      Financial Advisor
                    </Badge>
                  </Group>
                </Link>
              </Group>
              
              {/* Desktop navigation */}
              {!isMobile && isAuthenticated && (
                <Group gap="md">
                  <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                    <Button 
                      variant="subtle" 
                      size="sm"
                      leftSection={<IconDashboard size={16} />}
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="subtle" 
                    size="sm" 
                    onClick={() => logout()}
                    leftSection={<IconLogout size={16} />}
                    color="red"
                  >
                    Logout
                  </Button>
                </Group>
              )}
              
              {/* Mobile badge when space allows */}
              {isMobile && !isAuthenticated && (
                <Badge color="green" variant="light" size="xs">
                  Financial
                </Badge>
              )}
            </Group>
          </Container>
        </AppShell.Header>

        {/* Mobile Navigation Drawer */}
        {isMobile && (
          <AppShell.Navbar p="md">
            <Stack gap="xs">
              <Box mb="md">
                <Badge color="green" variant="light" size="md" fullWidth>
                  Financial Advisor Platform
                </Badge>
              </Box>
              
              <NavLink
                href="/"
                label="Home"
                leftSection={<IconHome size={20} />}
                onClick={close}
                component={Link}
                to="/"
              />
              
              {isAuthenticated && (
                <>
                  <NavLink
                    href="/dashboard"
                    label="Dashboard"
                    leftSection={<IconDashboard size={20} />}
                    onClick={close}
                    component={Link}
                    to="/dashboard"
                  />
                  <NavLink
                    label="Logout"
                    leftSection={<IconLogout size={20} />}
                    onClick={() => {
                      logout()
                      close()
                    }}
                    color="red"
                    style={{ cursor: 'pointer' }}
                  />
                </>
              )}
            </Stack>
          </AppShell.Navbar>
        )}

        <AppShell.Main>
          <Container 
            size="xl" 
            py={{ base: 'md', sm: 'lg', md: 'xl' }}
            px={{ base: 'xs', sm: 'md' }}
          >
            <Box
              style={{
                minHeight: 'calc(100vh - 120px)', // Account for header
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Outlet />
            </Box>
          </Container>
        </AppShell.Main>
      </AppShell>
      
      {/* DevTools only in development */}
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  )
}