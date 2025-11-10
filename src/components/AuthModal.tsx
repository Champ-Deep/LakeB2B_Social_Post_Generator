import React, { useState } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  Divider,
  Badge,
  Box
} from '@chakra-ui/react'
import { User, LogIn, UserPlus, Trophy, Star } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', name: '' })
  const { login, register, isLoading } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await login(loginForm)
    if (success) {
      onClose()
      setLoginForm({ email: '', password: '' })
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await register(registerForm)
    if (success) {
      onClose()
      setRegisterForm({ email: '', password: '', name: '' })
    }
  }

  const handleDemoLogin = async () => {
    const success = await login({ email: 'demo@lakeb2b.com', password: 'demo123' })
    if (success) {
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Welcome to LakeB2B</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            {/* Demo Login Option */}
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" fontWeight="semibold">Try Demo Account</Text>
                <Text fontSize="xs">Experience the full features with demo user</Text>
                <Button size="xs" colorScheme="blue" onClick={handleDemoLogin} isLoading={isLoading}>
                  Login as Demo User
                </Button>
              </VStack>
            </Alert>

            <Divider />

            <Tabs width="full" variant="enclosed">
              <TabList>
                <Tab>
                  <HStack>
                    <LogIn size={16} />
                    <Text>Login</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack>
                    <UserPlus size={16} />
                    <Text>Register</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Login Panel */}
                <TabPanel px={0}>
                  <form onSubmit={handleLogin}>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="your@email.com"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Password</FormLabel>
                        <Input
                          type="password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Your password"
                        />
                      </FormControl>

                      <Button
                        type="submit"
                        colorScheme="purple"
                        width="full"
                        isLoading={isLoading}
                        leftIcon={<LogIn size={16} />}
                      >
                        Login
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                {/* Register Panel */}
                <TabPanel px={0}>
                  <form onSubmit={handleRegister}>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Full Name</FormLabel>
                        <Input
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Your full name"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="your@email.com"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Password</FormLabel>
                        <Input
                          type="password"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Choose a strong password"
                        />
                      </FormControl>

                      <Button
                        type="submit"
                        colorScheme="purple"
                        width="full"
                        isLoading={isLoading}
                        leftIcon={<UserPlus size={16} />}
                      >
                        Create Account
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>
              </TabPanels>
            </Tabs>

            {/* Benefits */}
            <Box bg="gray.50" p={4} borderRadius="md" width="full">
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                Benefits of Creating an Account:
              </Text>
              <VStack align="start" spacing={1}>
                <HStack>
                  <Trophy size={14} />
                  <Text fontSize="xs">Earn points for every image generation</Text>
                </HStack>
                <HStack>
                  <Star size={14} />
                  <Text fontSize="xs">Track your creative achievements</Text>
                </HStack>
                <HStack>
                  <User size={14} />
                  <Text fontSize="xs">Save your generation history</Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default AuthModal