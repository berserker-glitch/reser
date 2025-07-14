import { Box, Stack, Heading, Text, Button } from '@chakra-ui/react'

function App() {
  return (
    <Box maxW="1200px" mx="auto" p={6}>
      <Stack gap={8}>
        {/* Header */}
        <Box textAlign="center">
          <Heading as="h1" size="2xl" color="brown" mb={4}>
            Salon Reservation System
          </Heading>
          <Text fontSize="lg" color="gray.700">
            Professional appointment booking for Moroccan hair salons
          </Text>
        </Box>

        {/* Feature Cards */}
        <Box>
          <Heading as="h2" size="lg" color="gray.700" mb={6} textAlign="center">
            System Features
          </Heading>
          <Stack gap={4}>
            <Box border="1px" borderColor="gray.200" borderRadius="lg" p={6} bg="white">
              <Stack gap={3}>
                <Heading as="h3" size="md" color="brown">
                  🧑‍💼 Owner Management
                </Heading>
                <Text color="gray.700">
                  Manage employees, working hours, services and reservations with full CRUD operations.
                </Text>
              </Stack>
            </Box>

            <Box border="1px" borderColor="gray.200" borderRadius="lg" p={6} bg="white">
              <Stack gap={3}>
                <Heading as="h3" size="md" color="brown">
                  📅 Client Booking
                </Heading>
                <Text color="gray.700">
                  Clients can register, pick services, select employees, and choose the nearest available time slot.
                </Text>
              </Stack>
            </Box>

            <Box border="1px" borderColor="gray.200" borderRadius="lg" p={6} bg="white">
              <Stack gap={3}>
                <Heading as="h3" size="md" color="brown">
                  🎉 Holiday Management
                </Heading>
                <Text color="gray.700">
                  Automatically blocks Moroccan public holidays from booking availability.
                </Text>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Tech Stack */}
        <Box textAlign="center">
          <Heading as="h2" size="lg" color="gray.700" mb={4}>
            Technology Stack
          </Heading>
          <Text color="gray.700" mb={4}>
            Laravel 10 API + MySQL 8 + React/TypeScript + Chakra UI
          </Text>
          
          <Stack gap={2}>
            <Text fontSize="sm" color="gray.600">
              ✅ React 19 with TypeScript
            </Text>
            <Text fontSize="sm" color="gray.600">
              ✅ Chakra UI v3 with Custom Theme
            </Text>
            <Text fontSize="sm" color="gray.600">
              ✅ React Query for API State Management
            </Text>
            <Text fontSize="sm" color="gray.600">
              ✅ Zustand for Global State
            </Text>
            <Text fontSize="sm" color="gray.600">
              ✅ React Hook Form for Form Management
            </Text>
            <Text fontSize="sm" color="gray.600">
              ✅ React Router for Navigation
            </Text>
          </Stack>
        </Box>

        {/* Action Buttons */}
        <Box textAlign="center">
          <Stack gap={4}>
            <Button size="lg" variant="solid">
              Start Booking (Coming Soon)
            </Button>
            <Button size="lg" variant="outline">
              Owner Dashboard (Coming Soon)
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

export default App
