import { useRef, useState, useEffect } from 'react'
import {
  IconButton,
  Stack,
  Text,
  Tag,
  Wrap,
  WrapItem,
  Box,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from '@chakra-ui/react'
import Moment from 'moment-timezone'
import { TriangleDownIcon, TriangleUpIcon, CloseIcon } from '@chakra-ui/icons'

import { IMessage, ChannelsMap } from '../types/alpha'
import alphaService, { SearchMessagesReq } from '../services/alpha.service'

interface MessageBranch {
  root: IMessage,
  messages: IMessage[],
}

const MessageList = ({
  title,
  rootMessages,
  isOpen,
  onClose,
}: {
  title: string,
  rootMessages: IMessage[],
  isOpen: boolean,
  onClose: ()=>void,
}) => {
  const [expandedMap, setExpandedMap] = useState({} as {[key: number]: boolean}) // branch idx -> bool
  const [msgBranches, setMsgBranches] = useState([] as MessageBranch[])
  const {
    isOpen: isLoadingNeigh,
    onOpen: onLoadNeigh,
    onClose: endLoadNeigh,
  } = useDisclosure()

  useEffect(() => {
    const sorted = rootMessages.sort((a,b) => Moment(a.createdAt).isBefore(Moment(b.createdAt)) ? 1 : -1 )
    const branches = sorted.map( root => ({ root, messages: [root] }))
    setMsgBranches(branches)
  }, [rootMessages])

  const onLoadNeighbors = ( branchIdx: number, root: IMessage, isAfter: boolean ) => async (): Promise<void> => {
    if ( isLoadingNeigh ) return
    onLoadNeigh()
    const params = { channelIds: root.channel_id, orderBy: "TIMESTAMP", limit: 5 } as SearchMessagesReq
    if ( isAfter ) {
      params.after = root.createdAt
      params.orderDirection = "ASC"
    } else {
      params.before = root.createdAt
      params.orderDirection = "DESC"
    }
    const resp = await alphaService.searchMessages(params)
    if ( resp ) {
      const branch = msgBranches[branchIdx]
      const messages = [ ...branch.messages, ... resp ].sort((a,b) => Moment(a.createdAt).isAfter(Moment(b.createdAt)) ? 1 : -1)
      setMsgBranches([
        ...msgBranches.slice(0, branchIdx),
        { ...branch, messages },
        ...msgBranches.slice(branchIdx+1, msgBranches.length),
      ])
    }
    endLoadNeigh()
  }

  const onLoadAndExpand = ( branchIdx: number, isAfter: boolean ) => async (): Promise<void> => {
    const branch = msgBranches[branchIdx]
    const { root, messages } = branch
    const wasExpanded = expandedMap[branchIdx]
    if ( wasExpanded || messages.length === 1 ) {
      await onLoadNeighbors(branchIdx, root, isAfter )()
    }
    setExpandedMap({ ...expandedMap, [branchIdx]: true })
  }

  return(
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{ title }</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          { msgBranches.map( (branch, branchIdx) => {
            const { root, messages } = branch
            const isExpanded = expandedMap[branchIdx]
            return(
              <Stack key={branchIdx}
                p="0.5"
                border="1px"
                my="2"
                borderColor="gray.400"
                bgColor={isExpanded ? "gray.700" : undefined}
                borderRadius="md"
              >
                <Stack direction="row" width="full" alignItems="center" alignContent="center" justifyContent="center">
                  { messages.length === 1 &&
                    <IconButton
                      size="xs"
                      aria-label='Load message neighbors'
                      colorScheme='blue'
                      icon={<TriangleDownIcon />}
                      onClick={onLoadAndExpand(branchIdx, true)}
                    />
                  }
                  <Tag
                    size="xs"
                    fontSize="xx-small"
                    borderRadius='full'
                    variant='solid'
                    colorScheme='yellow'
                    textColor="black"
                    mr="1"
                    px="1"
                    py="0.5"
                  >
                    { (ChannelsMap.get(root.channel_id)) || "Not Found" }
                  </Tag>

                  <Tag
                    size="xs"
                    fontSize="xx-small"
                    borderRadius='full'
                    variant='solid'
                    colorScheme='green'
                    textColor="black"
                    mr="1"
                    px="1"
                    py="0.5"
                  >
                    { Moment( isExpanded ? messages[0].createdAt : root.createdAt ).format('MMM D h:mm:ss a') }
                  </Tag>

                  <IconButton
                    size="xs"
                    aria-label='Load message neighbors'
                    colorScheme='blue'
                    icon={<TriangleUpIcon />}
                    onClick={onLoadAndExpand(branchIdx, false)}
                  />

                  { isExpanded &&
                    <IconButton
                      size="xs"
                      aria-label='Close expanded messages'
                      colorScheme='gray'
                      icon={<CloseIcon />}
                      onClick={() => setExpandedMap({ ...expandedMap, [branchIdx]: false })}
                    />
                  }
                </Stack>
                { branch.messages.map( (message, idx) => {
                  const isRoot = message.id === root.id
                  return(
                    (isExpanded || isRoot) ?
                    <Message message={message} isRoot={isRoot} />
                    :
                    undefined
                  )
                })}
                { isExpanded &&
                  <Stack direction="row" width="full" alignItems="center" alignContent="center" justifyContent="center">
                    <IconButton
                      size="xs"
                      aria-label='Load message neighbors'
                      colorScheme='blue'
                      icon={<TriangleDownIcon />}
                      onClick={onLoadAndExpand(branchIdx, true)}
                    />
                    <Tag
                      size="xs"
                      fontSize="xx-small"
                      borderRadius='full'
                      variant='solid'
                      colorScheme='green'
                      textColor="black"
                      mr="1"
                      px="1"
                      py="0.5"
                    >
                      { Moment( messages[messages.length-1].createdAt ).format('MMM D h:mm:ss a') }
                    </Tag>
                    <IconButton
                      size="xs"
                      aria-label='Close expanded messages'
                      colorScheme='gray'
                      icon={<CloseIcon />}
                      onClick={() => setExpandedMap({ ...expandedMap, [branchIdx]: false })}
                    />
                  </Stack>
                }
              </Stack>
            )
          })}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}


const Message = ({ message, isRoot }: { message: IMessage, isRoot: boolean }) => {
  return(
    <Flex key={message.id}
      flexDirection="column"
      w="100%"
      my="2"
      fontSize="sm"
      bg={isRoot ? "white" : "gray.100"}
      borderRadius="md"
    >

      { message.referenced_message &&
        <Flex
          bg="gray.300"
          color="black"
          borderRadius="md"
          p="1.5"
          m="2"
        >
          <Text wordBreak="break-word" fontSize="xs">
            <Text
              as="span"
              whiteSpace="nowrap"
              borderRadius='full'
              variant='solid'
              bgColor="blue.200"
              px="1.5"
              py="0.5"
              mr="1"
            >
              { message.referenced_message.author.username }: 
            </Text>
            { message.referenced_message.content.slice(0,125) }
            { message.referenced_message.content.length > 125 && "..." }
          </Text>
        </Flex>
      }

      <Flex
        color="black"
        p="1.5"
      >
        <Text wordBreak="break-word" fontSize="xs">
          <Text
            as="span"
            whiteSpace="nowrap"
            borderRadius='full'
            variant='solid'
            bgColor="blue.200"
            px="1.5"
            py="0.5"
            mr="1"
          >
            { message.author.username }: 
          </Text>
          {message.content}
        </Text>
      </Flex>

      <Text fontSize="xs" pl="2" pb="0.5"> 
        <Tag
          size="xs"
          fontSize="xx-small"
          borderRadius='full'
          textColor="blue.600"
          fontWeight="bold"
          mr="1"
          px="1"
          py="0.5"
        >
          { Moment( message.createdAt ).format('MMM D h:mm:ss a') }
        </Tag>
      </Text>
    </Flex>
  )
}



export default MessageList