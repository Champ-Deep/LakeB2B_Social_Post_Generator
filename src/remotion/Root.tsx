import React from 'react';
import { Composition } from 'remotion';
import { Main } from './Main';
import { MainSchema } from './schema';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="SocialPost"
                component={Main}
                durationInFrames={150} // 5 seconds at 30fps
                fps={30}
                width={1080}
                height={1080}
                schema={MainSchema}
                defaultProps={{
                    title: 'LakeB2B Social Post',
                    subtitle: 'Empowering your brand with AI-driven social content.',
                    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1080&h=1080',
                    logoUrl: '/logos/lakeb2b-logo-square.png',
                    brandColor: '#6D08BE',
                    accentColor: '#FFB703',
                }}
            />
        </>
    );
};
