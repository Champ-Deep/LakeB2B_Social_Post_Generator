import React from 'react';
import {
    AbsoluteFill,
    InterpolateOptions,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
    Img,
} from 'remotion';
import { MainSchemaType } from './schema';

export const Main: React.FC<MainSchemaType> = ({
    title,
    subtitle,
    imageUrl,
    logoUrl,
    brandColor,
    accentColor,
}) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    // Animations
    const entrance = spring({
        frame,
        fps,
        config: {
            damping: 12,
        },
    });

    const contentEntrance = spring({
        frame: frame - 15,
        fps,
        config: {
            damping: 12,
        },
    });

    // Background Ken Burns effect
    const scale = interpolate(frame, [0, fps * 5], [1, 1.1], {
        extrapolateRight: 'clamp',
    });

    return (
        <AbsoluteFill style={{ backgroundColor: 'white', overflow: 'hidden' }}>
            {/* Background Image */}
            <AbsoluteFill style={{ transform: `scale(${scale})` }}>
                <Img
                    src={imageUrl}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.8,
                    }}
                />
            </AbsoluteFill>

            {/* Gradient Overlay */}
            <AbsoluteFill
                style={{
                    background: `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%)`,
                }}
            />

            {/* Content */}
            <AbsoluteFill
                style={{
                    padding: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    transform: `translateY(${interpolate(entrance, [0, 1], [100, 0])}px)`,
                    opacity: entrance,
                }}
            >
                {/* Headline */}
                <div
                    style={{
                        fontSize: 80,
                        fontWeight: 800,
                        color: 'white',
                        fontFamily: 'Montserrat, sans-serif',
                        marginBottom: 20,
                        lineHeight: 1.1,
                        textShadow: '0 4px 10px rgba(0,0,0,0.5)',
                    }}
                >
                    {title}
                </div>

                {/* Subtitle / Message */}
                <div
                    style={{
                        fontSize: 32,
                        fontWeight: 500,
                        color: 'white',
                        fontFamily: 'Montserrat, sans-serif',
                        maxWidth: '80%',
                        lineHeight: 1.4,
                        opacity: contentEntrance,
                        transform: `translateX(${interpolate(contentEntrance, [0, 1], [-20, 0])}px)`,
                    }}
                >
                    {subtitle}
                </div>

                {/* Logo */}
                {logoUrl && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 60,
                            left: 60,
                            width: 150,
                            opacity: entrance,
                        }}
                    >
                        <Img src={logoUrl} style={{ width: '100%' }} />
                    </div>
                )}

                {/* Accent Bar */}
                <div
                    style={{
                        width: 100,
                        height: 10,
                        backgroundColor: accentColor,
                        marginTop: 40,
                        transform: `scaleX(${contentEntrance})`,
                        transformOrigin: 'left',
                    }}
                />
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
