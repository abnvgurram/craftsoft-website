
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#2896cd',
            50: '#edf6fb',
            100: '#d4eaf5',
            200: '#a9d5eb',
            300: '#7ec0e1',
            400: '#53abd7',
            500: '#2896cd',
            600: '#1a7eb0',
            700: '#156691',
            900: '#0b3653',
        },
        secondary: {
            main: '#6C5CE7',
        },
        background: {
            default: '#f8fafc',
            paper: '#ffffff',
        },
        text: {
            primary: '#1e293b',
            secondary: '#64748b',
        },
        error: {
            main: '#EF4444',
            light: '#fee2e2',
        },
        success: {
            main: '#10B981',
        },
    },
    typography: {
        fontFamily: '"Inter", sans-serif',
        h1: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
        h2: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
        h3: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
        h4: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
        h5: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
        h6: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
        button: { fontFamily: '"Outfit", sans-serif', fontWeight: 600, textTransform: 'none' },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    boxShadow: 'none',
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #2896cd 0%, #6C5CE7 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #1a7eb0 0%, #5b4ed6 100%)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        backgroundColor: '#ffffff',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
            },
        },
    },
});

export default theme;
