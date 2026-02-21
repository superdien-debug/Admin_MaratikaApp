/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                maroon: {
                    50: '#fff1f2',
                    800: '#5e0b0b',
                    900: '#3d0808',
                }
            }
        },
    },
    plugins: [],
}
