import { Center, Loader, Stack, Text } from '@mantine/core'

export function AuthLoader({ message = "Checking authentication..." }) {
  return (
    <Center style={{ minHeight: '60vh' }}>
      <Stack align="center" gap="xs">
        <Loader size="lg" color="blue" />
        <Text c="dimmed">{message}</Text>
      </Stack>
    </Center>
  )
} 