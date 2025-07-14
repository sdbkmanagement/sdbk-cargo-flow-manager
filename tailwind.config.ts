
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				// Couleurs officielles SDBK
				sdbk: {
					green: '#43B02A',
					red: '#E30613',
					blue: '#005BAA',
					white: '#FFFFFF'
				},
				// Système de couleurs pour l'interface
				background: 'hsl(0 0% 100%)',
				foreground: 'hsl(222 84% 4.9%)',
				primary: {
					DEFAULT: '#43B02A',
					foreground: '#FFFFFF'
				},
				secondary: {
					DEFAULT: 'hsl(210 40% 96%)',
					foreground: 'hsl(222 84% 4.9%)'
				},
				destructive: {
					DEFAULT: '#E30613',
					foreground: '#FFFFFF'
				},
				warning: {
					DEFAULT: 'hsl(38 92% 50%)',
					foreground: 'hsl(48 96% 89%)'
				},
				success: {
					DEFAULT: '#43B02A',
					foreground: '#FFFFFF'
				},
				info: {
					DEFAULT: '#005BAA',
					foreground: '#FFFFFF'
				},
				muted: {
					DEFAULT: 'hsl(210 40% 96%)',
					foreground: 'hsl(215 16% 47%)'
				},
				accent: {
					DEFAULT: 'hsl(210 40% 96%)',
					foreground: 'hsl(222 84% 4.9%)'
				},
				border: 'hsl(214 31% 91%)',
				input: 'hsl(214 31% 91%)',
				ring: '#43B02A',
				card: {
					DEFAULT: '#FFFFFF',
					foreground: 'hsl(222 84% 4.9%)'
				},
				popover: {
					DEFAULT: '#FFFFFF',
					foreground: 'hsl(222 84% 4.9%)'
				},
				sidebar: {
					DEFAULT: '#005BAA',
					foreground: '#FFFFFF',
					primary: '#43B02A',
					'primary-foreground': '#FFFFFF',
					accent: 'hsl(217 32% 18%)',
					'accent-foreground': '#FFFFFF',
					border: 'hsl(217 32% 18%)',
					ring: '#43B02A'
				}
			},
			borderRadius: {
				lg: '12px',
				md: '8px',
				sm: '6px',
				DEFAULT: '8px'
			},
			boxShadow: {
				soft: '0 2px 8px rgba(0, 0, 0, 0.04)',
				card: '0 4px 12px rgba(0, 0, 0, 0.08)',
				elegant: '0 8px 24px rgba(0, 0, 0, 0.12)',
				'sdbk-green': '0 4px 14px rgba(67, 176, 42, 0.25)',
				'sdbk-blue': '0 4px 14px rgba(0, 91, 170, 0.25)',
				'sdbk-red': '0 4px 14px rgba(227, 6, 19, 0.25)'
			},
			keyframes: {
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'bounce-subtle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-2px)' }
				}
			},
			animation: {
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'bounce-subtle': 'bounce-subtle 0.5s ease-in-out'
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
