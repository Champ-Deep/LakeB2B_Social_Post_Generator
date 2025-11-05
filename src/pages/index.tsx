import Head from 'next/head'
import PostGenerator from '../components/PostGenerator'
import { Box } from '@chakra-ui/react'

export default function Home() {
  return (
    <>
      <Head>
        <title>LakeB2B Social Post Generator</title>
        <meta name="description" content="Create brand-consistent social media images for LakeB2B" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Box minH="100vh" bg="gray.50">
        <PostGenerator />
      </Box>
    </>
  )
}