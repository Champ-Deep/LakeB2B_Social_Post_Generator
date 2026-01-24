import React, { useMemo } from 'react';
import { Player } from '@remotion/player';
import { Box, Spinner, Center, Text, VStack } from '@chakra-ui/react';
import { Main } from '../remotion/Main';
import { MainSchemaType } from '../remotion/schema';

interface VideoPreviewProps {
    title: string;
    subtitle: string;
    imageUrl: string;
    logoUrl?: string;
    brandColor?: string;
    accentColor?: string;
    isLoading?: boolean;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
    title,
    subtitle,
    imageUrl,
    logoUrl,
    brandColor = '#6D08BE',
    accentColor = '#FFB703',
    isLoading = false,
}) => {
    const inputProps: MainSchemaType = useMemo(() => ({
        title,
        subtitle,
        imageUrl,
        logoUrl,
        brandColor,
        accentColor,
    }), [title, subtitle, imageUrl, logoUrl, brandColor, accentColor]);

    if (isLoading) {
        return (
            <Center bg="gray.100" borderRadius="lg" aspectRatio={1} width="100%">
                <VStack spacing={4}>
                    <Spinner size="xl" color="purple.500" thickness="4px" />
                    <Text fontWeight="medium" color="gray.600">Preparing Video Preview...</Text>
                </VStack>
            </Center>
        );
    }

    if (!imageUrl) {
        return (
            <Center bg="gray.100" borderRadius="lg" aspectRatio={1} width="100%" border="2px dashed" borderColor="gray.300">
                <Text color="gray.500">Generate an image first to see the video preview</Text>
            </Center>
        );
    }

    return (
        <Box
            borderRadius="lg"
            overflow="hidden"
            boxShadow="xl"
            width="100%"
            aspectRatio={1}
            bg="black"
        >
            <Player
                component={Main}
                inputProps={inputProps}
                durationInFrames={150}
                fps={30}
                compositionWidth={1080}
                compositionHeight={1080}
                style={{
                    width: '100%',
                    height: '100%',
                }}
                controls
                loop
                autoPlay
            />
        </Box>
    );
};

export default VideoPreview;
