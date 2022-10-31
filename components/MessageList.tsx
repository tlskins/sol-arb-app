import { useState, useEffect } from 'react'
import { AiOutlineTwitter } from 'react-icons/ai'
import { FaDiscord } from 'react-icons/fa'
import { useSession } from "next-auth/react"
import {
  IconButton,
  Stack,
  Text,
  Tag,
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
  Icon,
  Link,
} from '@chakra-ui/react'
import Moment from 'moment-timezone'
import { TriangleDownIcon, TriangleUpIcon, CloseIcon, ExternalLinkIcon } from '@chakra-ui/icons'

import { IMessage, isDiscordMsg, isTweet, ITweet, ITweetConfig, PolyMessage } from '../types/alpha'
import { ChannelsMap } from '../services/helpers'
import alphaService, { SearchMessagesReq } from '../services/alpha.service'
import { useGlobalState } from '../services/gloablState'

interface MessageBranch {
  root: PolyMessage,
  messages: PolyMessage[],
}

interface TwitterUserNameMap {
  [key: string]: string
}

const MessageList = ({
  title,
  rootMessages,
  isOpen,
  onClose,
}: {
  title: string,
  rootMessages: PolyMessage[],
  isOpen: boolean,
  onClose: ()=>void,
}) => {
  const { data: _sessionData } = useSession()
  const sessionData = _sessionData as any
  const [twitterUserNameMap, setTwitterUserNameMap] = useGlobalState('twitterUserNameMap')
  const [expandedMap, setExpandedMap] = useState({} as {[key: number]: boolean}) // branch idx -> bool
  const [msgBranches, setMsgBranches] = useState([] as MessageBranch[])

  const {
    isOpen: isLoadingNeigh,
    onOpen: onLoadNeigh,
    onClose: endLoadNeigh,
  } = useDisclosure()

  useEffect( () => {
    if ( sessionData?.token?.id && twitterUserNameMap === undefined ) {
      onLoadUserNamesMap()
    }
  }, [sessionData?.token?.id, twitterUserNameMap])

  useEffect(() => {
    const sorted = rootMessages.sort((a,b) => Moment(a.createdAt).isBefore(Moment(b.createdAt)) ? 1 : -1 )
    const branches = sorted.map( root => ({ root, messages: [root] }))
    setMsgBranches(branches)
  }, [rootMessages])

  const onLoadUserNamesMap = async () => {
    const twitterConfigs = await alphaService.getTweetConfigs()
    if ( twitterConfigs ) {
      setTwitterUserNameMap( twitterConfigs.reduce((map: TwitterUserNameMap, cfg) => {
        map[cfg.authorId] = cfg.authorHandle

        return map
      }, {}))
    }
  }

  const onLoadNeighbors = ( branchIdx: number, root: IMessage, isAfter: boolean ) => async (): Promise<void> => {
    if ( isLoadingNeigh ) return
    onLoadNeigh()
    const existBranch = msgBranches[branchIdx]
    const rootIdx = existBranch.messages.findIndex( msg => msg.id === root.id )
    const offset = isAfter ? existBranch.messages.length - rootIdx - 1 : rootIdx + 1
    const params = { channelIds: root.channel_id, orderBy: "TIMESTAMP", limit: 5, offset } as SearchMessagesReq
    console.log('load neighbors', rootIdx, offset, params)
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
    if ( isTweet( root ) ) {
      return
    }
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

            if ( isDiscordMsg( root )) {
              const isExpanded = expandedMap[branchIdx]
              return(
                <Stack key={branchIdx}
                  border="1px"
                  borderColor="gray.400"
                  bgColor={isExpanded ? "gray.700" : undefined}
                  borderRadius="md"
                  my="2"
                  p="0.5"
                >
                  <Stack direction="row" width="full" alignItems="center" alignContent="center" justifyContent="center">
                    <IconButton
                      size="xs"
                      aria-label='Load message neighbors'
                      colorScheme='teal'
                      icon={<TriangleDownIcon />}
                      onClick={onLoadAndExpand(branchIdx, true)}
                    />
                    <Icon mx="2">
                      <FaDiscord size="md"/>
                    </Icon>
                    <Tag
                      size="xs"
                      fontSize="xs"
                      borderRadius='full'
                      variant="subtle"
                      colorScheme='teal'
                      textColor="black"
                      mr="1"
                      px="1"
                      py="0.5"
                    >
                      { (ChannelsMap.get(root.channel_id)) || "Not Found" }
                    </Tag>
  
                    <IconButton
                      size="xs"
                      aria-label='Load message neighbors'
                      colorScheme='teal'
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
                      <Message message={message as IMessage} isRoot={isRoot} />
                      :
                      undefined
                    )
                  })}
                  { isExpanded &&
                    <Stack direction="row" width="full" alignItems="center" alignContent="center" justifyContent="center">
                      <IconButton
                        size="xs"
                        aria-label='Load message neighbors'
                        colorScheme='teal'
                        icon={<TriangleDownIcon />}
                        onClick={onLoadAndExpand(branchIdx, true)}
                      />
                      <Tag
                        size="xs"
                        fontSize="xs"
                        borderRadius='full'
                        variant='subtle'
                        colorScheme='teal'
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
            } else if ( isTweet( root )) {
              return(
                <Stack key={branchIdx}
                  border="1px"
                  borderColor="blue.400"
                  bgColor="blue.300"
                  borderRadius="md"
                  my="2"
                  p="0.5"
                >
                  <Stack direction="row" width="full" alignItems="center" alignContent="center" justifyContent="center">
                    <Icon mx="2">
                      <AiOutlineTwitter size="md"/>
                    </Icon>
                    <Tag
                      size="xs"
                      fontSize="xs"
                      borderRadius='full'
                      variant="subtle"
                      colorScheme='teal'
                      textColor="black"
                      mr="1"
                      px="1"
                      py="0.5"
                    >
                      { twitterUserNameMap && twitterUserNameMap[root.authorId] || "Not Found" }
                    </Tag>
                    { twitterUserNameMap && twitterUserNameMap[root.authorId] &&
                      <Link href={`https://twitter.com/${twitterUserNameMap[root.authorId]}/status/${root.tweetId}`}
                        isExternal
                      >
                        <ExternalLinkIcon mx='2' mb="1" />
                      </Link>
                    }
                  </Stack>
                  <Tweet
                    tweet={root as ITweet}
                    userNamesMap={twitterUserNameMap as TwitterUserNameMap}
                  />
                </Stack>
              )
            }
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
              variant='subtle'
              bgColor="teal.100"
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
            variant='subtle'
            bgColor="teal.200"
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
          variant="outline"
          colorScheme='teal'
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


const Tweet = ({ tweet, userNamesMap }: { tweet: ITweet, userNamesMap: TwitterUserNameMap }) => {
  return(
    <Flex key={tweet.id}
      flexDirection="column"
      w="100%"
      my="2"
      fontSize="sm"
      bg="white"
      borderRadius="md"
    >

      <Flex
        color="black"
        p="1.5"
      >
        <Text wordBreak="break-word" fontSize="xs">
          <Text
            as="span"
            whiteSpace="nowrap"
            borderRadius='full'
            variant='subtle'
            bgColor="teal.200"
            px="1.5"
            py="0.5"
            mr="1"
          >
            { userNamesMap[tweet.authorId] || "?" }
          </Text>
          {tweet.text}
        </Text>
      </Flex>

      <Text fontSize="xs" pl="2" pb="0.5"> 
        <Tag
          size="xs"
          fontSize="xx-small"
          borderRadius='full'
          variant="outline"
          colorScheme='teal'
          fontWeight="bold"
          mr="1"
          px="1"
          py="0.5"
        >
          { Moment( tweet.tweetedAt ).format('MMM D h:mm:ss a') }
        </Tag>
      </Text>
    </Flex>
  )
}


export default MessageList