import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Stack,
  Title,
  Text,
  Card,
  Button,
  Container,
  Group,
  SimpleGrid,
  ThemeIcon,
  Box
} from '@mantine/core'
import { 
  IconShield, 
  IconVideo, 
  IconChartBar, 
  IconArrowRight 
} from '@tabler/icons-react'
import { useAuthContext } from '../contexts/AuthContext'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const { isAuthenticated } = useAuthContext()

  if (isAuthenticated) {
    // Redirect authenticated users to dashboard
    return (
      <Stack align="center" gap="lg" py="md">
        <Title 
          order={1} 
          ta="center"
          size="h2"
          style={{ maxWidth: '600px' }}
        >
          Welcome Back!
        </Title>
        <Text 
          size="md" 
          ta="center" 
          c="dimmed"
          style={{ maxWidth: '500px' }}
        >
          Continue to your dashboard to manage your finances.
        </Text>
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <Button 
            size="lg"
            rightSection={<IconArrowRight size={20} />}
          >
            Go to Dashboard
          </Button>
        </Link>
      </Stack>
    )
  }

  return (
    <Container size="lg" px={0}>
      <Stack gap="xl" py="md">
        {/* Hero Section */}
        <Stack align="center" gap="md" ta="center">
          <Title 
            order={1}
            size="2rem"
            fw={900}
            style={{ 
              maxWidth: '800px',
              lineHeight: 1.2,
              background: 'linear-gradient(45deg, #646cff, #535bf2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Welcome to IntIsrael
          </Title>
          
          <Text 
            size="lg" 
            c="dimmed"
            style={{ maxWidth: '600px', lineHeight: 1.6 }}
          >
            Your comprehensive financial management platform for insurance and pension optimization in Israel
          </Text>
        </Stack>

        {/* Features Grid */}
        <SimpleGrid 
          cols={1} 
          spacing="md"
          mt="lg"
        >
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Stack gap="md" h="100%">
              <ThemeIcon size={50} radius="md" variant="light" color="blue">
                <IconShield size={28} />
              </ThemeIcon>
              <div>
                <Title order={4} mb="xs">Insurance Management</Title>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.5 }}>
                  View and manage all your insurance policies in one centralized dashboard
                </Text>
              </div>
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Stack gap="md" h="100%">
              <ThemeIcon size={50} radius="md" variant="light" color="green">
                <IconChartBar size={28} />
              </ThemeIcon>
              <div>
                <Title order={4} mb="xs">Pension Analytics</Title>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.5 }}>
                  Track your pension contributions and get insights for optimal retirement planning
                </Text>
              </div>
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%" 
                style={{ gridColumn: '1 / -1' }}>
            <Stack gap="md" h="100%">
              <ThemeIcon size={50} radius="md" variant="light" color="orange">
                <IconVideo size={28} />
              </ThemeIcon>
              <div>
                <Title order={4} mb="xs">Expert Consultations</Title>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.5 }}>
                  Book video consultations with certified financial advisors
                </Text>
              </div>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* CTA Section */}
        <Box mt="xl">
          <Card 
            shadow="md" 
            padding="lg" 
            radius="lg" 
            withBorder
            style={{
              background: 'linear-gradient(135deg, rgba(100, 108, 255, 0.1), rgba(83, 91, 242, 0.05))',
              border: '1px solid rgba(100, 108, 255, 0.2)'
            }}
          >
            <Stack align="center" gap="md" ta="center">
              <Title order={2} size="h2">
                Ready to Get Started?
              </Title>
              <Text 
                size="md" 
                c="dimmed"
                style={{ maxWidth: '500px' }}
              >
                Join thousands of Israelis who trust IntIsrael for their financial planning needs. 
                Get started today with your personalized dashboard.
              </Text>
              
              <Group gap="md" justify="center" mt="md">
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Button 
                    size="lg"
                    rightSection={<IconArrowRight size={20} />}
                    style={{ minWidth: '160px' }}
                  >
                    Get Started
                  </Button>
                </Link>
              </Group>
            </Stack>
          </Card>
        </Box>

        {/* Trust Indicators */}
        <Group justify="center" gap="xs" mt="lg">     
          <Text size="xs" c="dimmed" ta="center">
            🔒 Bank-level security
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            🇮🇱 Licensed in Israel
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            📱 Mobile optimized
          </Text>
        </Group>
      </Stack>
    </Container>
  )
}