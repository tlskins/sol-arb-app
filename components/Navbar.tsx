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
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Stack,
  FormControl,
  FormLabel,
  Input,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { useEffect, useState } from 'react'
import { signIn, signOut, useSession } from "next-auth/react";

import { setAccessToken } from '../http-common'
import { ICreateSwapRule } from '../types/swapRules'
import SwapRuleService from '../services/swapRule.service'
import { useGlobalState } from '../services/gloablState'


const Navbar = () => {
  const {
    isOpen: isOpenProfile,
    onOpen: onOpenProfile,
    onClose: onCloseProfile,
  } = useDisclosure();
  const {
    isOpen: isCreateModalOpen,
    onOpen: onOpenCreateModal,
    onClose: onCloseCreateModal,
  } = useDisclosure()

  const { data: _sessionData, status: sessionStatus } = useSession();
  const sessionData = _sessionData as any
  const isLoading = sessionStatus === "loading"
  const isSignedIn = !!sessionData?.token
  const userName = sessionData?.token?.username
  const [isCreating, setIsCreating] = useState(false)
  const [createSwapRule, setCreateSwapRule] = useState({
    baseTokenSym: "",
    swapTokenSym: "",
  } as ICreateSwapRule)
  const [, setTokenSwapRules] = useGlobalState('tokenSwapRules')

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

  const onCreateSwapRule = async () => {
    setIsCreating(true)
    const resp = await SwapRuleService.create(createSwapRule)
    if ( resp ) {
      SwapRuleService
      setCreateSwapRule({
        baseTokenSym: "",
        swapTokenSym: "",
      })
      onCloseCreateModal()
      const rules = await SwapRuleService.getRulesByDiscord()
      if ( rules ) {
        setTokenSwapRules( rules )
      }
    }
    setIsCreating(false)
  }

  return (
    <>
      <Modal
        isOpen={isCreateModalOpen}
        onClose={onCloseCreateModal}
        motionPreset='slideInRight'
        size="sm"
        isCentered
      >
        <ModalOverlay
          bg='none'
          backdropFilter='auto'
          backdropInvert='80%'
          backdropBlur='2px'
        />
        <ModalContent>
          <ModalHeader>Create Swap Rule</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack direction="column">
              <FormControl>
                <FormLabel>
                  Swap Token
                </FormLabel>
                <Input type="text"
                  value={ createSwapRule.swapTokenSym }
                  onChange={ e => setCreateSwapRule({ ...createSwapRule, swapTokenSym: e.target.value }) }
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Base Token
                </FormLabel>
                <Input type="text"
                  value={ createSwapRule.baseTokenSym }
                  onChange={ e => setCreateSwapRule({ ...createSwapRule, baseTokenSym: e.target.value }) }
                />
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button
              isLoading={isCreating}
              loadingText='Saving...'
              colorScheme='teal'
              variant='solid'
              onClick={onCreateSwapRule}
            >
              Save
            </Button>
            <Button variant='ghost' onClick={onCloseCreateModal}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
                      onClick={onOpenCreateModal}
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
  )
}

export default Navbar