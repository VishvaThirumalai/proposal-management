import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white mt-auto">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">SH</span>
                        </div>
                        <span className="font-semibold">StartupHub</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-2 md:mt-0">
                        © 2026 StartupHub. All rights reserved.
                    </div>
                    <div className="flex space-x-4 mt-2 md:mt-0">
                        <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy</a>
                        <a href="#" className="text-gray-400 hover:text-white text-sm">Terms</a>
                        <a href="#" className="text-gray-400 hover:text-white text-sm">Support</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;