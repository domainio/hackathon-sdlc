import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Stack,
  Title,
  Text,
  Card,
  Button
} from '@mantine/core'
import { useAuth } from '../hooks/useAuth'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    // Redirect authenticated users to dashboard
    return (
      <Stack align="center" gap="xl">
        <Title order={1} ta="center">Welcome Back!</Title>
        <Text size="lg" ta="center" c="dimmed">
          You're already logged in. Continue to your dashboard.
        </Text>
        <Link to="/dashboard">
          <Button size="lg">Go to Dashboard</Button>
        </Link>
      </Stack>
    )
  }

  return (
    <Stack align="center" gap="xl">
      <Title order={1} ta="center">Welcome to IntIsrael</Title>
      <Text size="lg" ta="center" c="dimmed">
        Your comprehensive financial management platform
      </Text>
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ maxWidth: '400px' }}>
        <Stack gap="md">
          <Text>
            Get started by viewing your aggregated insurance & pension data, 
            and book video consultations with our expert consultants.
          </Text>
          <Link to="/login">
            <Button size="lg" fullWidth>
              Get Started
            </Button>
          </Link>
        </Stack>
      </Card>
    </Stack>
  )
} 