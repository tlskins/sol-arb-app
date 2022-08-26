import { ReactNode } from 'react';
import {
  Box,
  Flex,
  Avatar,
  HStack,
  Link,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Center,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { useEffect } from 'react'
import { signIn, signOut, useSession } from "next-auth/react";

import { setAccessToken } from '../http-common'


const Navbar = () => {
  const {
    isOpen: isOpenProfile,
    onOpen: onOpenProfile,
    onClose: onCloseProfile,
  } = useDisclosure();

  const { data: sessionData, status: sessionStatus } = useSession();
  const isLoading = sessionStatus === "loading"
  const isSignedIn = !!sessionData?.token
  const userName = sessionData?.token?.username

  useEffect(() => {
    if ( sessionStatus === "authenticated" ) {
      console.log('setAccessToken', sessionData?.token?.access_token)
      setAccessToken( sessionData?.token?.access_token )
    }
  }, [sessionStatus])

  const onSignOut = () => {
    signOut()
    setAccessToken( "" )
  }

  return (
    <>
      <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <IconButton
            size={'md'}
            icon={isOpenProfile ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={'Open Menu'}
            display={{ md: 'none' }}
            onClick={(!isOpenProfile && isSignedIn) ? onOpenProfile : onCloseProfile}
          />
          <HStack spacing={8} alignItems={'center'}>
            <HStack
              as={'nav'}
              spacing={4}
              display={{ base: 'none', md: 'flex' }}
            >
            </HStack>
          </HStack>
          <Flex alignItems={'center'}>
            <Menu>
              {isLoading && <p>Loading...</p>}

              {(!isLoading && !isSignedIn) && (
                <MenuButton
                  as={Button}
                  rounded={'full'}
                  variant={'link'}
                  cursor={'pointer'}
                  minW={0}
                  onClick={async () => {
                    const signInResp = await signIn("discord", { redirect: false })
                    console.log('signInResp', signInResp)
                  }}
                >
                  Sign in
                </MenuButton>
              )}

              {(!isLoading && isSignedIn) && (
                <>
                  <MenuButton
                    as={Button}
                    rounded={'full'}
                    variant={'link'}
                    cursor={'pointer'}
                    minW={0}
                  >
                    <Avatar
                      size={'sm'}
                      src={ sessionData?.token.image_url }
                    />
                    <Center fontSize="xs">
                      { userName }
                    </Center>
                  </MenuButton>
                  <MenuList>
                    <MenuItem
                      _hover={{
                        background:"green.200",
                      }}
                      fontWeight="bold"
                    >
                      New Swap Rule
                    </MenuItem>

                    <MenuDivider />
                    <MenuItem onClick={onSignOut}>
                      Sign Out
                    </MenuItem>
                  </MenuList>
                </>
              )}
            </Menu>
          </Flex>
        </Flex>
      </Box>
    </>
  );
}
  
const NavLink = ({ children, url }: { children: ReactNode, url: string }) => (
  <Link
    px={2}
    py={1}
    rounded={'md'}
    _hover={{
      textDecoration: 'none',
      bg: useColorModeValue('gray.200', 'gray.700'),
    }}
    href={url}
  >
    {children}
  </Link>
);

export default Navbar