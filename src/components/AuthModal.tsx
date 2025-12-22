import React, { useState } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Divider,
  HStack,
  Icon,
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react'
import { LogIn, Linkedin, UserPlus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', name: '' })
  const { login, loginWithLinkedIn, register, isLoading } = useAuth()

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

  const handleLinkedInLogin = async () => {
    await loginWithLinkedIn()
    // OAuth will redirect, modal will close on return
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Welcome to LakeB2B</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            {/* LinkedIn OAuth Button */}
            <Button
              width="full"
              bg="#0A66C2"
              color="white"
              _hover={{ bg: '#004182' }}
              leftIcon={<Icon as={Linkedin} boxSize={5} />}
              onClick={handleLinkedInLogin}
              isLoading={isLoading}
              size="lg"
              fontWeight="semibold"
            >
              Continue with LinkedIn
            </Button>

            <HStack width="full">
              <Divider />
              <Text fontSize="sm" color="gray.500" whiteSpace="nowrap" px={2}>
                or use email
              </Text>
              <Divider />
            </HStack>

            <Tabs width="full" isFitted variant="enclosed">
              <TabList mb={4}>
                <Tab>Login</Tab>
                <Tab>Sign Up</Tab>
              </TabList>

              <TabPanels>
                {/* Login Tab */}
                <TabPanel p={0}>
                  <form onSubmit={handleLogin} style={{ width: '100%' }}>
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
                          placeholder="Enter password"
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

                {/* Register Tab */}
                <TabPanel p={0}>
                  <form onSubmit={handleRegister} style={{ width: '100%' }}>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel>Name</FormLabel>
                        <Input
                          type="text"
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Your name"
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
                          placeholder="Create a password"
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          At least 6 characters
                        </Text>
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

            <Box textAlign="center" pt={2}>
              <Text fontSize="xs" color="gray.500">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </Text>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default AuthModal
