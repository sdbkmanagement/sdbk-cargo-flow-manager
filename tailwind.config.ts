
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
				// Couleurs de la marque SDBK
				brand: {
					blue: '#002855',
					gold: '#FFD700',
					lightGrey: '#F5F5F5',
					darkText: '#1A1A1A',
					secondaryText: '#4A4A4A'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#002855',
					foreground: '#FFFFFF'
				},
				secondary: {
					DEFAULT: '#F5F5F5',
					foreground: '#1A1A1A'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: '#F5F5F5',
					foreground: '#4A4A4A'
				},
				accent: {
					DEFAULT: '#FFD700',
					foreground: '#1A1A1A'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: '#FFFFFF',
					foreground: '#1A1A1A'
				},
				sidebar: {
					DEFAULT: '#002855',
					foreground: '#FFFFFF',
					primary: '#FFD700',
					'primary-foreground': '#1A1A1A',
					accent: 'hsl(217 32% 18%)',
					'accent-foreground': '#FFFFFF',
					border: 'hsl(217 32% 18%)',
					ring: '#FFD700'
				}
			},
			borderRadius: {
				lg: '0.75rem',
				md: '0.5rem',
				sm: '0.375rem',
				DEFAULT: '0.75rem'
			},
			boxShadow: {
				soft: '0 4px 20px rgba(0, 0, 0, 0.08)',
				elegant: '0 8px 32px rgba(0, 40, 85, 0.12)',
				'brand-glow': '0 0 20px rgba(255, 215, 0, 0.3)'
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
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
