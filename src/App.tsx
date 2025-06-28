import { useState } from 'react'
import { 
  AppShell, 
  Title, 
  Container, 
  Stack, 
  Card, 
  Text, 
  Button, 
  Group,
  Badge
} from '@mantine/core'
import './App.css'

function App() {
  const [activeView, setActiveView] = useState<'welcome' | 'login' | 'dashboard'>('welcome')

  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Header>
        <Container>
          <Group h="100%" px="md">
            <Title order={2} c="blue">IntIsrael</Title>
            <Badge color="green" variant="light">Financial Advisor</Badge>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="md" py="xl">
          {activeView === 'welcome' && <WelcomeView onNext={() => setActiveView('login')} />}
          {activeView === 'login' && <LoginView onNext={() => setActiveView('dashboard')} />}
          {activeView === 'dashboard' && <DashboardView />}
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

function WelcomeView({ onNext }: { onNext: () => void }) {
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
          <Button onClick={onNext} size="lg" fullWidth>
            Get Started
          </Button>
        </Stack>
      </Card>
    </Stack>
  )
}

function LoginView({ onNext }: { onNext: () => void }) {
  return (
    <Stack align="center" gap="xl">
      <Title order={2}>Login to Your Account</Title>
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ maxWidth: '400px' }}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            This is where the OTP authentication flow will be implemented
          </Text>
          <Button onClick={onNext} size="lg" fullWidth>
            Continue to Dashboard (Demo)
          </Button>
        </Stack>
      </Card>
    </Stack>
  )
}

function DashboardView() {
  return (
    <Stack gap="xl">
      <Title order={2}>Dashboard</Title>
      
      <Group grow>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="xs">
            <Text fw={500}>Finance Data</Text>
            <Text size="sm" c="dimmed">
              View your insurance & pension information
            </Text>
            <Button variant="light" size="sm">View Details</Button>
          </Stack>
        </Card>
        
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="xs">
            <Text fw={500}>Book Appointment</Text>
            <Text size="sm" c="dimmed">
              Schedule a consultation with our experts
            </Text>
            <Button variant="light" size="sm">Book Now</Button>
          </Stack>
        </Card>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Text fw={500}>Recent Activity</Text>
          <Text size="sm" c="dimmed">
            No recent activity to display
          </Text>
        </Stack>
      </Card>
    </Stack>
  )
}

export default App
