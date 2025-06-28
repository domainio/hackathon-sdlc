import { createFileRoute } from '@tanstack/react-router'
import {
  Stack,
  Title,
  Text,
  Card,
  Grid,
  Badge,
  Button,
  Group,
  Paper
} from '@mantine/core'
import { useAuth } from '../../hooks/useAuth'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardComponent,
})

function DashboardComponent() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return (
      <Stack align="center" gap="xl">
        <Title order={1}>Access Denied</Title>
        <Text>Please log in to access your dashboard.</Text>
      </Stack>
    )
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <div>
          <Title order={1}>Welcome, {user.firstName}!</Title>
          <Text size="lg" c="dimmed">
            Your financial management dashboard
          </Text>
        </div>
        <Badge color="green" size="lg">
          {user.language === 'he' ? 'עברית' : 'English'}
        </Badge>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="200">
            <Stack justify="space-between" h="100%">
              <div>
                <Title order={3}>Finance Overview</Title>
                <Text size="sm" c="dimmed">
                  View your aggregated insurance & pension data
                </Text>
              </div>
              <Button variant="light" disabled>
                Coming Soon
              </Button>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="200">
            <Stack justify="space-between" h="100%">
              <div>
                <Title order={3}>Book Consultation</Title>
                <Text size="sm" c="dimmed">
                  Schedule a video call with our consultants
                </Text>
              </div>
              <Button variant="light" disabled>
                Coming Soon
              </Button>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={12}>
          <Paper shadow="xs" p="md" withBorder>
            <Stack gap="xs">
              <Title order={4}>Account Information</Title>
              <Group>
                <Text size="sm"><strong>Name:</strong> {user.firstName} {user.lastName}</Text>
                <Text size="sm"><strong>Phone:</strong> {user.phone}</Text>
                <Text size="sm"><strong>Language:</strong> {user.language}</Text>
              </Group>
              {user.needsOnboarding && (
                <Badge color="orange" variant="light">
                  Onboarding Required
                </Badge>
              )}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  )
} 