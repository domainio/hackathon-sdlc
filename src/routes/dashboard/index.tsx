import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  Stack,
  Title,
  Text,
  Card,
  Grid,
  Badge,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Progress,
  ThemeIcon,
  Box,
  Container,
  Divider
} from '@mantine/core'
import { 
  IconShield, 
  IconChartBar, 
  IconVideo, 
  IconUser,
  IconPhone,
  IconLanguage,
  IconTrendingUp,
  IconCalendar
} from '@tabler/icons-react'
import { useAuthContext } from '../../contexts/AuthContext'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardComponent,
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  
  
})

function DashboardComponent() {
  const { user } = useAuthContext()
  if (!user) {
    alert('user not found') 
    console.log('user', user)
    return  null
  }

  return (
    <Container size="xl" px={0}>
      <Stack gap="lg">
        {/* Header Section */}
        <Box>
          <Group 
            justify="space-between" 
            align="stretch"
            gap="md"
            style={{ 
              flexDirection: 'row'
            }}
          >
            <Stack gap="xs" style={{ flex: 1 }}>
              <Title 
                order={1}
                size="h2"
                style={{ lineHeight: 1.2 }}
              >
                Welcome, {user.name}!
              </Title>
              <Text 
                size="md" 
                c="dimmed"
                style={{ maxWidth: '500px' }}
              >
                Your comprehensive financial management dashboard
              </Text>
            </Stack>
            
            <Group gap="xs" align="center">
              <Badge 
                color="green" 
                size="md"
                leftSection={<IconLanguage size={14} />}
              >
                {user.language === 'he' ? 'עברית' : 'English'}
              </Badge>
              {user.needsOnboarding && (
                <Badge color="orange" variant="light" size="md">
                  Setup Required
                </Badge>
              )}
            </Group>
          </Group>
          <Divider mt="lg" />
        </Box>

        {/* Quick Stats */}
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Stack gap="xs" align="center" ta="center">
              <ThemeIcon size={40} radius="md" variant="light" color="blue">
                <IconShield size={20} />
              </ThemeIcon>
              <Text size="sm" c="dimmed">Insurance Policies</Text>
              <Title order={3} c="blue">3</Title>
            </Stack>
          </Card>

          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Stack gap="xs" align="center" ta="center">
              <ThemeIcon size={40} radius="md" variant="light" color="green">
                <IconChartBar size={20} />
              </ThemeIcon>
              <Text size="sm" c="dimmed">Pension Funds</Text>
              <Title order={3} c="green">2</Title>
            </Stack>
          </Card>

          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Stack gap="xs" align="center" ta="center">
              <ThemeIcon size={40} radius="md" variant="light" color="orange">
                <IconVideo size={20} />
              </ThemeIcon>
              <Text size="sm" c="dimmed">Consultations</Text>
              <Title order={3} c="orange">1</Title>
            </Stack>
          </Card>

          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Stack gap="xs" align="center" ta="center">
              <ThemeIcon size={40} radius="md" variant="light" color="purple">
                <IconTrendingUp size={20} />
              </ThemeIcon>
              <Text size="sm" c="dimmed">Portfolio Growth</Text>
              <Title order={3} c="purple">+12.5%</Title>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Main Content Grid */}
        <Grid gutter={{ base: 'md', md: 'lg' }}>
          {/* Finance Overview */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Stack gap="md">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Group gap="sm">
                      <ThemeIcon size={32} radius="md" variant="light" color="blue">
                        <IconShield size={18} />
                      </ThemeIcon>
                      <div>
                        <Title order={3}>Finance Overview</Title>
                        <Text size="sm" c="dimmed">
                          View your aggregated insurance & pension data
                        </Text>
                      </div>
                    </Group>
                    <Badge variant="light" color="blue">
                      Coming Soon
                    </Badge>
                  </Group>
                  
                  {/* Placeholder content */}
                  <Box>
                    <Text size="sm" mb="xs" fw={500}>Setup Progress</Text>
                    <Progress value={65} size="lg" radius="md" />
                    <Text size="xs" c="dimmed" mt="xs">
                      65% complete - Connect your insurance providers
                    </Text>
                  </Box>
                  
                  <Button variant="light" fullWidth disabled>
                    View Detailed Analytics
                  </Button>
                </Stack>
              </Card>

              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Group gap="sm">
                      <ThemeIcon size={32} radius="md" variant="light" color="green">
                        <IconChartBar size={18} />
                      </ThemeIcon>
                      <div>
                        <Title order={3}>Investment Portfolio</Title>
                        <Text size="sm" c="dimmed">
                          Track your pension and investment performance
                        </Text>
                      </div>
                    </Group>
                    <Badge variant="light" color="green">
                      Active
                    </Badge>
                  </Group>
                  
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <Box>
                      <Text size="xs" c="dimmed">Total Value</Text>
                      <Title order={4} c="green">₪245,000</Title>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">Monthly Growth</Text>
                      <Title order={4} c="blue">+₪3,200</Title>
                    </Box>
                  </SimpleGrid>
                  
                  <Button variant="light" fullWidth disabled>
                    View Portfolio Details
                  </Button>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>

          {/* Sidebar */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Stack gap="md">
              {/* Book Consultation */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md" align="center" ta="center">
                  <ThemeIcon size={48} radius="md" variant="light" color="orange">
                    <IconVideo size={24} />
                  </ThemeIcon>
                  <div>
                    <Title order={4}>Book Consultation</Title>
                    <Text size="sm" c="dimmed">
                      Schedule a video call with our experts
                    </Text>
                  </div>
                  <Button variant="light" fullWidth disabled>
                    Schedule Meeting
                  </Button>
                </Stack>
              </Card>

              {/* Upcoming Events */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Group gap="sm">
                    <ThemeIcon size={32} radius="md" variant="light" color="purple">
                      <IconCalendar size={18} />
                    </ThemeIcon>
                    <div>
                      <Title order={4}>Upcoming</Title>
                      <Text size="sm" c="dimmed">Next events</Text>
                    </div>
                  </Group>
                  
                  <Stack gap="xs">
                    <Box>
                      <Text size="sm" fw={500}>Pension Review</Text>
                      <Text size="xs" c="dimmed">March 15, 2025</Text>
                    </Box>
                    <Box>
                      <Text size="sm" fw={500}>Insurance Renewal</Text>
                      <Text size="xs" c="dimmed">April 22, 2025</Text>
                    </Box>
                  </Stack>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>

        {/* Account Information */}
        <Paper shadow="xs" p={{ base: 'md', md: 'lg' }} withBorder radius="md">
          <Stack gap="md">
            <Group gap="sm" mb="sm">
              <ThemeIcon size={32} radius="md" variant="light">
                <IconUser size={18} />
              </ThemeIcon>
              <Title order={4}>Account Information</Title>
            </Group>
            
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              <Group gap="xs">
                <IconUser size={16} color="gray" />
                <Text size="sm">
                  <Text component="span" fw={500}>Name:</Text> {user.name}
                </Text>
              </Group>
              
              <Group gap="xs">
                <IconPhone size={16} color="gray" />
                <Text size="sm">
                  <Text component="span" fw={500}>Phone:</Text> {user.phone}
                </Text>
              </Group>
              
              <Group gap="xs">
                <IconLanguage size={16} color="gray" />
                <Text size="sm">
                  <Text component="span" fw={500}>Language:</Text> {user.language === 'he' ? 'Hebrew' : 'English'}
                </Text>
              </Group>
            </SimpleGrid>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}