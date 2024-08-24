'use client'
import { Box, Button, Stack, TextField } from '@mui/material'
import { useState } from 'react'

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm the Rate My Professor support assistant. How can I help you today?`,
    },
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    if (!message.trim()) return; // Prevent sending empty messages

    const userMessage = { role: 'user', content: message }
    setMessages((messages) => [...messages, userMessage, { role: 'assistant', content: '' }])
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, userMessage]),
      })

      if (response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let result = ''

        const processText = async ({ done, value }) => {
          if (done) return result

          const text = decoder.decode(value || new Uint8Array(), { stream: true })
          setMessages((messages) => {
            let lastMessage = messages[messages.length - 1]
            let otherMessages = messages.slice(0, messages.length - 1)
            return [
              ...otherMessages,
              { ...lastMessage, content: lastMessage.content + text },
            ]
          })

          const { done: doneReading, value: newValue } = await reader.read()
          return processText({ done: doneReading, value: newValue })
        }

        await reader.read().then(processText)
      } else {
        throw new Error('Response body is null')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages((messages) => [
        ...messages.slice(0, messages.length - 1),
        { role: 'assistant', content: 'Sorry, something went wrong.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction={'column'}
        width="500px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'primary.main'
                    : 'secondary.main'
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content || (isLoading && message.role === 'assistant' && '...')}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction={'row'} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') sendMessage()
            }}
            disabled={isLoading}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isLoading}
          >
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
