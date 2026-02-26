/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            borderRadius: {
                lg: '0px',
                md: '0px',
                sm: '0px',
                DEFAULT: '0px',
            },
            colors: {
                background: '#FFFFFF',
                foreground: '#000000',
                card: {
                    DEFAULT: '#FFFFFF',
                    foreground: '#000000'
                },
                popover: {
                    DEFAULT: '#FFFFFF',
                    foreground: '#000000'
                },
                primary: {
                    DEFAULT: '#000000',
                    foreground: '#FFFFFF'
                },
                secondary: {
                    DEFAULT: '#F4F4F5',
                    foreground: '#000000'
                },
                muted: {
                    DEFAULT: '#F4F4F5',
                    foreground: '#737373'
                },
                accent: {
                    DEFAULT: '#FF4F00',
                    foreground: '#FFFFFF'
                },
                destructive: {
                    DEFAULT: '#FF4F00',
                    foreground: '#FFFFFF'
                },
                border: '#E5E5E5',
                input: '#E5E5E5',
                ring: '#000000',
                chart: {
                    '1': '#000000',
                    '2': '#737373',
                    '3': '#FF4F00',
                    '4': '#F4F4F5',
                    '5': '#E5E5E5'
                }
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                },
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                'fade-up': {
                    '0%': { opacity: '0', transform: 'translateY(40px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' }
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-in': 'fade-in 0.6s ease-out',
                'fade-up': 'fade-up 0.8s ease-out',
                'scale-in': 'scale-in 0.5s ease-out',
                'float': 'float 3s ease-in-out infinite'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
