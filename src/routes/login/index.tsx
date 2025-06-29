import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Stack,
  Title,
  Text,
  Card,
  TextInput,
  Button,
  Group,
  PinInput,
  Stepper,
  Alert,
  Container,
  ThemeIcon,
  Box,
  Divider
} from '@mantine/core'
import { 
  IconAlertCircle, 
  IconShield, 
  IconSend, 
  IconArrowLeft,
  IconCheck 
} from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'

export const Route = createFileRoute('/login/')({
  component: LoginComponent,
})

function LoginComponent() {
  const navigate = useNavigate()
  const { sendOTP, verifyOTP, sendOTPError, verifyOTPError } = useAuth()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')

  const currentError = activeStep === 0 ? sendOTPError : verifyOTPError

  const handleSendOTP = async () => {
    if (!phone.trim()) return
    
    setLoading(true)
    try {
      await sendOTP(phone)
      setActiveStep(1)
    } catch (err) {
      // Error is handled by useAuth hook
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return
    
    setLoading(true)
    try {
      await verifyOTP(phone, otp)
      navigate({ to: '/dashboard' })
    } catch (err) {
      // Error is handled by useAuth hook
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="sm" px={{ base: 'xs', sm: 'md' }}>
      <Stack gap="lg" py="md">
        {/* Header */}
        <Stack align="center" gap="md" ta="center">
          <ThemeIcon size={64} radius="xl" variant="light" color="blue">
            <IconShield size={32} />
          </ThemeIcon>
          <Title 
            order={1} 
            size="h2"
            style={{ maxWidth: '400px' }}
          >
            Sign In to IntIsrael
          </Title>
          <Text c="dimmed" size="md">
            Secure access to your financial dashboard
          </Text>
        </Stack>
        
        {/* Login Form */}
        <Card 
          shadow="md" 
          padding="lg" 
          radius="lg" 
          withBorder 
          style={{ width: '100%', maxWidth: '450px', margin: '0 auto' }}
        >
          <Stack gap="lg">
            <Stepper 
              active={activeStep} 
              onStepClick={(step) => step < activeStep && setActiveStep(step)}
              allowNextStepsSelect={false}
              size="md"
              iconSize={32}
            >
              <Stepper.Step 
                label="Phone Number" 
                description="Enter your phone"
                icon={<IconSend size={18} />}
              >
                <Stack gap="lg" mt="xl">
                  <Box>
                    <TextInput
                      label="Phone Number"
                      placeholder="+972-50-123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      size="md"
                      radius="md"
                      style={{ fontSize: '16px' }} // Prevent zoom on iOS
                      inputMode="tel"
                      autoComplete="tel"
                    />
                    <Text size="xs" c="dimmed" mt="xs">
                      We'll send you a verification code via SMS
                    </Text>
                  </Box>
                  
                  <Button 
                    onClick={handleSendOTP} 
                    loading={loading}
                    disabled={!phone.trim()}
                    fullWidth
                    size="md"
                    radius="md"
                    rightSection={<IconSend size={18} />}
                  >
                    {loading ? 'Sending...' : 'Send Verification Code'}
                  </Button>
                </Stack>
              </Stepper.Step>

              <Stepper.Step 
                label="Verification" 
                description="Enter the code"
                icon={<IconCheck size={18} />}
              >
                <Stack gap="lg" mt="xl">
                  <Box ta="center">
                    <Text size="sm" c="dimmed" mb="md">
                      We've sent a 6-digit verification code to
                    </Text>
                    <Text fw={500} mb="lg">{phone}</Text>
                    
                    <Group justify="center" mb="lg">
                      <PinInput
                        length={6}
                        value={otp}
                        onChange={setOtp}
                        disabled={loading}
                        size="lg"
                        radius="md"
                        style={{ gap: '8px' }}
                        inputMode="numeric"
                        onComplete={(value) => setOtp(value)}
                      />
                    </Group>
                    
                    <Text size="xs" c="dimmed">
                      Didn't receive the code? Check your messages or try again
                    </Text>
                  </Box>
                  
                  <Group grow gap="md">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setActiveStep(0)
                        setOtp('')
                      }}
                      disabled={loading}
                      size="md"
                      radius="md"
                      leftSection={<IconArrowLeft size={18} />}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleVerifyOTP} 
                      loading={loading}
                      disabled={otp.length !== 6}
                      size="md"
                      radius="md"
                      rightSection={<IconCheck size={18} />}
                    >
                      {loading ? 'Verifying...' : 'Verify & Sign In'}
                    </Button>
                  </Group>
                </Stack>
              </Stepper.Step>
            </Stepper>

            {currentError && (
              <Alert 
                icon={<IconAlertCircle size="1rem" />} 
                color="red" 
                radius="md"
                variant="light"
              >
                <Text size="sm">{currentError.message}</Text>
              </Alert>
            )}
          </Stack>
        </Card>

        {/* Security Notice */}
        <Card shadow="xs" padding="md" radius="md" withBorder>
          <Group gap="sm" justify="center">
            <IconShield size={16} color="green" />
            <Text size="xs" c="dimmed" ta="center">
              Your data is protected with bank-level security encryption
            </Text>
          </Group>
        </Card>

        {/* Help Text */}
        <Stack gap="xs" ta="center">
          <Text size="xs" c="dimmed">
            Need help? Contact our support team
          </Text>
          <Group justify="center" gap="xs">
            <Text size="xs" c="dimmed">📧 support@intisrael.com</Text>
            <Divider orientation="vertical" />
            <Text size="xs" c="dimmed">📞 +972-3-123-4567</Text>
          </Group>
        </Stack>
      </Stack>
    </Container>
  )
}