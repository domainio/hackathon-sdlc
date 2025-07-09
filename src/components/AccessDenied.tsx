import { Container, Stack, ThemeIcon, Title, Text } from "@mantine/core"
import { IconAlertTriangle } from "@tabler/icons-react"

export const AccessDenied = () => {
  return (
    <Container size="sm">
    <Stack align="center" gap="xl" py="xl">
      <ThemeIcon size={80} radius="xl" variant="light" color="red">
        <IconAlertTriangle size={40} />
      </ThemeIcon>
      <Title order={1} ta="center">Access Denied</Title>
      <Text ta="center"  c="dimmed" size="lg">
        Please log in to access your dashboard.
      </Text>
    </Stack>
  </Container>
  )
}