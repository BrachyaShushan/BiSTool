import React from 'react';
import { FiHome, FiSettings, FiUser, FiHeart } from 'react-icons/fi';
import IconWrapper from './IconWrapper';

const IconWrapperDemo: React.FC = () => {
    const emojiIcons = ['🌐', '🔒', '🛠️', '🚧', '🚀', '🏠', '⚙️', '👤', '❤️'];
    const reactIcons = [FiHome, FiSettings, FiUser, FiHeart];

    return (
        <div className="p-6 space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Icon Wrapper Demo
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                    Demonstrating icon color preservation and different variants
                </p>
            </div>

            {/* Emoji Icons with Color Preservation */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Emoji Icons - Color Preservation
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    {emojiIcons.map((emoji, index) => (
                        <div key={index} className="space-y-2">
                            <div className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                <IconWrapper
                                    icon={emoji}
                                    size="2xl"
                                    variant="colored"
                                    className="block mx-auto"
                                />
                                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    Colored
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Emoji Icons with Monochrome */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Emoji Icons - Monochrome
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    {emojiIcons.slice(0, 6).map((emoji, index) => (
                        <div key={index} className="space-y-2">
                            <div className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                <IconWrapper
                                    icon={emoji}
                                    size="2xl"
                                    variant="monochrome"
                                    className="block mx-auto text-blue-600 dark:text-blue-400"
                                />
                                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    Monochrome
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* React Icons */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    React Icons
                </h3>
                <div className="grid grid-cols-4 gap-4">
                    {reactIcons.map((Icon, index) => (
                        <div key={index} className="space-y-2">
                            <div className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                <IconWrapper
                                    icon={Icon}
                                    size="2xl"
                                    className="block mx-auto text-blue-600 dark:text-blue-400"
                                />
                                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    React Icon
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Different Sizes */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Different Sizes
                </h3>
                <div className="flex items-center justify-center space-x-4">
                    {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
                        <div key={size} className="text-center">
                            <IconWrapper
                                icon="🚀"
                                size={size}
                                variant="colored"
                                className="block"
                            />
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {size}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Context Testing - Icons in different colored backgrounds */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Context Testing - Icons in Different Backgrounds
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                        <IconWrapper
                            icon="🌐"
                            size="xl"
                            variant="colored"
                            className="block mx-auto"
                        />
                        <p className="text-center text-white text-sm mt-2">Blue Background</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                        <IconWrapper
                            icon="🔒"
                            size="xl"
                            variant="colored"
                            className="block mx-auto"
                        />
                        <p className="text-center text-white text-sm mt-2">Green Background</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                        <IconWrapper
                            icon="🚀"
                            size="xl"
                            variant="colored"
                            className="block mx-auto"
                        />
                        <p className="text-center text-white text-sm mt-2">Red Background</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IconWrapperDemo; 