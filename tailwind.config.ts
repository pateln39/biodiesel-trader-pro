
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
		'text-green-600',
		'text-red-600',
		'text-white',
		'text-black',
		'text-muted-foreground',
		'bg-orange-800',
		'bg-green-800',
		'bg-blue-800',
		'bg-green-600',
		'bg-gray-100',
		'bg-gray-200',
		'bg-gray-300',
		'bg-gray-700',
		'bg-white',
		'bg-[#1A1F2C]',
		'bg-gray-500',
		'bg-brand-navy',
		'bg-brand-blue',
		'bg-brand-lime',
		'text-brand-navy',
		'text-brand-blue',
		'text-brand-lime',
		'border-brand-navy',
		'border-brand-blue',
		'border-brand-lime',
		'border-r-[1px]',
		'border-l-[1px]',
		'border-[1px]',
		'border-[2px]',
		'border-[3px]',
		'border-black',
		'border-gray-300',
		'font-bold',
		'text-xs',
		'text-sm',
		'text-lg',
		'text-xl',
		'text-2xl',
		'text-3xl',
		'bg-opacity-10',
		'bg-opacity-20',
		'bg-opacity-30',
		'hover:bg-opacity-20',
		'hover:bg-opacity-30',
		'hover:bg-brand-navy',
		'hover:bg-brand-blue',
		'hover:bg-brand-lime',
		'hover:bg-opacity-10',
		'even:bg-brand-navy',
		'even:bg-opacity-5',
		'odd:bg-brand-navy',
		'odd:bg-opacity-10',
		'border-brand-blue/20',
		'bg-brand-dark-navy',
		'bg-brand-navy/90',
		'bg-brand-navy/80',
		'bg-brand-navy/70',
		'bg-brand-navy/60',
		'bg-brand-navy/50',
		'bg-brand-navy/40',
		'bg-brand-navy/30',
		'bg-brand-navy/20',
		'bg-brand-navy/10',
		'bg-brand-navy/5',
		'bg-brand-blue/90',
		'bg-brand-blue/80',
		'bg-brand-blue/70',
		'bg-brand-blue/60',
		'bg-brand-blue/50',
		'bg-brand-blue/40',
		'bg-brand-blue/30',
		'bg-brand-blue/20',
		'bg-brand-blue/10',
		'bg-brand-blue/5',
		'bg-brand-lime/90',
		'bg-brand-lime/80',
		'bg-brand-lime/70',
		'bg-brand-lime/60',
		'bg-brand-lime/50',
		'bg-brand-lime/40',
		'bg-brand-lime/30',
		'bg-brand-lime/20',
		'bg-brand-lime/10',
		'bg-brand-lime/5',
		'text-success',
		'text-danger',
		'text-neutral',
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
					navy: '#091C3E',
					blue: '#1D59A9',
					lime: '#B4D335',
					'dark-blue': '#0C182A',
					'dark-navy': '#051126',
					'light-blue': '#E6F0FF',
					grey: '#F4F5F7',
				},
				success: '#10B981',  // emerald-500
				danger: '#EF4444',  // red-500
				neutral: '#6B7280',  // gray-500
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
