import {
  Box,
  Flex,
  Avatar,
  HStack,
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
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { useEffect, useState } from 'react'
import { signIn, signOut, useSession } from "next-auth/react";

import { setAccessToken } from '../http-common'
import { ICreateSwapRule } from '../types/swapRules'
import SwapRuleService from '../services/swapRule.service'
import WalletService from '../services/wallets.service'
import { useGlobalState, resetGlobalState } from '../services/gloablState'
import { ICreateWallet } from '../types/wallet'
import { pWalletName } from '../presenters/wallets'
import swapRuleService from '../services/swapRule.service'


const Navbar = () => {
  const {
    isOpen: isOpenProfile,
    onOpen: onOpenProfile,
    onClose: onCloseProfile,
  } = useDisclosure();
  const {
    isOpen: isCreateSwapModalOpen,
    onOpen: onOpenCreateSwapModal,
    onClose: onCloseCreateSwapModal,
  } = useDisclosure()
  const {
    isOpen: isCreateWalletModalOpen,
    onOpen: onOpenCreateWalletModal,
    onClose: onCloseCreateWalletModal,
  } = useDisclosure()

  const { data: _sessionData, status: sessionStatus } = useSession();
  const sessionData = _sessionData as any
  const isLoading = sessionStatus === "loading"
  const isSignedIn = !!sessionData?.token
  const userName = sessionData?.token?.username

  const [isCreatingSwap, setIsCreatingSwap] = useState(false)
  const [createSwapRule, setCreateSwapRule] = useState(SwapRuleService.newSwapRule())
  const [, setTokenSwapRules] = useGlobalState('tokenSwapRules')

  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [isShowPrivateKey, setIsShowPrivateKey] = useState(false)
  const [createWallet, setCreateWallet] = useState(WalletService.newWallet())
  const [wallets, setWallets] = useGlobalState('wallets')

  useEffect(() => {
    if ( sessionStatus === "authenticated" ) {
      setAccessToken( sessionData?.token?.access_token )
    }
  }, [sessionStatus])

  const onSignOut = () => {
    signOut()
    setAccessToken( "" )
    resetGlobalState()
  }

  const onCreateSwapRule = async () => {
    setIsCreatingSwap(true)
    const resp = await SwapRuleService.create(createSwapRule)
    if ( resp ) {
      setCreateSwapRule(swapRuleService.newSwapRule())
      onCloseCreateSwapModal()
      const rules = await SwapRuleService.getRulesByDiscord()
      if ( rules ) {
        setTokenSwapRules( rules )
      }
    }
    setIsCreatingSwap(false)
  }

  const onCreateWallet = async () => {
    setIsCreatingWallet(true)
    const resp = await WalletService.create(createWallet)
    if ( resp ) {
      setCreateWallet(WalletService.newWallet())
      onCloseCreateWalletModal()
      const wallets = await WalletService.getWallets()
      if ( wallets ) {
        setWallets( wallets )
      }
    }
    setIsCreatingWallet(false)
  }

  return (
    <>
      {/* Swap Rule Modal */}
      <Modal
        isOpen={isCreateSwapModalOpen}
        onClose={onCloseCreateSwapModal}
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
              isLoading={isCreatingSwap}
              loadingText='Saving...'
              colorScheme='teal'
              variant='solid'
              onClick={onCreateSwapRule}
            >
              Save
            </Button>
            <Button variant='ghost' onClick={onCloseCreateSwapModal}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Wallet Modal */}
      <Modal
        isOpen={isCreateWalletModalOpen}
        onClose={onCloseCreateWalletModal}
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
          <ModalHeader>Create Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack direction="column">
              <FormControl>
                <FormLabel>
                  Wallet
                </FormLabel>
                <Input type="text"
                  value={ createWallet.name }
                  onChange={ e => setCreateWallet({ ...createWallet, name: e.target.value }) }
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Public Key
                </FormLabel>
                <Input type="text"
                  value={ createWallet.publicKey }
                  onChange={ e => setCreateWallet({ ...createWallet, publicKey: e.target.value }) }
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Private Key
                </FormLabel>
                <InputGroup size='md'>
                  <Input
                    pr='4.5rem'
                    type={isShowPrivateKey ? 'text' : 'password'}
                    placeholder='Private Key'
                  />
                  <InputRightElement width='4.5rem'>
                    <Button h='1.75rem' size='sm' onClick={() => setIsShowPrivateKey(!isShowPrivateKey)}>
                      {isShowPrivateKey ? 'Hide' : 'Show'}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button
              isLoading={isCreatingWallet}
              loadingText='Saving...'
              colorScheme='teal'
              variant='solid'
              onClick={onCreateWallet}
            >
              Save
            </Button>
            <Button variant='ghost' onClick={onCloseCreateWalletModal}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Navbar */}
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
                  onClick={() => signIn("discord", { redirect: false })}
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
                      onClick={onOpenCreateSwapModal}
                    >
                      New Swap Rule
                    </MenuItem>
                    <MenuItem
                      _hover={{
                        background:"green.200",
                      }}
                      fontWeight="bold"
                      onClick={onOpenCreateWalletModal}
                    >
                      New Wallet
                    </MenuItem>
                    <MenuDivider />
                    { wallets.length > 0 &&
                      <>
                        <MenuItem fontWeight="bold">
                          Wallets
                        </MenuItem>
                        { wallets.map( wallet => (
                          <MenuItem key={wallet._id}
                            _hover={{
                              background:"green.200",
                            }}
                          >
                            { pWalletName( wallet ) }
                          </MenuItem>
                        ))}
                        <MenuDivider />
                      </>
                    }
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