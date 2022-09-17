import {
  Box,
  Checkbox,
  Flex,
  Avatar,
  HStack,
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
  NumberInput,
  NumberInputField,
  Select,
  Stack,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react'
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from 'next/router'

import { setAccessToken } from '../http-common'
import SwapRuleService from '../services/swapRule.service'
import WalletService from '../services/wallets.service'
import { useGlobalState, resetGlobalState } from '../services/gloablState'
import { pWalletName } from '../presenters/wallets'
import ProjectRuleService from '../services/projectRule.service'
import { ProjectStat } from '../types/projectRules'

let projSearchTimer = null as null | NodeJS.Timeout


const Navbar = () => {
  const router = useRouter()
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
  const {
    isOpen: isCreateProjModalOpen,
    onOpen: onOpenCreateProjModal,
    onClose: onCloseCreateProjModal,
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

  const [availTags, setAvailTags] = useGlobalState('tags')
  const [isCreatingProj, setIsCreatingProj] = useState(false)
  const [createProjRule, setCreateProjRule] = useState(ProjectRuleService.newProjectRule())
  const [, setProjRules] = useGlobalState('projectRules')
  const [searchProj, setSearchProj] = useState("")
  const [searchProjResults, setSearchProjResults] = useState([] as ProjectStat[])
  const searchRef = useRef( undefined as NodeJS.Timeout | undefined )

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
      setCreateSwapRule(SwapRuleService.newSwapRule())
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

  const onCreateProjRule = async () => {
    setIsCreatingProj(true)
    const resp = await ProjectRuleService.createRule(createProjRule)
    if ( resp ) {
      setCreateProjRule(ProjectRuleService.newProjectRule())
      onCloseCreateProjModal()
      const profResp = await ProjectRuleService.getProfileStats('landing')
      if ( profResp ) {
        const { profileStats, tags } = profResp
        setProjRules( profileStats )
        setAvailTags( tags )
      }
    }
    setIsCreatingProj(false)
  }

  const onSearchProject = (searchText: string) => {
    setSearchProj(searchText)
    if ( searchRef.current ) {
      clearTimeout( searchRef.current )
    }
    searchRef.current = setTimeout( async () => {
      const projects = await ProjectRuleService.searchProjects( searchText )
      if ( projects ) {
        setSearchProjResults( projects )
      }
    }, 650)
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
                    onChange={ e => setCreateWallet({ ...createWallet, privateKey: e.target.value }) }
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

      {/* Project Rule Modal */}
      <Modal
        isOpen={isCreateProjModalOpen}
        onClose={onCloseCreateProjModal}
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
          <ModalHeader>Create NFT Rule</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack direction="column">
              <FormControl>
                <FormLabel>
                  NFT
                </FormLabel>
                <Input type="text"
                  placeholder="Search"
                  value={ searchProj }
                  onChange={ e => onSearchProject( e.target.value ) }
                />
              </FormControl>

              { searchProjResults.length > 0 &&
                <Select variant='outline'
                  size="sm"
                  background="white"
                  borderRadius="lg"
                  value={createProjRule?.projectId}
                  fontSize="sm"
                  padding="0.5"
                  onChange={ e => setCreateProjRule({ ...createProjRule, projectId: e.target.value })}
                >
                  <option>Select</option>
                  { searchProjResults.map( result => (
                    <option key={result.project_id} value={result.project_id}> 
                      { result.project?.display_name || "?" } ({ result.floor_price || "?" } FP)
                    </option>
                  ))}
                </Select>
              }

              { createProjRule.projectId &&
                <>
                  <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                    <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                      <FormLabel>
                        Active
                      </FormLabel>
                      <Checkbox
                        background="white"
                        isChecked={ createProjRule.active }
                        onChange={ e => setCreateProjRule({ ...createProjRule, active: e.target.checked }) }
                        borderRadius="lg"
                        size="lg"
                      />
                    </Stack>

                    <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                      <FormLabel fontSize="sm">Fixed Change</FormLabel>
                      <NumberInput
                        size="sm"
                        step={1.0}
                        defaultValue={ createProjRule.fixedPriceChange || 0.0 }
                        onBlur={ e => setCreateProjRule({ ...createProjRule, fixedPriceChange: e.target.value ? parseFloat(e.target.value) : null }) }
                      >
                        <NumberInputField borderRadius="lg" background="white"/>
                      </NumberInput>
                    </Stack>
                  </Stack>
                </>
              }
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button
              isLoading={isCreatingProj}
              loadingText='Saving...'
              colorScheme='teal'
              variant='solid'
              onClick={onCreateProjRule}
            >
              Save
            </Button>
            <Button variant='ghost' onClick={onCloseCreateProjModal}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Navbar */}
      <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
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
                      fontWeight="extrabold"
                      onClick={() => router.push('/')}
                    >
                      Tokens
                    </MenuItem>
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

                    <MenuItem
                      _hover={{
                        background:"green.200",
                      }}
                      fontWeight="extrabold"
                      onClick={() => router.push('nfts')}
                    >
                      NFTs
                    </MenuItem>
                    <MenuItem
                      _hover={{
                        background:"green.200",
                      }}
                      fontWeight="bold"
                      onClick={onOpenCreateProjModal}
                    >
                      New Project Rule
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