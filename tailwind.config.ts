
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
				// Palette moderne SDBK - couleurs principales
				sdbk: {
					primary: '#0F172A',      // Bleu marine profond
					secondary: '#1E293B',    // Gris ardoise
					accent: '#3B82F6',       // Bleu moderne
					success: '#10B981',      // Vert émeraude
					warning: '#F59E0B',      // Ambre
					danger: '#EF4444',       // Rouge corail
					info: '#06B6D4',         // Cyan
					light: '#F8FAFC',        // Gris très clair
					medium: '#64748B',       // Gris moyen
					dark: '#0F172A'          // Très sombre
				},
				// Système de couleurs optimisé
				background: 'hsl(210 40% 98%)',
				foreground: 'hsl(222 84% 4.9%)',
				primary: {
					DEFAULT: 'hsl(221 83% 53%)',
					foreground: 'hsl(210 40% 98%)'
				},
				secondary: {
					DEFAULT: 'hsl(210 40% 96%)',
					foreground: 'hsl(222 84% 4.9%)'
				},
				destructive: {
					DEFAULT: 'hsl(0 84% 60%)',
					foreground: 'hsl(210 40% 98%)'
				},
				success: {
					DEFAULT: 'hsl(142 71% 45%)',
					foreground: 'hsl(210 40% 98%)'
				},
				warning: {
					DEFAULT: 'hsl(38 92% 50%)',
					foreground: 'hsl(222 84% 4.9%)'
				},
				info: {
					DEFAULT: 'hsl(188 95% 42%)',
					foreground: 'hsl(210 40% 98%)'
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
				ring: 'hsl(221 83% 53%)',
				card: {
					DEFAULT: 'hsl(0 0% 100%)',
					foreground: 'hsl(222 84% 4.9%)'
				},
				popover: {
					DEFAULT: 'hsl(0 0% 100%)',
					foreground: 'hsl(222 84% 4.9%)'
				}
			},
			borderRadius: {
				xl: '1rem',
				lg: '0.75rem',
				md: '0.5rem',
				sm: '0.25rem',
				DEFAULT: '0.5rem'
			},
			boxShadow: {
				'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
				'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
				'large': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
				'elegant': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
				'glow': '0 0 20px rgba(59, 130, 246, 0.15)',
				'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
			},
			keyframes: {
				// Animations fluides et modernes
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(8px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-up': {
					'0%': { opacity: '0', transform: 'translateY(16px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-down': {
					'0%': { opacity: '0', transform: 'translateY(-16px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.95)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				'pulse-soft': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				}
			},
			animation: {
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-up': 'slide-up 0.4s ease-out',
				'slide-down': 'slide-down 0.4s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'shimmer': 'shimmer 2s linear infinite',
				'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
				'92': '23rem',
				'96': '24rem',
				'104': '26rem',
				'112': '28rem',
				'120': '30rem'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
