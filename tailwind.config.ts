
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
			fontFamily: {
				'varela': ['Varela Round', 'Arial', 'sans-serif'],
			},
			colors: {
				pinkKid: '#ff72a6',
				yellowKid: '#fff685',
				greenKid: '#77e7a6',
				turquoiseKid: '#6feaff',
				orangeKid: '#fff1c9',
				blueKid: '#55aaff'
			},
			backgroundImage: {
				kidGradient: "linear-gradient(135deg, #ff72a6 0%, #fff685 35%, #77e7a6 68%, #6feaff 100%)"
			},
			borderRadius: {
				mega: "2rem"
			},
      keyframes: {
        'trophy-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px) scale(1.2)', filter: "brightness(1.25)" },
        },
        'wand-fly': {
          '0%': { transform: 'translate(-10vw, 110vh) rotate(90deg)', opacity: '0' },
          '25%': { transform: 'translate(25vw, 60vh) rotate(45deg)', opacity: '1' },
          '50%': { transform: 'translate(50vw, 20vh) rotate(0deg)' },
          '75%': { transform: 'translate(75vw, 40vh) rotate(-45deg)' },
          '100%': { transform: 'translate(110vw, -10vh) rotate(-90deg)', opacity: '0'},
        },
        'sparkle': {
          '0%, 100%': { opacity: '0', transform: 'scale(0.5)' },
          '50%': { opacity: '1', transform: 'scale(1.5)' },
        },
        'rise': {
          'to': {
            transform: 'translateY(-110vh) rotate(15deg)',
          }
        }
      },
      animation: {
        'trophy-bounce': 'trophy-bounce 0.8s cubic-bezier(0.4,0,0.6,1) both',
        'wand-fly': 'wand-fly 5s ease-in-out 1s forwards',
        'sparkle': 'sparkle 1.5s ease-in-out infinite alternate',
        'rise': 'rise linear forwards',
      }
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
