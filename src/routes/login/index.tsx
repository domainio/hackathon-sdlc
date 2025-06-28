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
  Alert
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
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
    <Stack align="center" gap="xl">
      <Title order={1} ta="center">Sign In to IntIsrael</Title>
      
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ maxWidth: '400px', width: '100%' }}>
        <Stack gap="md">
          <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect={false}>
            <Stepper.Step label="Phone Number" description="Enter your phone number">
              <Stack gap="md" mt="xl">
                <TextInput
                  label="Phone Number"
                  placeholder="+972-50-123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
                <Button 
                  onClick={handleSendOTP} 
                  loading={loading}
                  disabled={!phone.trim()}
                  fullWidth
                >
                  Send OTP
                </Button>
              </Stack>
            </Stepper.Step>

            <Stepper.Step label="Verification" description="Enter the OTP code">
              <Stack gap="md" mt="xl">
                <Text size="sm" c="dimmed" ta="center">
                  We've sent a 6-digit code to {phone}
                </Text>
                <Group justify="center">
                  <PinInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                  />
                </Group>
                <Group grow>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveStep(0)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleVerifyOTP} 
                    loading={loading}
                    disabled={otp.length !== 6}
                  >
                    Verify
                  </Button>
                </Group>
              </Stack>
            </Stepper.Step>
          </Stepper>

          {currentError && (
            <Alert icon={<IconAlertCircle size="1rem" />} color="red" mt="md">
              {currentError.message}
            </Alert>
          )}
        </Stack>
      </Card>
    </Stack>
  )
} 