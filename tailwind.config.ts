
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
		'bg-gradient-to-r',
		'bg-gradient-to-br',
		'from-brand-navy',
		'from-brand-navy/75',
		'via-brand-navy',
		'via-brand-navy/60',
		'to-brand-lime',
		'to-brand-lime/25',
		'bg-green-900/10',
		'hover:bg-green-900/20',
		'bg-red-900/10',
		'hover:bg-red-900/20',
		'text-brand-navy',
		'text-brand-blue',
		'text-brand-lime',
		'border-brand-navy',
		'border-brand-blue',
		'border-brand-lime',
		'border-brand-lime/30',
		'border-r-[1px]',
		'border-l-[1px]',
		'border-[1px]',
		'border-[2px]',
		'border-[3px]',
		'border-black',
		'border-gray-300',
		'border-white/5',
		'border-white/10',
		'hover:bg-brand-navy/80',
		'font-bold',
		'text-xs',
		'text-sm',
		'text-lg',
		'text-xl',
		'text-2xl',
		'text-3xl',
		// New color classes for group colors
		'bg-purple-500/20',
		'bg-amber-500/20',
		'bg-emerald-500/20',
		'bg-sky-500/20',
		'bg-rose-500/20',
		'bg-lime-500/20',
		'bg-orange-500/20',
		'bg-cyan-500/20',
		'ring-purple-400/30',
		'ring-amber-400/30',
		'ring-emerald-400/30',
		'ring-sky-400/30',
		'ring-rose-400/30',
		'ring-lime-400/30',
		'ring-orange-400/30',
		'ring-cyan-400/30',
		'border-purple-400/30',
		'border-amber-400/30',
		'border-emerald-400/30',
		'border-sky-400/30',
		'border-rose-400/30',
		'border-lime-400/30',
		'border-orange-400/30',
		'border-cyan-400/30',
		'text-purple-400',
		'text-amber-400',
		'text-emerald-400',
		'text-sky-400',
		'text-rose-400',
		'text-lime-400',
		'text-orange-400',
		'text-cyan-400',
		'hover:bg-purple-500/30',
		'hover:bg-amber-500/30',
		'hover:bg-emerald-500/30',
		'hover:bg-sky-500/30',
		'hover:bg-rose-500/30',
		'hover:bg-lime-500/30',
		'hover:bg-orange-500/30',
		'hover:bg-cyan-500/30',
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
					lime: '#B4D335'
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
