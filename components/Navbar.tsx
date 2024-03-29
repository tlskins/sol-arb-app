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
  Select,
  Stack,
  Text,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react'
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from 'next/router'
import CreatableSelect from 'react-select/creatable'
import { OnChangeValue } from 'react-select'

import { setAccessToken } from '../http-common'
import SwapRuleService from '../services/swapRule.service'
import WalletService from '../services/wallets.service'
import { useGlobalState, resetGlobalState } from '../services/gloablState'
import { pWalletName } from '../presenters/wallets'
import ProjectRuleService from '../services/projectRule.service'
import { ProjectStat } from '../types/projectRules'
import NumberInput from './NumberInput'
import alphaService from '../services/alpha.service'

interface TagOption {
  value: string,
  label: string,
}


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
  const {
    isOpen: isConfirmModalOpen,
    onOpen: onOpenConfirmModal,
    onClose: onCloseConfirmModalWindow,
  } = useDisclosure()

  const { data: _sessionData, status: sessionStatus } = useSession();
  const sessionData = _sessionData as any
  const isLoading = sessionStatus === "loading"
  const isSignedIn = !!sessionData?.token
  const userName = sessionData?.token?.username

  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [isShowPrivateKey, setIsShowPrivateKey] = useState(false)
  const [createWallet, setCreateWallet] = useState(WalletService.newWallet())
  const [wallets, setWallets] = useGlobalState('wallets')

  const dftWallet = wallets.length ? wallets[0] : null
  const [isCreatingSwap, setIsCreatingSwap] = useState(false)
  const [createSwapRule, setCreateSwapRule] = useState(SwapRuleService.newSwapRule(dftWallet))
  const [, setTokenSwapRules] = useGlobalState('tokenSwapRules')

  const [availTags, setAvailTags] = useGlobalState('tags')
  const [isCreatingProj, setIsCreatingProj] = useState(false)
  const [createProjRule, setCreateProjRule] = useState(ProjectRuleService.newProjectRule())
  const [, setProjRules] = useGlobalState('projectRules')
  const [searchProj, setSearchProj] = useState("")
  const [searchProjResults, setSearchProjResults] = useState([] as ProjectStat[])
  const searchRef = useRef( undefined as NodeJS.Timeout | undefined )

  const [confirmModal, setConfirmModal] = useGlobalState('confirmModal')
  const [_, setEntityTypes] = useGlobalState('entityTypes')

  useEffect(() => {
    if ( sessionStatus === "authenticated" ) {
      setAccessToken( sessionData?.token?.access_token )
    }
  }, [sessionStatus])

  useEffect(() => {
    if ( confirmModal ) {
      onOpenConfirmModal()
    } else {
      onCloseConfirmModal()
    }
  }, [confirmModal])

  // useEffect(() => {
  //   if ( sessionData?.token?.id ) {
  //     console.log('loading types...')
  //     onLoadEntityTypes()
  //   }
  // }, [sessionData?.token?.id])

  const onLoadEntityTypes = async (): Promise<void> => {
    const newEntityTypes = await alphaService.getEntityTypes()
    if ( newEntityTypes ) {
      setEntityTypes( newEntityTypes.sort((a,b) => a.name > b.name ? 1 : 0) )
    }
  }

  const onSignOut = () => {
    signOut()
    setAccessToken( "" )
    resetGlobalState()
  }

  const onCreateSwapRule = async () => {
    setIsCreatingSwap(true)
    const resp = await SwapRuleService.create(createSwapRule)
    if ( resp ) {
      setCreateSwapRule(SwapRuleService.newSwapRule(dftWallet))
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

  const onLoadTags = async () => {
    if ( !sessionData ) {
      return
    }
    const resp = await ProjectRuleService.getProfileStats()
    if ( resp ) {
      setAvailTags( resp.tags )
    }
  }

  const onChangeTags = (
    newValue: OnChangeValue<TagOption, true>,
  ) => {
    setCreateProjRule({ ...createProjRule, tags: newValue.map( v => v.value ) })
  }

  const onOpenCreateProjRule = () => {
    onOpenCreateProjModal()
    if ( availTags.length === 0 ) {
      onLoadTags()
    }
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
    }, 350)
  }

  const onCloseConfirmModal = () => {
    setConfirmModal(undefined)
    onCloseConfirmModalWindow()
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
                  Tensor Slug Name
                </FormLabel>
                <Input type="text"
                  placeholder="Search"
                  value={ createProjRule.tensorSlugsDisplay }
                  onChange={ e => setCreateProjRule({ ...createProjRule, tensorSlugsDisplay: e.target.value })}
                />
              </FormControl>

              { createProjRule.tensorSlugsDisplay &&
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
                        thousandSeparator={true}
                        value={ createProjRule.fixedPriceChange }
                        onValueChange={ value => setCreateProjRule({ ...createProjRule, fixedPriceChange: value }) }
                      />
                    </Stack>
                  </Stack>

                  <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                    <FormControl>
                      <FormLabel>
                        Tags
                      </FormLabel>
                      <CreatableSelect
                        isMulti
                        onChange={onChangeTags}
                        defaultValue={(createProjRule.tags || []).map( t => ({ value: t, label: t }))}
                        options={availTags.map( t => ({ value: t, label: t }))}
                      />
                    </FormControl>
                  </Stack>
                </>
              }
            </Stack>
          </ModalBody>

          <ModalFooter>
            { (createProjRule && createProjRule.tensorSlugsDisplay.length > 0) &&
              <Button
                isLoading={isCreatingProj}
                loadingText='Saving...'
                colorScheme='teal'
                variant='solid'
                onClick={onCreateProjRule}
              >
                Save
              </Button>
            }
            <Button variant='ghost' onClick={onCloseCreateProjModal}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={onCloseConfirmModal}
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
          <ModalHeader>Confirm</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              { confirmModal?.message }
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button
              isLoading={isCreatingWallet}
              loadingText='Saving...'
              colorScheme='teal'
              variant='solid'
              onClick={confirmModal?.callback}
            >
              Confirm
            </Button>
            <Button variant='ghost' onClick={onCloseConfirmModal}>Close</Button>
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
                      onClick={onOpenCreateProjRule}
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

                    <MenuItem
                      _hover={{
                        background:"green.200",
                      }}
                      fontWeight="extrabold"
                      onClick={() => router.push('alpha')}
                    >
                      Alpha
                    </MenuItem>
                    <MenuItem
                      _hover={{
                        background:"green.200",
                      }}
                      fontWeight="extrabold"
                      onClick={() => router.push('alpha-tagging')}
                    >
                      Discover
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