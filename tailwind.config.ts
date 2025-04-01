
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	safelist: [
		'text-green-300',
		'text-green-400',
		'text-green-500',
		'text-green-600',
		'text-red-300',
		'text-red-400',
		'text-red-500',
		'text-red-600',
		'text-white',
		'text-black',
		'text-muted-foreground',
		'text-gray-300',
		'text-gray-400',
		'bg-amber-700',
		'bg-orange-800',
		'bg-green-800',
		'bg-blue-800',
		'bg-green-600',
		'bg-brand-navy',
		'bg-brand-navy/70',
		'bg-brand-blue',
		'bg-brand-blue/10',
		'bg-brand-blue/20',
		'bg-brand-lime',
		'bg-brand-lime/10',
		'bg-brand-lime/20',
		'bg-white',
		'bg-white/5',
		'bg-white/10',
		'bg-white/20',
		'bg-opacity-80',
		'bg-opacity-90',
		'text-brand-navy',
		'text-brand-blue',
		'text-brand-lime',
		'border-brand-navy',
		'border-brand-blue',
		'border-brand-lime',
		'border-white',
		'border-white/10',
		'border-white/20',
		'border-r',
		'border-l',
		'border',
		'border-b',
		'border-t',
		'border-black',
		'border-gray-300',
		'font-bold',
		'font-semibold',
		'font-medium',
		'text-xs',
		'text-sm',
		'text-lg',
		'text-xl',
		'text-2xl',
		'text-3xl'
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
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				brand: {
					navy: '#002A46',
					blue: '#00B0F0',
					lime: '#7ED957'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
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
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
